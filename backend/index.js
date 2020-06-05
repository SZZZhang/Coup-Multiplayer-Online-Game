
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

                socket.emit('joinRoomPlayerInfo', player);

                io.in(data.roomName).emit('joinRoomSuccess', {
                    player,
                    room,
                    playerList: room.players.map((player) => {
                        return player.getPublicPlayerInfo();
                    })
                });
            }
        } else if (room && room.players.length >= 6) {
            socket.emit('joinRoomFailed', { message: 'Game room is already full.' })
        } else {
            socket.join(data.roomName);
            let owner = new Player(data.username, socket.id);
            rooms[data.roomName] = (new Room(data.roomName, [...cards], [owner], owner));

            allPlayers[socket.id] = owner;

            socket.emit('joinRoomPlayerInfo', owner);

            socket.emit('joinRoomSuccess', {
                player: owner,
                room: rooms[data.roomName],
                playerList: rooms[data.roomName].players.map((player) => {
                    return player.getPublicPlayerInfo();
                })
            });

            console.log("joined new room:", data.roomName);
        }
    })

    //data must have: player
    socket.on('startGame', () => {
        console.log('start game!');
        let room = rooms[Object.keys(io.sockets.adapter.sids[socket.id]).filter(item => item != socket.id)];
        startGame(room);

        let player = room.players[room.turn % room.players.length];

        for (let player1 of room.players) {
            io.to(player1.socketId).emit('dealCards', { cards: player1.cards });
        }
        sendTurnEvents(player, room);
    });


    socket.on('Income', (data) => {
        let room = rooms[Object.keys(io.sockets.adapter.sids[socket.id]).filter(item => item != socket.id)];
        let currPlayer = room.players[room.turn % room.players.length];
        currPlayer.Income();
        console.log(currPlayer);ß

        io.to(currPlayer.socketId).emit('updatePlayerInfo', currPlayer);
        room.turn++;


        let nextPlayer = room.players[room.turn % room.players.length];
        sendTurnEvents(nextPlayer, room);

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
        }
    });

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

function sendTurnEvents(currentPlayer, room) {
    io.to(currentPlayer.socketId).emit('actions',
        Game.getActions(currentPlayer));

    io.in(room.name).emit('updatePlayersInfo', {
        playerList: room.players.map((player) => {
            return player.getPublicPlayerInfo();
        })
    })

    for (let player of room.players) {
        if (player !== currentPlayer) {
            io.to(player.socketId).emit('waiting', {
                username: currentPlayer.username,
                coins: currentPlayer.coins
            });
        }
    }
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}


