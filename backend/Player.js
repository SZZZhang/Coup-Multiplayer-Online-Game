class Player {
    constructor(username, socketId) {
        this.username = username;
        this.socketId = socketId
        this.coins = 2;
    }
}

module.exports = Player;