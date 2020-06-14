class Player {
    constructor(username, socketId) {
        this.username = username;
        this.socketId = socketId;
        this.coins = 2;
        this.cards = [];
    }

    getPublicPlayerInfo() {
        return {
            username: this.username,
            coins: this.coins,
            socketId: this.socketId,
            numberOfCards: this.cards.length,
        };
    }

    Action(action, io, room) {
        if (action === 'Foreign Aid') {
            this.coins += 2;
        } else if (action === 'Tax') {
            this.coins += 3;
        } else if (action === 'Exchange') {
            // TODO shuffle
            io.to(this.socketId).emit('exchangeCards', { cards: room.cards.slice(0, 3), 
                numberOfCards: this.cards.length });
        } else if (action === 'Steal') {
            this.coins += 2;
            for (let player of room.players) {
                if (player.username === room.targetPlayerName) {
                    player.coins = Math.max(0, player.coins - 2);
                    break;
                }
            }
        } else if (action === 'Assassinate') {
            console.log('Assassination in progress');
            for (let player of room.players) {
                if (player.username === room.targetPlayerName) {
                    io.to(player.socketId).emit('chooseLoseCard', 'You have been assassinated. Choose a card to loose.');
                    break;
                }
            }
        }
    }

    Income() {
        this.coins++;
    }
}

module.exports = Player;