const Game = require('./game');
class Player {
    constructor(username, socketId) {
        this.username = username;
        this.socketId = socketId
        this.coins = 2;
        this.cards = [];
    }

    getPublicPlayerInfo() {
        return {
            username: this.username,
            coins: this.coins,
            socketId: this.socketId,
            numberOfCards: this.cards.length,
        }
    }

    Action(action, io, room) {
        if (action === 'Foreign Aid') {
            this.coins += 2;
        } else if (action === 'Tax') {
            this.coins += 3;
        } else if (action === 'Exchange') {
            // TODO shuffle
            io.to(this.socketId).emit('exchangeCards', room.cards.slice(0, 3));
        } else if (action === 'Steal') {
            for(let player of room.players) {
                if(player.username === room.targetPlayerName) {
                    player.coins = Math.max(0, player.coins - 2); 
                }
            }
        } else if (action === 'Assassinate') {
            for(let player of room.players) {
                if(player.name === room.targetPlayerName) {
                    //loseCards
                }
            }
        }
    }

    Income() {
        this.coins++;
    }
}

module.exports = Player;