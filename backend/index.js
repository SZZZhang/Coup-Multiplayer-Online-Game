
var express = require('express');
var app = express();

var server = app.listen(5000, () => {
    console.log("Init server")
});
var io = require('socket.io')(server);

let Game = require('./game');

app.use(express.static('.'));

let rooms = [];

let cards = ['Duke', 'Duke', 'Duke',
    'Assassin', 'Assassin', 'Assassin',
    'Ambassador', 'Ambassador', 'Ambassador',
    'Captain', 'Captain', 'Captain',
    'Contessa', 'Contessa', 'Contessa'];

io.on('connection', (socket) => {
    console.log("connected to server " + socket.id);
    socket.on('disconnect', () => {
        console.log("user disconnected " + socket.id);
    });

    //creates game room, data should contain "room" key
    socket.on('createRoom', (data) => {
        if (!rooms.find(data.room)) {
            socket.join(data.room);
            rooms.push(new Room(data.room, [...cards], [new Player(data.username)]));
    
            console.log("joined new room:", data.room);
        } else {
            socket.emit('createRoomFailed',
                { message: 'Please choose another name for the room' })
        }
    });

    //joins game room
    socket.on('joinGame', (data) => {
        if (rooms.find(data.room)) {
            socket.join(data.room)
        } else {
            socket.emit('joinRoomFailed', { message: "Wrong room name" })
        }
    })

    socket.on('startGame', );

    socket.on('getActions', (data) => {
        socket.emit('actions', Game.getActions(data.player));
    })

    //counteractions to another player's action 
    socket.on('action', (data) => {
        socket.emit('actions', Game.getCounterActions(data.player, data.action))
    })

});

function startGame(room, player) {
    player.cards = []
}

class Room {
    constructor(name, cards, players) {
        this.name = name; 
        this.cards = cards;
        this.players = players;
    }
}



