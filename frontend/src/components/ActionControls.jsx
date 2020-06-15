import React, { useEffect, useState } from 'react';
import constants from '../constants';
import { Button } from 'react-bootstrap';

export default function ActionControls({ playerList, playerInfo, socket, actionState, setActionState, actionPackage, setActionPackage }) {

    const ACTION_STATE = constants.ACTION_STATE;

    const [newCards, setNewCards] = useState([])

    console.log(actionState)

    const sendCardToLose = (cardToLoseIndex) => {
        socket.emit('lostCard', { player: playerInfo, cardToLoseIndex });
        setActionState(ACTION_STATE.NONE);
    };

    useEffect(() => {
        const onWaiting = () => {
            console.log('waiting')
            setActionState(ACTION_STATE.NONE);
        };

        const onChooseLoseCard = (message) => {
            console.log('choose lose card');
            console.log(message)
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
            console.log(data)
            setActionPackage(data);
            setActionState(ACTION_STATE.COUNTERACTION);
        };

        const onShowdown = (data) => {
            console.log('showdown');
            console.log(data)
            setActionPackage(data)
            setActionState(ACTION_STATE.SHOWDOWN);
        };

        const onExchangeCards = (data) => {
            console.log('exchangeCards');
            console.log(data)
            setActionPackage(data);
            setActionState(ACTION_STATE.PICKING_CARDS_TO_EXCHANGE);
        }

        socket.on('waiting', onWaiting);
        socket.on('chooseLoseCard', onChooseLoseCard);
        socket.on('counterActions', onCounterActions);
        socket.on('showdown', onShowdown);
        socket.on('exchangeCards', onExchangeCards)

        return () => {
            socket.off('waiting', onWaiting);
            socket.off('chooseLoseCard', onChooseLoseCard);
            socket.off('counterActions', onCounterActions);
            socket.off('showdown', onShowdown);
            socket.off('exchangeCards', onExchangeCards)
        };
    }, [playerInfo]);

    const clickAction = (actionName, payload) => {
        console.log('sending ' + actionName + ' with payload ' + payload);
        setActionState(ACTION_STATE.NONE);
        socket.emit(actionName, payload);
    };

    const onClickChooseNewCard = (cardName) => {
        const newCardArr = [...newCards, cardName];
        if (newCardArr.length >= actionPackage.numberOfCards) {
            console.log('sending new cards selection')
            console.log(newCardArr)
            socket.emit('Exchange Cards', {
                newCards: newCardArr
            })
            setNewCards([])
        } else {
            setNewCards([cardName])
        }
    }

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
    } else if (actionState === ACTION_STATE.CHOOSING_WHO_TO_STEAL_FROM) {
        actionControls = (
            <div>
                <h3>Choose someone to steal from</h3>
                {playerList.map((player, index) => {
                    if (player.username !== playerInfo.username) {
                        return (
                            <Button key={index} style={{ marginRight: '10px' }} onClick={
                                () => {
                                    clickAction('Steal', {
                                        targetPlayer: {
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
    } else if (actionState === ACTION_STATE.CHOOSING_WHO_TO_ASSASSINATE) {
        actionControls = (
            <div>
                <h3>Choose someone to assassinate</h3>
                {playerList.map((player, index) => {
                    if (player.username !== playerInfo.username) {
                        return (
                            <Button key={index} style={{ marginRight: '10px' }} onClick={
                                () => {
                                    clickAction('Assassinate', {
                                        targetPlayer: {
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
                                    } else if (['Block with Duke', 'Block with Ambassador', 'Block with Captain', 'Block with Contessa'].includes(action.name)) {
                                        clickAction(action.name);
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
                            setActionState(ACTION_STATE.CHOOSING_WHO_TO_ASSASSINATE)
                        };
                        break;
                    case 'Exchange':
                        actionFunc = () => {
                            clickAction(action.name);
                        };
                        break;
                    case 'Steal':
                        actionFunc = () => {
                            setActionState(ACTION_STATE.CHOOSING_WHO_TO_STEAL_FROM)
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
    } else if (actionState === ACTION_STATE.PICKING_CARDS_TO_EXCHANGE) {
        const cardsToPickFrom = [...playerInfo.cards, ...actionPackage.cards]
        actionControls = (
            <div>
                <h3>Click on the {actionPackage.numberOfCards} cards you wish to keep</h3>
                {cardsToPickFrom.map((card, index) => {
                    return (
                        <Button key={index} style={{ marginRight: '10px' }} onClick={
                            () => {
                                onClickChooseNewCard(card)
                            }
                        }>{card}</Button>
                    );
                })}
            </div>
        );
    } else {
        actionControls = null;
    }

    return (
        <div>
            {actionControls}
        </div>
    );
}
