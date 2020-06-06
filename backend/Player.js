class Player {
    constructor(username, socketId) {
        this.username = username;
        this.socketId = socketId
        this.coins = 2;
        this.cards = [];
        this.pass = false;
    }

    getPublicPlayerInfo() {
        return {
            username: this.username,
            coins: this.coins,
            socketId: this.socketId,
            numberOfCards: this.cards.length,
        }
    }

    Income() {
        this.coins++;
    }
}

module.exports = Player;