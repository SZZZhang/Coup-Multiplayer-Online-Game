import React from 'react';
import { Card } from 'react-bootstrap';
import CardStack from './CardStack';

export default function AllPlayers({ playerList, devMode }) {
    if (devMode) {
        return (
            <div>
                <h1>All Players</h1>
                <p>{JSON.stringify(playerList, null, 4)}</p>
            </div>
        );
    } else {
        return (
            <div>
                <Card style={{ width: '18rem' }}>
                    <Card.Body>
                        <Card.Title>
                            Other Players
                        </Card.Title>
                        <ul>
                            {
                                playerList.map((player, index) => {
                                    return <li key={index}>
                                        <span style={{ fontWeight: 'bold' }}>{player.username}</span> - Coins: {player.coins} - Number of Cards: {player.numberOfCards}
                                        <div style={{
                                            margin: 5
                                        }}>
                                            <CardStack number={parseInt(player.numberOfCards)} small />
                                        </div>
                                    </li>;
                                })
                            }
                        </ul>
                    </Card.Body>
                </Card>
            </div >
        );
    }
}
