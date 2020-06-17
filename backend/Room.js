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
        this.leaderBoard = [];

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
        this.cards = [...deck];
        this.players = [...this.lostPlayers, ...this.players];
        this.lostPlayers = [];
        this.players.map((player) => player.reset());
        this.turn = 0;
        this.events = [];
        this.reset();
    }

    getNewLeaderBoard(winner) {
        winner.wins++;
        this.leaderBoard = [...this.lostPlayers.map((a) => a.getPublicPlayerInfo()),
            ...this.players.map((a) => a.getPublicPlayerInfo())]; 
        this.leaderBoard.sort((a,b) => (a.wins < b.wins)? 1 : -1); 
        return this.leaderBoard;
    }
}

module.exports = Room;

