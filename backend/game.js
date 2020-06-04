let colors = {
    none:'#EAECEE',
    duke: '#D732A3',
    assasin: '#A6A6A6',
    ambassador: '#BCDC31',
    captain: '#37E0E2',
    contessa: '#CB4335'
}

const actionFunctions = {
    Income: (player) => { player.coins++ },
}

function getActions(player) {
    if(player.coins >= 10) {
        return [{name: 'Coup', character: 0, show: 1}];
    }
    let actions = [
        { name: 'Income', character: 0, show: 1},
        { name: 'Foreign Aid', character: 0, show: 1 },  
        { name: 'Coup', character: 0, show: 1 },  
        { name: 'Tax', character: 'Duke', show: 1 },  
        { name: 'Assasinate', character: 'Assassin', show: 1 },  
        { name: 'Exchange', character: 'Ambassador', show: 1 },  
        { name: 'Steal', character: 'Captain', show: 1 },  
    ] 
    if(player.coins < 7) actions[2].show = 0; //coup
    if(player.coins < 3) actions[4].show = 0; // steal
}

function getCounterActions(player, Action) {

}

exports.actionFunctions = actionFunctions;
exports.getActions = getActions;
