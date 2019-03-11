const express = require('express');
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3000;

const path = require('path');


//Initialize application with route
app.use(express.static(path.join(__dirname, '/public')));


var session = require("express-session")({
    secret: "session-secret",
    resave: true,
    saveUninitialized: true
});

//socket session
var sharedsession = require("express-socket.io-session");


// Use express-session middleware for express
app.use(session);

// Use shared session middleware for socket.io
// setting autoSave:true
io.use(sharedsession(session, {
    autoSave: true
}));


app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});


let users = [];
let counts = [];
let history = [];

let count = 1;
const defaultUsername = "user";


io.sockets.on("connection", function (socket) {

        // getting all cookies
        let cookies = socket.handshake.headers.cookie;

        let userIDcookie = getCookie(cookies, "username");
        let colorCookie = getCookie(cookies, "nick_color");


        if (userIDcookie) {
            socket.username = userIDcookie;
            if (!users.includes(socket.username)) {
                users.push(socket.username);
            }

        } else {
            //assiging unique username on connection
            counts = counts.sort(function (a, b) {
                return a - b
            });
            if (counts.includes(count)) {
                count = counts[counts.length - 1] + 1;
            }
            socket.username = defaultUsername + count;
            counts.push(count);
            users.push(socket.username);
            socket.emit("set_cookie_username", socket.username);

        }

        if(colorCookie){
            socket.emit("color_change", "#" + colorCookie);
        }


        io.emit("user_join", {time: new Date().toTimeString(), username: socket.username});
        socket.emit("show_nickname", socket.username);


        socket.emit("chat_history", history);


        io.emit("user_list", {list: users});


        //on receiving new message from client side
        socket.on("chat_message", function (data) {
            data.username = this.username;
            data.time = new Date().toTimeString();


            if (history.length < 200) {
                history.push(data);
            } else {
                history.shift();
                history.push(data);
            }

            io.emit("chat_message", data);
        });


        //changing nick name request
        socket.on("change_nickname", function (data) {

            oldnickName = socket.username;

            // Not supported in <IE9
            let index = users.indexOf(data.username);
            if (index === -1) {
                socket.username = data.username;
                users.push(socket.username);
                users = users.filter(v => v !== oldnickName);
                io.emit("user_list", {list: users});
                socket.emit("show_nickname", socket.username);
                socket.emit("set_cookie_username", socket.username);

            } else {
                date = new Date().toTimeString();
                socket.emit("server_message", {
                    time: date,
                    username: "system",
                    message: "You cannot have this nickname! Already Taken"
                });
            }

        });


        // changing nick name colour request
        socket.on("change_nickcolor", function (data) {

            let validHex = '/^[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}';
            let pattern = new RegExp(validHex);

            if (pattern.test(data.color)) {
                socket.emit("color_change", "#" + data.color);
                socket.emit("set_cookie_color", "#" + data.color);
            } else {
                date = new Date().toTimeString();
                socket.emit("server_message", {time: date, username: "system", message: "Not a valid colour hex"});
            }

        });


        // on disconnect
        socket.on("disconnect", function (data) {
            socket.broadcast.emit("user_leave", {time: new Date().toTimeString(), username: socket.username});
            users = users.filter(v => v !== socket.username);
            io.emit("user_list", {list: users});

        });
    }
);


// retrieves the specified cookie
//code snippet taken from https://www.w3schools.com/js/js_cookies.asp
function getCookie(cookies, cname) {
    var name = cname + "=";
    var ca = cookies.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

http.listen(port, function () {
    console.log("Listening on *:" + port);
});