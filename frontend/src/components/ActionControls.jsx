import React, { useEffect } from 'react';
import constants from '../constants';
import { Button } from 'react-bootstrap';

export default function ActionControls({ playerList, playerInfo, socket, actionState, setActionState, actionPackage, setActionPackage }) {

    const ACTION_STATE = constants.ACTION_STATE;

    console.log(actionState);

    const sendCardToLose = (cardToLoseIndex) => {
        socket.emit('lostCard', { player: playerInfo, cardToLoseIndex });
        setActionState(ACTION_STATE.NONE);
    };

    useEffect(() => {
        const onWaiting = () => {
            setActionState(ACTION_STATE.NONE);
        };

        const onChooseLoseCard = (message) => {
            if (playerInfo.cards.length === 1) {
                sendCardToLose(0);
                console.log('You lose! You had to lose one card and you only had one card left.');
            } else {
                setActionPackage({ message });
                setActionState(ACTION_STATE.CHOOSING_CARD_TO_LOSE);
            }
        };

        const onCounterActions = (data) => {
            console.log('counteraction');
            console.log(data);
            setActionPackage(data);
            setActionState(ACTION_STATE.COUNTERACTION);
        };

        const onShowdown = (data) => {
            console.log('showdown');
            setActionPackage(data);
            setActionState(ACTION_STATE.SHOWDOWN);
        };

        const onActions = (actions) => {
            console.log('on actions');
            console.log(actions);
            setActionPackage(actions);
            setActionState(ACTION_STATE.CHOOSING_MAIN_ACTION);
        };

        socket.on('waiting', onWaiting);
        socket.on('chooseLoseCard', onChooseLoseCard);
        socket.on('counterActions', onCounterActions);
        socket.on('showdown', onShowdown);
        socket.on('actions', onActions);

        return () => {
            socket.off('waiting', onWaiting);
            socket.off('chooseLoseCard', onChooseLoseCard);
            socket.off('counterActions', onCounterActions);
            socket.off('showdown', onShowdown);
            socket.on('actions', onActions);
        };
    }, [playerInfo]);

    const clickAction = (actionName, payload) => {
        console.log('sending ' + actionName + ' with payload ' + payload);
        setActionState(ACTION_STATE.NONE);
        socket.emit(actionName, payload);
    };

    let actionControls;
    if (actionState === ACTION_STATE.CHOOSING_WHO_TO_COUP) {
        actionControls = (
            <div>
                <h3>Choose someone to Coup</h3>
                {playerList.map((player, index) => {
                    if (player.username !== playerInfo.username) {
                        return (
                            <Button key={index} style={{ marginRight: '10px' }} onClick={
                                () => {
                                    clickAction('Coup', {
                                        playerCouped: {
                                            socketId: player.socketId,
                                            username: player.username
                                        }
                                    });
                                }
                            }>{player.username}</Button>
                        );
                    }
                })}
            </div>
        );
    } else if (actionState === ACTION_STATE.CHOOSING_CARD_TO_LOSE) {
        actionControls = (
            <div>
                <h3>{actionPackage.message}</h3>
                {playerInfo.cards.map((card, index) => {
                    return (
                        <Button key={index} style={{ marginRight: '10px' }} onClick={
                            () => {
                                sendCardToLose(index);
                            }
                        }>{card}</Button>
                    );
                })}
            </div>
        );
    } else if (actionState === ACTION_STATE.COUNTERACTION) {
        actionControls = (
            <div>
                <h3>{actionPackage.message}</h3>
                {actionPackage.actions.map((action, index) => {
                    if (action.show) {
                        return (
                            <Button key={index} style={{ marginRight: '10px', backgroundColor: action.color }} onClick={
                                () => {
                                    if (action.name === 'Challenge') {
                                        clickAction('Challenge', {
                                            challengedPlayer: {
                                                username: actionPackage.player.username,
                                                socketId: actionPackage.player.socketId
                                            },
                                            character: action.character
                                        });
                                    } else if (action.name === 'Block with Duke') {
                                        clickAction('Block with Duke', actionPackage.player);
                                    } else if (action.name === 'Pass') {
                                        clickAction('Pass');
                                    } else {
                                        console.log('Unknown action clicked.');
                                    }
                                }
                            }>{action.name}</Button>
                        );
                    } else {
                        return null;
                    }
                })}
            </div>
        );
    } else if (actionState === ACTION_STATE.SHOWDOWN) {
        actionControls = (
            <div>
                <h3>You have been challenged. You must show a {actionPackage.card} or choose a card to lose.</h3>
                {playerInfo.cards.map((card, index) => {
                    return (
                        <Button key={index} style={{ marginRight: '10px' }} onClick={
                            () => {
                                clickAction('showCard', {
                                    revealedCard: card,
                                    revealedCardIndex: index,
                                    claimedCard: actionPackage.card,
                                    challenger: {
                                        socketId: actionPackage.challenger.socketId
                                    }
                                });
                            }
                        }>{card}</Button>
                    );
                })}
            </div>
        );
    } else if (actionState === ACTION_STATE.CHOOSING_MAIN_ACTION) {
        actionControls = actionPackage.map((action, index) => {
            if (action.show) {
                let actionFunc;
                switch (action.name) {
                case 'Income':
                    actionFunc = () => {
                        clickAction(action.name);
                    };
                    break;
                case 'Foreign Aid':
                    actionFunc = () => {
                        clickAction(action.name);
                    };
                    break;
                case 'Coup':
                    actionFunc = () => {
                        setActionState(ACTION_STATE.CHOOSING_WHO_TO_COUP);
                    };
                    break;
                case 'Tax':
                    actionFunc = () => {
                        clickAction(action.name);
                    };
                    break;
                case 'Assassinate':
                    actionFunc = () => {
                        clickAction(action.name);
                    };
                    break;
                case 'Exchange':
                    actionFunc = () => {
                        clickAction(action.name);
                    };
                    break;
                case 'Steal':
                    actionFunc = () => {
                        clickAction(action.name);
                    };
                    break;
                }
                return (
                    <Button key={index} style={{ backgroundColor: action.color, borderColor: 'black', color: 'black', marginRight: '10px' }} onClick={actionFunc}>{action.name}</Button>
                );
            } else {
                return null;
            }
        });
    } else {
        actionControls = null;
    }

    return (
        <div>
            {actionControls}
        </div>
    );
}
