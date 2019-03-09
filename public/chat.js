const form = document.querySelector("form");
const input = document.querySelector(".input");
const messages = document.querySelector(".messages");
const users = document.querySelector("#usernames");
const header = document.querySelector(".header");

let defaultUserNameColor = "#DB7093";


const socket = io();

let existingUserName = getCookie("username");
let existingColor = getCookie("nickcolor");


//first event to check if cookie exists
$(document).ready(function() {
    console.log("inside load " + existingUserName);
    if(existingColor){
        defaultUserNameColor = existingColor;
    }
    if(existingUserName){
        socket.emit("existing_user", {isExisting: true, username : existingUserName});
    }else{
        socket.emit("existing_user", {isExisting: false, username : existingUserName});
    }

});


// on submitting new message . This block also checks if /nick or /nickcolor is submitted
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



// show past chat log (upto 200)
socket.on("chat_history", function (data) {
    console.log(data);
    for (record of data) {
        time = formatTime(record.time);
        record.time = time;
        addMessage(record, "#000000");
    }
});


//updates user list
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


// new message to be added in the chat log
socket.on("chat_message", function (data) {
    time = formatTime(data.time);
    data.time = time;
    addMessage(data,"#000000");
});


// message for user to let them know of username
socket.on("user_join", function (data) {
    data.message = "You have joined the chat as " + data.username + ".";
    time = formatTime(data.time);
    data.time = time;
    addMessage(data, '#000000');
});


//server side warning messages will be in red color
socket.on("server_message", function (data) {
    time = formatTime(data.time);
    data.time = time;
    addMessage(data, "#680C10");
});


//user leave notification
socket.on("user_leave", function (data) {
    time = formatTime(data.time);
    data.time = time;
    data.message = data.username + " has left the chat.";
    addMessage(data, "#000000");
});


//displays nickname in the header section
socket.on("show_nickname", function (data) {
    setCookie("username", data);
    header.innerHTML = "Welcome to chat room, " + data + " !";
});


//changes username deafault color
socket.on("color_change", function (data) {
    setCookie("nickcolor", data);
    defaultUserNameColor=data;

});


// adds message to list of messages in the chat log
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


// formats time stamps to show hour and mins only
function formatTime(currentTime) {

    return currentTime.slice(0, 5);
}


// set a cookie with expiry date of 1 day
//code snippet taken from https://www.w3schools.com/js/js_cookies.asp
function setCookie(cname, cvalue) {
    var d = new Date();
    d.setTime(d.getTime() + (1*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}


// retrieves the specified cookie
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