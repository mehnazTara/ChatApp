const form = document.querySelector("form");
const input = document.querySelector(".input");
const messages = document.querySelector(".messages");
const users = document.querySelector("#usernames");
const header = document.querySelector(".header");

let defaultUserNameColor = "#DB7093";


const socket = io();

let existingUserName = getCookie("username");
let existingColor = getCookie("nickcolor");

$(document).ready(function() {
    if(existingColor){
        defaultUserNameColor = existingColor;
    }
    if(existingUserName){
        socket.emit("existing_user", {isExisting: true, username : existingUserName});
    }else{
        socket.emit("existing_user", {isExisting: false, username : existingUserName});
    }

});


form.addEventListener("submit", function (event) {
    event.preventDefault();
    msg = input.value;
    if (msg.startsWith("/nickcolor")) {
        console.log("nickcolor:" + msg);
        socket.emit("change_nickcolor", {color: msg.slice(11)});
    } else if (msg.startsWith("/nick")) {
        socket.emit("change_nickname", {username: msg.slice(6)});
    } else {
        socket.emit("chat_message", {
            message: input.value
        });
    }
    input.value = "";
    return false;
}, false);

socket.on("chat_history", function (data) {
    console.log(data);
    for (record of data) {
        time = formatTime(record.time);
        record.time = time;
        addMessage(record, "#000000");
    }
});

socket.on("user_list", function (data) {
    //$('#user-list').empty();
    while( users.firstChild ){
        users.removeChild( users.firstChild );
    }

    for( user of data.list) {
        console.log("Inside user list" + user);
        const li = document.createElement("li");
        li.innerHTML = user;

        users.appendChild(li);
    }
});

socket.on("chat_message", function (data) {
    time = formatTime(data.time);
    data.time = time;
    addMessage(data,"#000000");
});

socket.on("user_join", function (data) {
    addMessage("You have joined the chat as " + data + ".");
});

socket.on("server_message", function (data) {
    time = formatTime(data.time);
    data.time = time;
    addMessage(data, "#680C10");
})


socket.on("user_leave", function (data) {
    addMessage(data + " has left the chat.");
});


socket.on("show_nickname", function (data) {
    setCookie("username", data);
    header.innerHTML = "Welcome to chat room, " + data + " !";
});

socket.on("color_change", function (data) {
    setCookie("nickcolor", data);
    defaultUserNameColor=data;

});

function addMessage(data, messageColor) {
    let li = document.createElement("li");


    let time = document.createElement("span");
    time.setAttribute("id", "time");
    time.innerText = data.time;

    let username = document.createElement("span");
    username.setAttribute("id", "username");
    username.style.color=defaultUserNameColor;
    username.innerText = data.username + ": ";

    let message = document.createElement("span");
    message.setAttribute("id", "m");
    message.style.color=messageColor;
    message.innerText = data.message;


    li.appendChild(time);
    li.appendChild(username);
    li.appendChild(message);

    messages.appendChild(li);
    messages.scrollTo(0, document.body.scrollHeight);
}

function formatTime(currentTime) {

    return currentTime.slice(0, 5);
}

//code snippet taken from https://www.w3schools.com/js/js_cookies.asp
function setCookie(cname, cvalue) {
    var d = new Date();
    d.setTime(d.getTime() + (1*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

//code snippet taken from https://www.w3schools.com/js/js_cookies.asp
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
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