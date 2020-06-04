
var express = require('express');
var app = express();
const Player = require('./Player');

var server = app.listen(5000, () => {
    console.log("Init server")
});
var io = require('socket.io')(server);

const Game = require('./game');

app.use(express.static('.'));

let rooms = {};

let allPlayers = {};

let cards = ['Duke', 'Duke', 'Duke',
    'Assassin', 'Assassin', 'Assassin',
    'Ambassador', 'Ambassador', 'Ambassador',
    'Captain', 'Captain', 'Captain',
    'Contessa', 'Contessa', 'Contessa'];

let events = [];

// sending to all clients in 'game' room, including sender
io.in('game').emit('big-announcement', 'the game will start soon');

io.on('connection', (socket) => {
    console.log("connected to server " + socket.id);
    socket.on('disconnect', () => {
        console.log("user disconnected " + socket.id);
    });

    //joins game room
    socket.on('joinRoom', (data) => {
        let room = rooms[data.roomName];
        if (room && (room.players.length < 6)) {
            let userExists = false;
            for (const player of room.players) {
                if (data.username === player.username) {
                    socket.emit('joinRoomFailed', { message: 'There is already a player by that name' });
                    userExists = true;
                    break;
                }
            }

            if (!userExists) {
                socket.join(data.roomName)
                // sending to all clients in 'game' room, including sender
                let player = new Player(data.username, socket.id)
                room.players.push(player);
                allPlayers[socket.id] = player;

                io.in(data.roomName).emit('joinRoomSuccess', room);

            }
        } else if (room && room.players.length >= 6) {
            socket.emit('joinRoomFailed', { message: 'Game room is already full.' })
        } else {
            socket.join(data.roomName);
            let owner = new Player(data.username, socket.id);
            rooms[data.roomName] = (new Room(data.roomName, [...cards], [owner], owner));

            allPlayers[socketId] = owner;

            socket.emit('joinRoomSuccess', rooms[data.roomName]);
            console.log("joined new room:", data.roomName);
        }
    })

    //data must have: player
    socket.on('startGame', (data) => {
        console.log('start game!');
        let room = rooms[io.sockets.manager.roomClients[socket.id]];
        startGame(room);

        for(let player of room.players) {
            io.to(player.socketId).emit('updateCards', { cards: player.cards }); 
        }

        //socket.emit('startTurn', { roomName: room.name });
        let player = room.players[room.turn % room.players.length];
        io.to(player.socketId).emit('yourTurn',
            { roomName: roomName, actions: Game.getActions(player) });
    });


    //sends wait event to players to wait
    //data: roomName
    socket.on('yourTurn', (data) => {
        socket.to(data.roomName).emit('wait', {
            currentPlayerUsername:
                allPlayers[socket.id].username
        });
    })


    socket.on('Income', (data) => {
        let room = rooms[io.sockets.manager.roomClients[socket.id]];
        Game.actionFunctions(Income(data.player));
        room.turn++;
        socket.emit('startTurn', { roomName: room.name });
    })

    //data: player, coupPlayer 
    socket.on('Coup', (data) => {
        data.player.coins -= 7;
        io.to(data.coupPlayer.socketId).emit('loseCard');
    })

    //data: player
    socket.on('loseCard', (data) => {
        if (data.player.cards.length > 1) {

        } else {
            io.to(data.player.)
        }
    })

    //data = { action: 'Action', player: player}
    socket.on('action', (data) => {

        let room = rooms[io.sockets.manager.roomClients[socket.id]];
        if (data.action === 'Income') {
            Game.actionFunctions(Income(data.player));
            room.turn++;
            socket.emit('startTurn', { roomName: room.name });
        } else if (data.action === 'Coup') {
            Game.actionFunctions(Coup(data.player));
            room.turn++;
            socket.emit('startTurn', { roomName: room.name });
        }

        socket.emit('counterActions', Game.getCounterActions(data.player, data.action))
    })

});

function startGame(room) {
    shuffle(room.cards);
    shuffle(room.players);

    for (let player of room.players) {
        player.cards = [room.cards.pop(), room.cards.pop()];
    }
}

class Room {
    constructor(name, cards, players, owner) {
        this.name = name;
        this.cards = cards;
        this.players = players;
        this.owner = owner;
        this.turn = 0;
    }
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}


