var express = require('express');
var app = express();

var server = app.listen(5000, () => {
    console.log("Init server")});
var io = require('socket.io')(server);


app.use(express.static('.'));

let rooms = {}; 

io.on('connection', (socket) => {
    console.log("connected to server " + socket.id);
    socket.on('disconnect', () => {
        console.log("user disconnected " + socket.id);
    });

    //creates game room, data should contain "room" key
    socket.on('createRoom', (data) => {
        if(!rooms.find(data.room)){
                socket.join(data.room);
                rooms.push({roomName: 1});
                console.log("joined new room:", data.room);
        } else {
            socket.emit('createRoomFailed', 
            { message: 'Please choose another name for the room'})
        }
    });

    //joins game room
    socket.on('joinGame', (data) => {
        if(rooms.find(data.room)) {
            socket.join(data.room)
        } else {
            socket.emit('joinRoomFailed', { message: "Wrong room name"})
        }
    })

});





