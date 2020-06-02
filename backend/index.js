var express = require('express');
var app = express();

var server = app.listen(5000, () => {
    console.log("Init server")});
var io = require('socket.io')(server);


app.use(express.static('.'));

io.on('connection', (socket) => {
    console.log("connected to server " + socket.id);
    socket.on('disconnect', () => {
        console.log("user disconnected " + socket.id);
    });
});


