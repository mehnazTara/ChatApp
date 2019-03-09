const express=require('express');
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3000;

var path=require('path');

//Initialize application with route
app.use(express.static('public/'));

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/index.html");
});

let users = [];
let history = {};
let count = 1;
const defaultUsername = "user";
io.on("connection", function(socket) {

    socket.chatHistory = new Array(200);
    socket.username = defaultUsername + count;
    console.log(socket.username);
    count = count + 1;
    users.push(socket.username);
    socket.emit("user_join", socket.username);

    console.log(socket.chatHistory );
   // socket.emit("chat_history", chatHistory);


    socket.on("chat_message", function(data) {
        data.username = this.username;
        data.time = new Date().toTimeString();


        if(socket.chatHistory .length < 200) {
            socket.chatHistory .push(data);
        }else{
            socket.chatHistory  = new Array(200);
            socket.chatHistory .push(data);
        }

        history[socket.username] = socket.chatHistory;
        console.trace(history);
        console.log("After pushing" + history[socket.username]);
        io.emit("chat_message", data);
    });


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
        }else{
            socket.emit("nickname_reject", "You cannot have this nickname! Already Taken");
        }

        console.log(users);
    });

    socket.on("change_nickcolor", function(data) {
        console.log("Inside change colour name :" + socket.username);

        let validHex='/([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i';
        let pattern = new RegExp(validHex);

        if( pattern.test(data.color)){
            console.log(data.color);
            socket.emit("colour_change", "#" + data.color);
        }else{
            socket.emit("colour_reject", "Not a valid colour hex");
        }

    });

    socket.on("disconnect", function(data) {
        socket.broadcast.emit("user_leave", this.username);
    });
});


http.listen(port, function() {
    console.log("Listening on *:" + port);
});