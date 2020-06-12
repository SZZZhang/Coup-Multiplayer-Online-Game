class Room {
    constructor(name, cards, players, owner) {
        this.name = name;
        this.cards = cards;
        this.players = players;
        this.owner = owner;
        this.turn = 0;
        this.events = [];

        this.passPlayers = 0;
        this.currPlayer = null;
        this.currAction = null;
        this.targetPlayer = null;
        this.challenge = false;
        this.block = false;
        this.targetPlayerName = null;
    }

    reset() {
        this.passPlayers = 0;
        this.currPlayer = null;
        this.currAction = null;
        this.targetPlayer = null;
        this.challenge = false;
        this.block = false; 
        this.targetPlayerName = null;
    }
}

module.exports = Room; 

