import React, { useEffect, useState } from 'react';
import { Container, Button, Form, Card, ListGroup, Badge } from 'react-bootstrap';
import io from 'socket.io-client';
const socket = io('http://localhost:5000');

function App() {

    const GAME_STATE = {
        JOIN_ROOM: 'join_room',
        LOBBY: 'lobby',
        IN_GAME: 'in_game'
    };

    const ACTION_STATE = {
        NONE: 'none',
        CHOOSING_WHO_TO_COUP: 'choosing_who_to_coup',
        CHOOSING_CARD_TO_LOSE_COUP: 'choosing_card_to_lose_coup'
    }

    const [curGameState, setCurGameState] = useState(GAME_STATE.JOIN_ROOM);
    const [curActionState, setCurActionState] = useState(ACTION_STATE.NONE);
    const [playerList, setPlayerList] = useState([]);
    const [roomOwner, setRoomOwner] = useState(null);
    const [playerInfo, setPlayerInfo] = useState({});
    const [playerActions, setPlayerActions] = useState([]);
    const [curTurnPlayer, setCurTurnPlayer] = useState(null);

    console.log(playerInfo);

    const onChooseLoseCard = () => {
        console.log(playerInfo);
        if (playerInfo.cards.length === 1) {
            sendCardToLose(0);
        } else {
            setCurActionState(ACTION_STATE.CHOOSING_CARD_TO_LOSE_COUP);
        }
    }

    const onCreateJoinRoom = (e) => {
        e.preventDefault();
        const roomName = document.getElementById('room-name').value;
        const userName = document.getElementById('user-name').value;
        socket.emit('joinRoom', { roomName: roomName, username: userName });
        return false;
    };

    const startGame = () => {
        socket.emit('startGame');
    };

    const clickAction = (actionName, payload) => {
        console.log('sending ' + actionName + ' with payload ' + payload);
        socket.emit(actionName, payload);
    };

    const sendCardToLose = (cardToLoseIndex) => {
        socket.emit('lostCard', { player: playerInfo, cardToLoseIndex });
    }

    useEffect(() => {
        socket.on('joinRoomSuccess', (data) => {
            const room = data.room;
            setPlayerList(room.players);
            setRoomOwner(room.owner.username);
            setCurGameState(GAME_STATE.LOBBY);
        });

        socket.on('joinRoomPlayerInfo', (data) => {
            setPlayerInfo(data);
        });

        socket.on('joinRoomFailed', ({ message }) => {
            alert(message);
        });

        socket.on('dealCards', (data) => {
            setCurGameState(GAME_STATE.IN_GAME);
            setPlayerInfo(data);
        });

        socket.on('actions', (actions) => {
            setPlayerActions(actions);
            setCurTurnPlayer('me');
        });

        socket.on('updatePlayersInfo', ({ playerList }) => {
            setPlayerList(playerList);
        })

        socket.on('updatePlayerInfo', (player) => {
            console.log(playerInfo);
            setPlayerInfo(player);
        })

        socket.on('waiting', (curPlayer) => {
            setPlayerActions([]);
            setCurTurnPlayer(curPlayer);
        });

        socket.on('chooseLoseCard', () => {
            console.log(playerInfo)
            onChooseLoseCard();
        })

        return () => {
            socket.disconnect();
        };
    }, []);

    let AppContent;
    if (curGameState === GAME_STATE.JOIN_ROOM) {
        const JoinRoomContent = (
            <Container className='mt-5'>
                <h1 className='mb-4'>Coup, the game.</h1>
                <Form onSubmit={(e) => { onCreateJoinRoom(e); return false; }}>
                    <Form.Group controlId="room-name">
                        <Form.Label>Create or Join a Game Room</Form.Label>
                        <Form.Control required type="text" placeholder="Room name" />
                    </Form.Group>
                    <Form.Group controlId="user-name">
                        <Form.Label>Username</Form.Label>
                        <Form.Control required type="text" placeholder="Username" />
                    </Form.Group>
                    <Button variant="primary" className='mr-3' type="submit">Create/Join Room</Button>
                </Form>
            </Container>
        );
        AppContent = JoinRoomContent;
    } else if (curGameState === GAME_STATE.LOBBY) {
        const LobbyContent = (
            <Container className='mt-5'>
                <Card style={{ width: '18rem' }}>
                    <ListGroup variant="flush">
                        {playerList.map((player, index) => {
                            return (
                                <ListGroup.Item key={index}>{player.username}{player.username === roomOwner ? <span> <Badge variant="primary">Owner</Badge></span> : null}</ListGroup.Item>
                            );
                        })}
                    </ListGroup>
                </Card>
                {JSON.stringify(playerList, null, 4)}
                <div>
                    {playerInfo.username === roomOwner ? <Button onClick={startGame}>Start</Button> : null}
                </div>
            </Container>

        );
        AppContent = LobbyContent;
    } else if (curGameState === GAME_STATE.IN_GAME) {
        const ActionButtons = playerActions.map((action, index) => {
            if (action.show) {
                let actionFunc;
                switch (action.name) {
                    case 'Income':
                        actionFunc = () => {
                            clickAction(action.name);
                        }
                        break;
                    case 'Foregin Aid':
                        actionFunc = () => {
                            clickAction(action.name);
                        }
                        break;
                    case 'Coup':
                        actionFunc = () => {
                            setCurActionState(ACTION_STATE.CHOOSING_WHO_TO_COUP);
                        }
                        break;
                    case 'Tax':
                        actionFunc = () => {
                            clickAction(action.name);
                        }
                        break;
                    case 'Assasinate':
                        actionFunc = () => {
                            clickAction(action.name);
                        }
                        break;
                    case 'Exchange':
                        actionFunc = () => {
                            clickAction(action.name);
                        }
                        break;
                    case 'Steal':
                        actionFunc = () => {
                            clickAction(action.name);
                        }
                        break;
                }
                return (
                    <Button key={index} style={{ backgroundColor: action.color, borderColor: 'black', color: 'black', marginRight: '10px' }} onClick={actionFunc}>{action.name}</Button>
                );
            } else {
                return null;
            }
        });

        let actionControls;
        if (curActionState === ACTION_STATE.CHOOSING_WHO_TO_COUP) {
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
                                                socketId: player.socketId
                                            }
                                        });
                                    }
                                }>{player.username}</Button>
                            )
                        }
                    })}
                </div>
            );
        } else if (curActionState === ACTION_STATE.CHOOSING_CARD_TO_LOSE_COUP) {
            actionControls = (
                <div>
                    <h3>You have been couped! Choose a card to lose.</h3>
                    {playerInfo.cards.map((card, index) => {
                        return (
                            <Button key={index} style={{ marginRight: '10px' }} onClick={
                                () => {
                                    sendCardToLose(index);
                                }
                            }>{card}</Button>
                        )
                    })}
                </div>
            )
        } else {
            actionControls = null;
        }

        const InGameContent = (
            <Container className='mt-5'>
                <h1>My Info</h1>
                <p>{JSON.stringify(playerInfo, null, 4)}</p>
                <h1>Cards</h1>
                <p>{JSON.stringify(playerInfo.cards, null, 4)}</p>
                <h1>Actions</h1>
                <p>{JSON.stringify(playerActions, null, 4)}</p>
                <h1>Current Player</h1>
                <p>{JSON.stringify(curTurnPlayer, null, 4)}</p>
                <h1>All Players</h1>
                <p>{JSON.stringify(playerList, null, 4)}</p>
                <span>
                    {ActionButtons}
                </span>
                <div>
                    {actionControls}
                </div>
            </Container>
        );
        AppContent = InGameContent;
    }

    return (
        <div className="App">
            {AppContent}
        </div>
    );
}

export default App;
