import React from 'react';
import { Card } from 'react-bootstrap';

export default function MyInfo({ playerInfo, devMode }) {
    if (devMode) {
        return (
            <div>
                <h1>My Info</h1>
                <p>{JSON.stringify(playerInfo, null, 4)}</p>
            </div>
        );
    } else {
        return (
            <div>
                <Card style={{ width: '18rem' }}>
                    <Card.Body>
                        <Card.Title>
                            My Info
                        </Card.Title>
                        <div style={{ marginBottom: 10 }}>
                            <span style={{ fontWeight: 'bold' }}>My Username: </span>{playerInfo.username}
                        </div>
                        <div style={{ marginBottom: 10 }}>
                            <span style={{ fontWeight: 'bold' }}>My Coins: </span>{playerInfo.coins}
                        </div>
                        <div style={{ marginBottom: 10 }}>
                            <span style={{ fontWeight: 'bold' }}>My Cards</span>
                            <ul>
                                {
                                    playerInfo.cards.map((card, index) => {
                                        return <li key={index}>{card}</li>;
                                    })
                                }
                            </ul>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        );
    }
}
