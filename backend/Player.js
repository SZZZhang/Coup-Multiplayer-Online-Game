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
            coins: this.coins
        }
    }

    Income() {
        this.coins++;
    }
}

module.exports = Player;