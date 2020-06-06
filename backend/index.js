
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

    let room = null;
    let currPlayer = null;

    console.log("connected to server " + socket.id);
    socket.on('disconnect', () => {
        console.log("user disconnected " + socket.id);
    });

    //joins game room
    socket.on('joinRoom', (data) => {
        room = rooms[data.roomName];
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
                let player = new Player(data.username, socket.id);
                currPlayer = player;

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

            //
            room = rooms[data.roomName];
            currPlayer = owner;
            console.log("joined new room:", data.roomName);
        }
    })

    //data must have: player
    socket.on('startGame', () => {
        console.log('start game!');
        //let room = rooms[Object.keys(io.sockets.adapter.sids[socket.id]).filter(item => item != socket.id)];
        startGame(room);

        let player = room.players[room.turn % room.players.length];

        for (let player1 of room.players) {
            io.to(player1.socketId).emit('dealCards', player1);
        }
        sendTurnEvents(player, room);
    });


    socket.on('Income', (data) => {

        let thisTurnPlayer = room.players[room.turn % room.players.length];
        thisTurnPlayer.Income();

        io.to(thisTurnPlayer.socketId).emit('updatePlayerInfo', thisTurnPlayer);

        room.turn++;
        let nextPlayer = room.players[room.turn % room.players.length];
        sendTurnEvents(nextPlayer, room);

    })

    //data: player, playerCouped
    socket.on('Coup', (data) => {

        console.log('Coup ' + JSON.stringify(data, null, 4));

        currPlayer.coins -= 7;
        io.to(data.playerCouped.socketId).emit('chooseLoseCard');
        io.to(currPlayer.socketId).emit('waiting', 'Waiting for ' +
            data.playerCouped.username + ' to chose a card to lose');
    })

    socket.on('Foreign Aid', (data) => {
        socket.emit('waiting', 'Waiting for other players');
        socket.to(room.name).emit('counterActions', {
            message: currPlayer.username + ' used Foreign Aid',
            actions: Game.getCounterActions('Foreign Aid')
        });
    });

    socket.on('Block with Duke', (playerThatUsedForeignAid) => {
        io.to(playerThatUsedForeignAid.socketId).emit('counterActions', 
        {message: currPlayer.username + ' blocked your Foreign Aid', 
            actions: Game.getCounterActions('Block with Duke')
        } );
    })

    //data: challengedPlayer(username, socketId), character  
    socket.on('Challenge', (data) => {
        socket.emit('waiting', 'Waiting for other player');
        io.to(data.challengedPlayer.socketId).emit('showdown', {card: data.character});
        for(let player of room.players) {
            if(player.username !== data.challengedPlayer.username 
                && player.username !== currPlayer.username) {
                    io.to(player.socketId).emit('waiting', currPlayer.username + 
                    ' challenged ' + challengedPlayer.username);
                }
        }
    })

    //data: revealedCard, revealedCardIndex, claimedCard, challengerSocketId
    socket.on('showCard', (data) => {
        if(data.revealedCard === data.claimedCard) {
            io.to(data.challenger.socketId).emit('chooseLoseCard');
        } else {
            loseCard(currPlayer, room, data.revealedCardIndex);
            sendTurnEvents(currPlayer, room); 
        }
    })

    socket.on('Pass', () => {
        let thisTurnPlayerUsername = room.players[room.turn % room.players.length].username;
        currentPlayer.pass = true;

        let allPlayersPass = true;
        for (let player of room.players) {
            if (!player.pass && player.username !== thisTurnPlayerUsername) {
                allPlayersPass = false;
                break;
            }
        }

        if (allPlayersPass) {
            room.turn++; 
            let nextPlayer = room.players[room.turn % room.players.length];
            for(let player of room.players) player.pass = false;
            sendTurnEvents(nextPlayer, room);
        } else {
            socket.emit('waiting', 'Waiting for other players');
        }
    })

    socket.on('Tax', ()=> {
        socket.emit('waiting', 'Waiting for other players');
        socket.to(room.name).emit('counterActions', {
            message: currPlayer.username + " used Tax", actions: getCounterActions('Tax')})
    })

    //data: player,cardToLoseIndex
    socket.on('lostCard', (data) => {
        loseCard(currPlayer, room, data.cardToLoseIndex);
        sendTurnEvents(currPlayer, room);
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
function loseCard(player, room, cardToLoseIndex) {
    if (player.cards.length > 1) {
        player.cards.splice(cardToLoseIndex, 1);
    } else {
        deletePlayer(player, room);
    }
}

function deletePlayer(player, room) {
    delete allPlayers[player.socketId];

    for (let i = 0; i < room.players.length; i++) {
        if (room.players[i] === player) {
            room.players.splice(i, 1);
            break;
        }
    }
}

function sendTurnEvents(currPlayer, room) {
    io.to(currPlayer.socketId).emit('updatePlayerInfo', currPlayer);
    room.turn++;

    let nextPlayer = room.players[room.turn % room.players.length];

    io.to(nextPlayer.socketId).emit('actions',
        Game.getActions(nextPlayer));

    io.in(room.name).emit('updatePlayersInfo', {
        playerList: room.players.map((player) => {
            return player.getPublicPlayerInfo();
        })
    })

    for (let player of room.players) {
        if (player !== nextPlayer) {
            io.to(player.socketId).emit('waiting',
                'Waiting for ' + nextPlayer.username + ' to make a move');
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


