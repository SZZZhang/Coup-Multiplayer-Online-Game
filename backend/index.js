
var express = require('express');
var app = express();

const Player = require('./Player');
const Room = require('./Room');

var server = app.listen(5000, () => {
    console.log('Init server');
});
var io = require('socket.io')(server);

const Game = require('./game');

app.use(express.static('.'));

let rooms = {};

class Event {
    constructor(name, priority) {
        this.name = name;
        this.priority = priority;
    }
}

// sending to all clients in 'game' room, including sender
io.in('game').emit('big-announcement', 'the game will start soon');

io.on('connection', (socket) => {
    let room = null;
    let currPlayer = null;

    console.log('connected to server ' + socket.id);
    socket.on('disconnect', () => {
        console.log('user disconnected ' + socket.id);
    });

    //joins game room
    socket.on('joinRoom', (data) => {
        room = rooms[data.roomName];
        if (room && (room.gameStart || room.players.length >= 6)) {
            let message = 'The game room is full.';
            if (room.gameStart) message = 'The game has already started';
            socket.emit('joinRoomFailed', { message });
        } else if (room && (room.players.length < 6)) {

            let userExists = false;
            for (const player of room.players) {
                if (data.username === player.username) {
                    socket.emit('joinRoomFailed', { message: 'There is already a player by that name' });
                    userExists = true;
                    break;
                }
            }

            if (!userExists) {
                socket.join(data.roomName);
                // sending to all clients in 'game' room, including sender
                let player = new Player(data.username, socket.id);
                currPlayer = player;

                room.players.push(player);

                socket.emit('joinRoomPlayerInfo', player);

                io.in(data.roomName).emit('joinRoomSuccess', {
                    player,
                    room,
                    playerList: room.players.map((player) => {
                        return player.getPublicPlayerInfo();
                    })
                });


            }
        } else {
            socket.join(data.roomName);
            let owner = new Player(data.username, socket.id);
            room = new Room(data.roomName, [owner], owner);
            rooms[data.roomName] = room;

            socket.emit('joinRoomPlayerInfo', owner);

            socket.emit('joinRoomSuccess', {
                player: owner,
                room: room,
                playerList: rooms[data.roomName].players.map((player) => {
                    return player.getPublicPlayerInfo();
                })
            });

            currPlayer = owner;
            console.log('joined new room:', data.roomName);
        }
    });

    //data must have: player
    socket.on('startGame', () => {
        if (room.players === 1) {
            socket.emit('startGameFailed', { message: 'You must have at least one more player join this game room before starting the game.' });
        } else {
            console.log('start game!');
            startGame(room);

            for (let player1 of room.players) {
                io.to(player1.socketId).emit('dealCards', player1);
            }
            sendTurnEvents(room);
        }
    });
    socket.on('restartGame', () => {
        room.restartGame();
        startGame(room);
        console.log(room);
        for(let player of room.players) {
            io.to(player.socketId).emit('dealCards', player);
        }
        io.in(room.name).emit('updateEvents', room.events);
        io.in(room.name).emit('updateRevealedCards', room.revealedCards);
        sendTurnEvents(room);
    });

    socket.on('Income', () => {

        let thisTurnPlayer = room.players[room.turn % room.players.length];
        thisTurnPlayer.Income();

        room.events.push(new Event(currPlayer.username + ' used Income', 1));
        io.in(room.name).emit('updateEvents', room.events);
        sendTurnEvents(room);
    });

    //data: player, playerCouped
    socket.on('Coup', (data) => {

        console.log('Coup ' + JSON.stringify(data, null, 4));

        currPlayer.coins -= 7;

        room.events.push(new Event(currPlayer.username + ' Couped ' + data.playerCouped.username, 1));
        io.in(room.name).emit('updateEvents', room.events);
        io.to(data.playerCouped.socketId).emit('chooseLoseCard', 'You have been couped! Choose a card to lose.');
        io.to(currPlayer.socketId).emit('waiting', 'Waiting for ' +
            data.playerCouped.username + ' to chose a card to lose');
    });

    socket.on('Foreign Aid', () => {
        room.currAction = 'Foreign Aid';
        room.events.push(new Event(currPlayer.username + ' wants to use Foreign Aid', 1));
        io.in(room.name).emit('updateEvents', room.events);

        socket.emit('waiting', 'Waiting for other players');
        socket.to(room.name).emit('counterActions', {
            message: currPlayer.username + ' used Foreign Aid',
            player: currPlayer.getPublicPlayerInfo(),
            actions: Game.getCounterActions('Foreign Aid')
        });
    });

    socket.on('Block with Duke', () => {
        room.block = true;
        room.events.push(new Event(currPlayer.username + ' blocked the foreign aid with Duke', 0));
        io.in(room.name).emit('updateEvents', room.events);

        socket.emit('waiting', 'Waiting for other players');
        socket.to(room.name).emit('counterActions',
            {
                message: currPlayer.username + ' has blocked ' + room.currPlayer.username + '\'s Foreign Aid',
                player: currPlayer.getPublicPlayerInfo(),
                actions: Game.getCounterActions('Block with Duke')
            });
        room.passPlayers = 0;
    });

    socket.on('Tax', () => {
        room.currAction = 'Tax';
        room.events.push(new Event(currPlayer.username + ' used Tax', 1));
        io.in(room.name).emit('updateEvents', room.events);

        socket.emit('waiting', 'Waiting for other players');
        socket.to(room.name).emit('counterActions', {
            message: currPlayer.username + ' used Tax', actions: Game.getCounterActions('Tax'),
            player: currPlayer.getPublicPlayerInfo(),
        });
    });


    socket.on('Exchange', () => {
        room.currAction = 'Exchange';
        room.events.push(new Event(currPlayer.username + ' used Exchange', 1));
        io.in(room.name).emit('updateEvents', room.events);

        socket.emit('waiting', 'Waiting for other players');
        socket.to(room.name).emit('counterActions', {
            message: currPlayer.username + ' wants to exchange cards with the deck',
            actions: Game.getCounterActions('Exchange'),
            player: currPlayer.getPublicPlayerInfo(),
        });
    });

    //data: [newCards]
    socket.on('Exchange Cards', (data) => {
        addToDeck(room, currPlayer.cards);
        removeFromDeck(room, data.newCards);
        currPlayer.cards = data.newCards;
        sendTurnEvents(room);
    });

    //data: targetPlayer(username, socketId)
    socket.on('Assassinate', (data) => {
        currPlayer.coins -= 3;
        room.targetPlayerName = data.targetPlayer.username;
        room.currAction = 'Assassinate';
        room.events.push(new Event(currPlayer.username + ' wants to assassinate ' + data.targetPlayer.username, 1));
        io.in(room.name).emit('updateEvents', room.events);

        socket.emit('waiting', 'Waiting for other players');
        io.to(data.targetPlayer.socketId).emit('counterActions', {
            message: currPlayer.username + ' wants you assassinate you',
            actions: Game.getCounterActions('Assassinate This Player'),
            player: currPlayer.getPublicPlayerInfo(),
        });
        emitToAllButThesePlayers([data.targetPlayer.username, currPlayer.username],
            room, io, 'counterActions', {
                message: currPlayer.username + ' wants to assassinate ' + data.targetPlayer.username,
                actions: Game.getCounterActions('Assassinate'),
                player: currPlayer.getPublicPlayerInfo(),
            });
    });

    socket.on('Block with Contessa', () => {
        room.block = true;
        room.events.push(new Event(currPlayer.username + ' blocked the assassination with Contessa', 0));
        io.in(room.name).emit('updateEvents', room.events);

        socket.emit('waiting', 'Waiting for other players');
        socket.to(room.name).emit('counterActions', {
            message: currPlayer.username + ' blocked the assassination with Contessa',
            actions: Game.getCounterActions('Block with Contessa'),
            player: currPlayer.getPublicPlayerInfo(),
        });
        room.passPlayers = 0;
    });

    //data: targetPlayer(username, socketId)
    socket.on('Steal', (data) => {
        room.targetPlayerName = data.targetPlayer.username;
        room.currAction = 'Steal';
        room.events.push(new Event(currPlayer.username + ' wants to steal from ' + data.targetPlayer.username, 1));
        io.in(room.name).emit('updateEvents', room.events);

        socket.emit('waiting', 'Waiting for other players');
        io.to(data.targetPlayer.socketId).emit('counterActions', {
            message: currPlayer.username + ' wants to steal from you',
            actions: Game.getCounterActions('Steal From This Player'),
            player: currPlayer.getPublicPlayerInfo()
        });
        emitToAllButThesePlayers([data.targetPlayer.username, currPlayer.username],
            room, io, 'counterActions', {
                message: currPlayer.username + ' wants to steal from ' + data.targetPlayer.username,
                actions: Game.getCounterActions('Steal'),
                player: currPlayer.getPublicPlayerInfo(),
            });
    });

    socket.on('Block with Captain', () => {
        room.block = true;
        room.events.push(new Event(currPlayer.username + ' blocked steal with Captain', 0));
        io.in(room.name).emit('updateEvents', room.events);

        socket.emit('waiting', 'Waiting for other players');
        socket.to(room.name).emit('counterActions', {
            message: currPlayer.username + ' blocked the steal with Captain',
            actions: Game.getCounterActions('Block with Captain'),
            player: currPlayer.getPublicPlayerInfo(),
        });
    });

    socket.on('Block with Ambassador', () => {
        room.block = true;
        room.events.push(new Event(currPlayer.username + ' blocked steal with Ambassador', 0));
        io.in(room.name).emit('updateEvents', room.events);

        socket.emit('waiting', 'Waiting for other players');
        socket.to(room.name).emit('counterActions', {
            message: currPlayer.username + ' blocked the steal with Captain',
            actions: Game.getCounterActions('Block with Ambassador'),
            player: currPlayer.getPublicPlayerInfo(),
        });
    });

    //data: challengedPlayer(username, socketId), character
    socket.on('Challenge', (data) => {
        room.challenge = true;
        room.events.push(new Event(currPlayer.username + ' challenges the last action', 0));
        io.in(room.name).emit('updateEvents', room.events);

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
    });

    //data: revealedCard, revealedCardIndex, claimedCard, challenger(socketId)
    socket.on('showCard', (data) => {

        if (data.revealedCard === data.claimedCard) {
            randomCard(currPlayer, room, data.revealedCardIndex);
            if (!room.block) room.currPlayer.Action(room.currAction, io, room);

            if (room.currAction === 'Exchange') {
                emitToAllButThesePlayers([currPlayer.username], room, io, 'waiting',
                    'Waiting for ' + currPlayer.username + ' to exchange cards');
            }

            room.events.push(new Event('Challenge failed', 0));
            io.in(room.name).emit('updateEvents', room.events);

            io.to(data.challenger.socketId).emit('chooseLoseCard', 'Your challenge failed. Choose a card to lose.');
        }
        else {
            if (room.block) room.currPlayer.Action(room.currAction, io, room);
            room.events.push(new Event('Challenge successful', 0));
            loseCard(currPlayer, room, data.revealedCardIndex);
            io.in(room.name).emit('updateEvents', room.events);
            sendTurnEvents(room);
        }
        io.in(room.name).emit('updateRevealedCards', room.revealedCards);
    });

    // originalAction(string)
    socket.on('Pass', () => {
        room.passPlayers++;
        if (room.passPlayers >= room.players.length - 1) {
            if (!room.challenge) {
                if (!room.block)
                    room.currPlayer.Action(room.currAction, io, room);

                if (room.currAction === 'Exchange') {
                    emitToAllButThesePlayers([room.currPlayer.username], room, io, 'waiting',
                        'Waiting for ' + room.currPlayer.username + ' to exchange cards');
                }
                if (room.currAction === 'Assassinate') {
                    emitToAllButThesePlayers([room.targetPlayerName], room, io, 'waiting',
                        'Waiting for ' + room.targetPlayerName + ' to choose a card to lose');
                }
            }

            if ((room.currAction !== 'Exchange' && room.currAction !== 'Assassinate') || room.block) {
                sendTurnEvents(room);
            }
        } else {
            socket.emit('waiting', 'Waiting for other players');
        }
    });


    //data: player,cardToLoseIndex
    socket.on('lostCard', (data) => {
        loseCard(currPlayer, room, data.cardToLoseIndex);
        io.in(room.name).emit('updateRevealedCards', room.revealedCards );
        sendTurnEvents(room);
    });

});

function startGame(room) {
    shuffle(room.cards);
    shuffle(room.players);
    room.gameStart = true;

    for (let player of room.players) {
        player.cards = [room.cards.pop(), room.cards.pop()];
    }
}

function loseCard(player, room, cardToLoseIndex) {
    room.revealedCards.push(player.cards[cardToLoseIndex]);
    if (player.cards.length > 1) {
        player.cards.splice(cardToLoseIndex, 1);
    } else {
        deletePlayer(player, room);
        checkForWinner(room);
    }
}

function randomCard(player, room, cardIndex) {
    room.revealedCards.push(player.cards[cardIndex]);
    player.cards.splice(cardIndex, 1);

    shuffle(room.cards);
    player.cards.push(room.cards.pop());
}

function deletePlayer(player, room) {
    player.cards = [];
    room.lostPlayers.push(player); 
    for (let i = 0; i < room.players.length; i++) {
        if (room.players[i] === player) {
            room.players.splice(i, 1);
            break;
        }
    }
    io.to(player.socketId).emit('lostGame', ':<');
    io.to(player.socketId).emit('updatePlayerInfo', player);
}

function sendTurnEvents(room) {
    room.reset();

    for (let player of room.players) {
        io.to(player.socketId).emit('updatePlayerInfo', player);
    }
    room.turn++;

    let nextPlayer = room.players[room.turn % room.players.length];

    room.currPlayer = nextPlayer;

    io.to(nextPlayer.socketId).emit('actions',
        Game.getActions(nextPlayer));

    io.in(room.name).emit('updatePlayersInfo', {
        playerList: room.players.map((player) => {
            return player.getPublicPlayerInfo();
        })
    });

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
            io.to(room.players[i].socketId).emit(event, data);
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
                room.cards.splice(i, 1);
                break;
            }
        }
    }
}

function checkForWinner(room) {
    if (room.players.length === 1) {
        room.events.push(new Event(room.players[0].username + ' is the winner!', 1));
        io.to(room.players[0].socketId).emit('winGame');
        io.in(room.name).emit('gameOver');
    }
}