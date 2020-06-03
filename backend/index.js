
var express = require('express');
var app = express();
const Player = require('./Player');

var server = app.listen(5000, () => {
    console.log("Init server")
});
var io = require('socket.io')(server);

let Game = require('./game');

app.use(express.static('.'));

let rooms = {};

let cards = ['Duke', 'Duke', 'Duke',
    'Assassin', 'Assassin', 'Assassin',
    'Ambassador', 'Ambassador', 'Ambassador',
    'Captain', 'Captain', 'Captain',
    'Contessa', 'Contessa', 'Contessa'];

// sending to all clients in 'game' room, including sender
io.in('game').emit('big-announcement', 'the game will start soon');

io.on('connection', (socket) => {
    console.log("connected to server " + socket.id);
    socket.on('disconnect', () => {
        console.log("user disconnected " + socket.id);
    });

    //creates game room, data should contain "room" key
    socket.on('createRoom', (data) => {
        if (!rooms.includes(data.room)) {
            socket.join(data.room);
            rooms.push(new Room(data.room, [...cards], [new Player(data.username)]));

            console.log("joined new room:", data.room);
        } else {
            socket.emit('createRoomFailed',
                { message: 'Please choose another name for the room' })
        }
    });

    //joins game room
    socket.on('joinRoom', (data) => {
        let room = rooms[data.room];
        if (room && (room.players.length < 6)) {
            let userExists = false;
            for (const player of room.players) {
                if (data.username === player.username) {
                    socket.emit('joinRoomFailed', { message: 'There is already a player by that name' });
                    userExists = true;
                    break;
                }
            }

            if(!userExists){
                socket.join(data.room)
                // sending to all clients in 'game' room, including sender
                room.players.push(new Player(data.username));
                io.in(data.room).emit('joinRoomSuccess', room);
            }
        } else if (room && room.players.length >= 6) {
            socket.emit('joinRoomFailed', { message: 'Game room is already full.' })
        } else {
            socket.join(data.room);
            let owner = new Player(data.username);
            rooms[data.room] = (new Room(data.room, [...cards], [owner], owner));

            socket.emit('joinRoomSuccess', rooms[data.room]);
            console.log("joined new room:", data.room);
        }
    })

    socket.on('startGame', (data) => {
        console.log('start game!');
        let room = rooms[data.room];

    });

    socket.on('getActions', (data) => {
        socket.emit('actions', Game.getActions(data.player));
    })

    //counteractions to another player's action 
    socket.on('action', (data) => {
        socket.emit('actions', Game.getCounterActions(data.player, data.action))
    })

});

function startGame(room, player) {

}

class Room {
    constructor(name, cards, players, owner) {
        this.name = name;
        this.cards = cards;
        this.players = players;
        this.owner = owner;
    }
    getPlayers() {
        return this.players;
    }
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}


