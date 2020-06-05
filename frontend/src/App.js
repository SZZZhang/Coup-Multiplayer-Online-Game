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

    const [curGameState, setCurGameState] = useState(GAME_STATE.JOIN_ROOM);
    const [playerList, setPlayerList] = useState([]);
    const [roomOwner, setRoomOwner] = useState(null);
    const [playerInfo, setPlayerInfo] = useState(null);
    const [playerCards, setPlayerCards] = useState([]);
    const [playerActions, setPlayerActions] = useState([]);
    const [curTurnPlayer, setCurTurnPlayer] = useState(null);


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

        socket.on('dealCards', ({ cards }) => {
            setCurGameState(GAME_STATE.IN_GAME);
            setPlayerCards(cards);
        });

        socket.on('actions', (actions) => {
            console.log(actions);
            setPlayerActions(actions);
            setCurTurnPlayer('me');
        });

        socket.on('updatePlayersInfo', ({ playerList }) => {
            console.log(playerList);
            setPlayerList(playerList);
        })

        socket.on('updatePlayerInfo', (player) => {
            console.log(player);
            setPlayerInfo(player);
        })

        socket.on('waiting', (curPlayer) => {
            setPlayerActions([]);
            setCurTurnPlayer(curPlayer);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

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

    const clickAction = (actionName) => {
        console.log('clicked ' + actionName);
        socket.emit(actionName, playerInfo);
    };

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
            return (
                <Button key={index} style={{ backgroundColor: action.color, borderColor: 'black', color: 'black', marginRight: '10px' }} onClick={() => { clickAction(action.name); }}>{action.name}</Button>
            );
        });
        // { name: 'Income', character: 0, show: 1},
        // { name: 'Foreign Aid', character: 0, show: 1 },  
        // { name: 'Coup', character: 0, show: 1 },  
        // { name: 'Tax', character: 'Duke', show: 1 },  
        // { name: 'Assasinate', character: 'Assassin', show: 1 },  
        // { name: 'Exchange', character: 'Ambassador', show: 1 },  
        // { name: 'Steal', character: 'Captain', show: 1 },  

        const InGameContent = (
            <Container className='mt-5'>
                <h1>My Info</h1>
                <p>{JSON.stringify(playerInfo, null, 4)}</p>
                <h1>Cards</h1>
                <p>{JSON.stringify(playerCards, null, 4)}</p>
                <h1>Actions</h1>
                <p>{JSON.stringify(playerActions, null, 4)}</p>
                <h1>Current Player</h1>
                <p>{JSON.stringify(curTurnPlayer, null, 4)}</p>
                <span>
                    {ActionButtons}
                </span>
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
