import React, { useEffect, useState } from 'react';
import { Container, Button, Form, Card, ListGroup, Badge } from 'react-bootstrap';
import io from 'socket.io-client';
const socket = io('http://localhost:5000')

function App() {

    const GAME_STATE = {
        JOIN_ROOM: 'join_room',
        LOBBY: 'lobby',
        IN_GAME: 'in_game'
    }

    const [curGameState, setCurGameState] = useState(GAME_STATE.JOIN_ROOM);
    const [playerList, setPlayerList] = useState([]);
    const [roomOwner, setRoomOwner] = useState(null);

    useEffect(() => {
        socket.on('joinRoomSuccess', (room) => {
            console.log(room);
            setPlayerList(room.players);
            setRoomOwner(room.owner.username);
            setCurGameState(GAME_STATE.LOBBY);
        })
        socket.on('joinRoomFailed', ({ message }) => {
            alert(message);
        })

        return () => {
            socket.disconnect();
        }
    }, [])

    const onCreateJoinRoom = (e) => {
        e.preventDefault();
        const roomName = document.getElementById('room-name').value;
        const userName = document.getElementById('user-name').value;
        console.log(roomName + ' ' + userName);
        console.log('join room!');
        socket.emit('joinRoom', { room: roomName, username: userName });
        return false;
    }

    const LobbyContent = (
        <Container className='mt-5'>
            <Card style={{ width: '18rem' }}>
                <ListGroup variant="flush">
                    {playerList.map((player, index) => {
                        return (
                            <ListGroup.Item key={index}>{player.username}{player.username === roomOwner ? <span> <Badge variant="primary">Owner</Badge></span> : null}</ListGroup.Item>
                        )
                    })}
                </ListGroup>
            </Card>
            {JSON.stringify(playerList, null, 4)}
        </Container>
    )

    const JoinRoomContent = (
        <Container className='mt-5'>
            <h1 className='mb-4'>Coup, the game.</h1>
            <Form onSubmit={(e) => { onCreateJoinRoom(e); return false }}>
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
    )

    let AppContent;
    if (curGameState === GAME_STATE.JOIN_ROOM) {
        AppContent = JoinRoomContent;
    } else if (curGameState === GAME_STATE.LOBBY) {
        AppContent = LobbyContent;
    }

    return (
        <div className="App">
            {AppContent}
        </div>
    );
}

export default App;
