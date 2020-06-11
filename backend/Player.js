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
            io.to(this.socketId).emit('exchangeCards'); 
        } 
    }

    Income() {
        this.coins++;
    }
}

module.exports = Player;