import React from 'react';
import { Container, Form, Button } from 'react-bootstrap';
import Card from './CardStack'
import CardStack from './CardStack';
import RevealedCards from './RevealedCards'

export default function JoinGameScreen({ socket }) {

    const onCreateJoinRoom = (e) => {
        e.preventDefault();
        const roomName = document.getElementById('room-name').value;
        const userName = document.getElementById('user-name').value;
        socket.emit('joinRoom', { roomName: roomName, username: userName });
        return false;
    };

    return (
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
}
