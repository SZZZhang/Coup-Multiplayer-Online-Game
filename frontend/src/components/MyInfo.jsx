import React from 'react';
import { Card } from 'react-bootstrap';
import CardStack from './CardStack'

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
                <Card>
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
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                margin: 10
                            }}>
                                {
                                    playerInfo.cards.map((card, index) => {
                                        return (
                                            <CardStack key={index} name={card} number={1} />
                                        )
                                    })
                                }
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        );
    }
}
