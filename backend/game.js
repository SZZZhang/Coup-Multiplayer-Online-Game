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
        { name: 'Income', color: '#EAECEE', character: 0, show: 1},
        { name: 'Foreign Aid', color: '#EAECEE', character: 0, show: 1 },  
        { name: 'Coup', color: '#EAECEE', character: 0, show: 1 },  
        { name: 'Tax', color: '#D732A3', character: 'Duke', show: 1 },  
        { name: 'Assasinate', color: '#A6A6A6', character: 'Assassin', show: 1 },  
        { name: 'Exchange', color: '#BCDC31', character: 'Ambassador', show: 1 },  
        { name: 'Steal', color: '#37E0E2', character: 'Captain', show: 1 },  
    ] 
    if(player.coins < 7) actions[2].show = 0; //coup
    if(player.coins < 3) actions[4].show = 0; // steal

    return actions;
}

function getCounterActions(player, Action) {

}

exports.actionFunctions = actionFunctions;
exports.getActions = getActions;
