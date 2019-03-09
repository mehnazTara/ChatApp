const express=require('express');
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3000;

var path=require('path');

//Initialize application with route
app.use(express.static(path.join(__dirname, '/public')));

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/index.html");
});

let users = [];
let history = [];

let count = 1;
const defaultUsername = "user";
io.on("connection", function(socket) {

    // check if existing user
    socket.on("existing_user", function(data) {

        if(data.isExisting){
            socket.username = data.username;
        }else {
            //assiging unique username on connection
            socket.username = defaultUsername + count;
            count = count + 1;
            users.push(socket.username);
            socket.emit("user_join", socket.username);
        }

        socket.emit("show_nickname", socket.username);

    });


   // console.log(socket.chatHistory );
    socket.emit("chat_history", history);

    //sending users list to the client
    io.emit("user_list", { list: users});


    //on receiving new message from client side
    socket.on("chat_message", function(data) {
        data.username = this.username;
        data.time = new Date().toTimeString();


        if(history.length < 200) {
            history.push(data);
        }else{
            history.shift();
            history.push(data);
        }
        console.trace(history);

        io.emit("chat_message", data);
    });


    //changing nick name request
    socket.on("change_nickname", function(data) {
        console.log("Inside change user name :" + socket.username);

        oldnickName = socket.username;

        let index = users.indexOf(data.username);    // <-- Not supported in <IE9
        console.log(index);
        if (index === -1) {
            socket.username = data.username;
            console.log(socket.username);
            users.push(socket.username);
            users = users.filter(v => v !== oldnickName);
            io.emit("user_list", { list: users});
            socket.emit("show_nickname", socket.username);

        }else{
            date  = new Date().toTimeString();
            socket.emit("server_message", { time: date, username : "system", message: "You cannot have this nickname! Already Taken"});
        }

        console.log(users);
    });


    // changing nick name colour request
    socket.on("change_nickcolor", function(data) {
        console.log("Inside change colour name :" + socket.username);
        console.log(data.color);

        let validHex='/([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i';
        let pattern = new RegExp(validHex);

        if(true){
            console.log(data.color);
            socket.emit("color_change", "#" + data.color);
        }else{
            date  = new Date().toTimeString();
            socket.emit("server_message", { time : date, username : "system", message: "Not a valid colour hex"});
        }

    });


    // on disconnect
    socket.on("disconnect", function(data) {
        socket.broadcast.emit("user_leave", socket.username);
        users = users.filter(v => v !== socket.username);
        io.emit("user_list", { list: users});


    });
});


http.listen(port, function() {
    console.log("Listening on *:" + port);
});