
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

        sendTurnEvents(currPlayer, room);
    })

    //data: player, playerCouped
    socket.on('Coup', (data) => {

        console.log('Coup ' + JSON.stringify(data, null, 4));

        currPlayer.coins -= 7;
        io.to(data.playerCouped.socketId).emit('chooseLoseCard', 'You have been couped! Choose a card to lose.');
        io.to(currPlayer.socketId).emit('waiting', 'Waiting for ' +
            data.playerCouped.username + ' to chose a card to lose');
    })

    socket.on('Foreign Aid', (data) => {
        room.currAction = 'Foreign Aid';
        socket.emit('waiting', 'Waiting for other players');
        socket.to(room.name).emit('counterActions', {
            message: currPlayer.username + ' used Foreign Aid',
            player: currPlayer.getPublicPlayerInfo(),
            actions: Game.getCounterActions('Foreign Aid')
        });
    });

    socket.on('Block with Duke', (playerThatUsedForeignAid) => {
        room.block = true;
        socket.emit('waiting', 'Waiting for other players');
        socket.to(room.name).emit('counterActions',
            {
                message: currPlayer.username + ' has blocked ' + playerThatUsedForeignAid.username + '\'s Foreign Aid',
                player: currPlayer.getPublicPlayerInfo(),
                actions: Game.getCounterActions('Block with Duke')
            });
        room.passPlayers = 0;
    })

    socket.on('Tax', () => {
        room.currAction = 'Tax';
        socket.emit('waiting', 'Waiting for other players');
        socket.to(room.name).emit('counterActions', {
            message: currPlayer.username + " used Tax", actions: Game.getCounterActions('Tax'),
            player: currPlayer.getPublicPlayerInfo(),
        })
    })


    socket.on('Exchange', (data) => {
        room.currAction = 'Exchange';
        socket.emit('waiting', 'Waiting for other players');
        socket.to(room.name).emit('counterActions', {
            message: currPlayer.username + " wants to exchange cards with the deck", actions: Game.getCounterActions('Tax'),
            player: currPlayer.getPublicPlayerInfo(),
        })
    })

    //data: [newCards]
    socket.on('Exchange Cards', (data) => {
        addToDeck(currPlayer.cards);
        removeFromDeck(room, data.newCards);
        currPlayer.cards = newCards;
    })

    //data: targetPlayer(username, socketId)
    socket.on('Assassinate', (data) => {
        room.currAction = 'Assassinate';

        socket.emit('waiting', 'Waiting for other players');
        io.to(data.targetPlayer.socketId).emit('counterActions',{
                message: currPlayer.username + " wants you assassinate you",
                actions: Game.getCounterActions('Assassinate This Player'),
                player: currPlayer.getPublicPlayerInfo(),
            });
        emitToAllButThesePlayers([data.targetPlayer.username, currPlayer.username],
            room, io, 'counterActions', {
            message: currPlayer.username + " wants to assassinate " + data.targetPlayer.username,
            actions: Game.getCounterActions('Assassinate'),
            player: currPlayer.getPublicPlayerInfo(),
        });
    })

    socket.on('Block with Contessa', () => {
        room.block = true;
        socket.emit('waiting', 'Waiting for other players');
        socket.to(room.name).emit('counterActions', {
            message: currPlayer.username + " blocked the assassination with Contessa",
            actions: Game.getCounterActions('Block with Contessa'),
            player: currPlayer.getPublicPlayerInfo(),
        })
        room.passPlayers = 0;
    })

    //data: targetPlayer(username, socketId)
    socket.on('Steal', (data) => {
        room.currAction = 'Steal';

        socket.emit('waiting', 'Waiting for other players');
        io.to(data.targetPlayer.socketId).emit('counterActions', {
            message: currPlayer.username + 'wants to steal from you',
            actions: Game.getCounterActions('Steal From This Player'),
            player: currPlayer.getPublicPlayerInfo() 
        })
        emitToAllButThesePlayers([data.targetPlayer.username, currPlayer.username],
            room, io, 'counterActions', {
            message: currPlayer.username + " wants to steal from " + data.targetPlayer.username,
            actions: Game.getCounterActions('Steal'),
            player: currPlayer.getPublicPlayerInfo(),
        });
    })

    socket.on('Block with Captain', () => {
        room.block = true;
        socket.emit('waiting', 'Waiting for other players');
        socket.to(room.name).emit('counterActions', {
            message: currPlayer.username + " blocked the steal with Captain",
            actions: Game.getCounterActions('Block with Captain'),
            player: currPlayer.getPublicPlayerInfo(),
        })
    })

    socket.on('Block with Ambassador', () => {
        room.block = true;
        socket.emit('waiting', 'Waiting for other players');
        socket.to(room.name).emit('counterActions', {
            message: currPlayer.username + " blocked the steal with Captain",
            actions: Game.getCounterActions('Block with Ambassador'),
            player: currPlayer.getPublicPlayerInfo(),
        })
    })

    //data: challengedPlayer(username, socketId), character
    socket.on('Challenge', (data) => {
        room.challenge = true;
        socket.emit('waiting', 'Waiting for other player');
        io.to(data.challengedPlayer.socketId).emit('showdown',
            { challenger: currPlayer.getPublicPlayerInfo(), card: data.character });
        for (let player of room.players) {
            if (player.username !== data.challengedPlayer.username
                && player.username !== currPlayer.username) {
                io.to(player.socketId).emit('waiting', currPlayer.username +
                    ' challenged ' + data.challengedPlayer.username);
            }
        }
        room.passPlayers = 0;
    })

    //data: revealedCard, revealedCardIndex, claimedCard, challenger(socketId)
    socket.on('showCard', (data) => {

        if (data.revealedCard === data.claimedCard) {
            randomCard(currPlayer, room, data.revealedCardIndex);
            if(!room.block) room.currPlayer.Action(room.currAction);
               
            if (room.currAction === 'Exchange') {
                emitToAllButThisPlayer([currPlayer.username], room, io, 'waiting',
                    'Waiting for ' + currPlayer.username + ' to exchange cards')
            }

            io.to(data.challenger.socketId).emit('chooseLoseCard', 'Your challenge failed. Choose a card to lose.');
        } 
         else {
            loseCard(currPlayer, room, data.revealedCardIndex);
            if(room.block) room.currPlayer.Action(room.currAction);
            sendTurnEvents(currPlayer, room);
        }
    })

    // originalAction(string)
    socket.on('Pass', () => {
        room.passPlayers++;
        if (room.passPlayers >= room.players.length - 1) {
            if (!room.challenge) {
                room.currPlayer.Action(room.currAction);
                if (room.currAction === 'Exchange') {
                    emitToAllButThisPlayer([currPlayer.username], room, io, 'waiting',
                        'Waiting for ' + room.currPlayer.name + ' to exchange cards');
                }
            }

            sendTurnEvents(currPlayer, room);
        } else {
            socket.emit('waiting', 'Waiting for other players');
        }
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

        this.passPlayers = 0;
        this.currPlayer = null;
        this.currAction = null;
        this.targetPlayer = null;
        this.challenge = false;
        this.block = false;
    }

    reset() {
        this.passPlayers = 0;
        this.currPlayer = null;
        this.currAction = null;
        this.targetPlayer = null;
        this.challenge = false;
        this.block = false; 
    }
}
function loseCard(player, room, cardToLoseIndex) {
    if (player.cards.length > 1) {
        player.cards.splice(cardToLoseIndex, 1);
    } else {
        deletePlayer(player, room);
    }
}

function randomCard(player, room, cardIndex) {
    room.cards.push(player.cards[cardIndex]);
    player.cards.splice(cardIndex, 1);

    shuffle(room.cards);
    player.cards.push(room.cards.pop());
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

//maybe delete currPlayer param 
function sendTurnEvents(currPlayer, room) {
    room.reset();

    io.to(currPlayer.socketId).emit('updatePlayerInfo', currPlayer);
    room.turn++;

    let nextPlayer = room.players[room.turn % room.players.length];

    room.currPlayer = nextPlayer;

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

//takes in array of players
function emitToAllButThesePlayers(excludedPlayerNames, room, io, event, data) {

    let playerNames = room.players.map(p => p.username);
    for (let i = 0; i < room.players.length; i++) {
        if (!excludedPlayerNames.includes(playerNames[i])) {
            io.to(player.socketId).emit(event, data);
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

function addToDeck(room, newCards) {
    for (let card of newCards) {
        room.cards.push(card);
    }
}

//removes cards in cardCharacter param from the deck 
function removeFromDeck(room, cardCharacters) {
    for (let cardCharacter of cardCharacters) {
        for (let i = 0; i < room.cards.length; i++) {
            if (cardCharacter === room.cards[i]) {
                room.cards.splice(i, 1); break;
            }
        }
    }
}
