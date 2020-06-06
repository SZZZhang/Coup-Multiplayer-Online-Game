import React from 'react';
import { Container, Card, ListGroup, Button, Badge } from 'react-bootstrap';

export default function LobbyScreen({ playerList, roomOwner, playerInfo, socket, devMode }) {

    const startGame = () => {
        socket.emit('startGame');
    };

    if (devMode) {
        return (
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
    } else {
        return (
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
                <div style={{ marginTop: 15 }}>
                    {playerInfo.username === roomOwner ? <Button onClick={startGame}>Start</Button> : null}
                </div>
            </Container>
        );
    }
}
