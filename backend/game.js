let colors = {
    none: '#EAECEE',
    duke: '#D732A3',
    assassin: '#A6A6A6',
    ambassador: '#BCDC31',
    captain: '#37E0E2',
    contessa: '#CB4335'
};

const actionFunctions = {
    Income: (player) => { player.coins++; },
};

function getActions(player) {
    if (player.coins >= 10) {
        return [{ name: 'Coup', color: '#EAECEE', character: 0, show: 1 }];
    }
    let actions = [
        { name: 'Income', color: '#EAECEE', character: 0, show: 1 },
        { name: 'Foreign Aid', color: '#EAECEE', character: 0, show: 1 },
        { name: 'Coup', color: '#EAECEE', character: 0, show: 1 },
        { name: 'Tax', color: '#D732A3', character: 'Duke', show: 1 },
        { name: 'Assassinate', color: '#A6A6A6', character: 'Assassin', show: 1 },
        { name: 'Exchange', color: '#BCDC31', character: 'Ambassador', show: 1 },
        { name: 'Steal', color: '#37E0E2', character: 'Captain', show: 1 },
    ];
    if (player.coins < 7) actions[2].show = 0; //coup
    if (player.coins < 3) actions[4].show = 0; // assassinate

    return actions;
}

// Note: for Action 'Challenge', the character attribute is the card that they claim to have
function getCounterActions(action) {
    if (action === 'Foreign Aid') {
        return [
            new Action('Block with Duke', colors.duke, 'Duke', 1),
            new Action('Pass', colors.none, 0, 1),
        ];
    } else if (action === 'Block with Duke') {
        return [
            new Action('Challenge', colors.none, 'Duke', 1),
            new Action('Pass', colors.none, 0, 1),
        ];
    } else if (action === 'Tax') {
        return [new Action('Challenge', colors.none, 'Duke', 1),
            new Action('Pass', colors.none, 0, 1)];
    }
    else if (action === 'Assassinate This Player') {
        return [new Action('Challenge', colors.none, 'Assassin', 1),
            new Action('Block with Contessa', colors.contessa, 'Contessa', 1),
            new Action('Pass', colors.none, 0, 1),
        ];
    } else if (action === 'Assassinate') {
        return [new Action('Challenge', colors.none, 'Assassin', 1),
            new Action('Pass', colors.none, 0, 1),];
    } else if(action === 'Block with Contessa') {
        return [
            new Action('Pass', colors.none, 0, 1),
            new Action('Challenge', colors.none, 'Contessa', 1),
        ];
    }else if (action === 'Exchange') {
        return [new Action('Challenge', colors.none, 'Ambassador', 1),
            new Action('Pass', colors.none, 0, 1),];
    } else if (action === 'Steal From This Player') {
        return [new Action('Block with Ambassador', colors.ambassador, 'Ambassador', 1),
            new Action('Block with Captain', colors.captain, 'Captain', 1),
            new Action('Challenge', colors.none, 'Captain', 1),
            new Action('Pass', colors.none, 0, 1),];
    } else if (action === 'Block with Captain') {
        return [new Action('Challenge', colors.none, 'Captain', 1),
            new Action('Pass', colors.none, 0, 1),];
    } else if (action === 'Block with Ambassador') {
        return [
            new Action('Pass', colors.none, 0, 1),
            new Action('Challenge', colors.none, 'Ambassador', 1),
        ];
    }
}

class Action {
    constructor(name, color, character, show) {
        this.name = name;
        this.color = color;
        this.character = character;
        this.show = show;
    }
}

module.exports.actionFunctions = actionFunctions;
module.exports.getActions = getActions;
module.exports.getCounterActions = getCounterActions;
