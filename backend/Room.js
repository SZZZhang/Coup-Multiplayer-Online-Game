let deck = ['Duke', 'Duke', 'Duke',
    'Assassin', 'Assassin', 'Assassin',
    'Ambassador', 'Ambassador', 'Ambassador',
    'Captain', 'Captain', 'Captain',
    'Contessa', 'Contessa', 'Contessa'];

class Room {
    constructor(name, players, owner) {
        this.name = name;
        this.cards = [...deck];
        this.players = players;
        this.owner = owner;
        this.turn = 0;
        this.events = [];
        this.lostPlayers = [];
        this.gameStart = false;
        this.revealedCards = [];

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

    restartGame() {
        this.revealedCards = [];
        this.cards = deck;
        this.players = [...this.lostPlayers, ...this.players];
        this.lostPlayers = [];
        this.players.map((player) => player.reset());
        this.turn = 0;
        this.events = [];
        this.reset();
    }
}

module.exports = Room;

