import React from 'react'
import { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap'

export default function EventLog({ devMode, revealedCards }) {
    if (devMode) {
        return (
            <div>
                <h1>Revealed Cards</h1>
                <p>{JSON.stringify(revealedCards, null, 4)}</p>
            </div>
        );
    } else {
        return (
            <div>
                <Card style={{ width: '18rem' }}>
                    <Card.Body>
                        <Card.Title>
                            Revealed Cards
                        </Card.Title>
                        <ul>
                            {
                                revealedCards.map((card, index) => {
                                    return (
                                        <li key={index}>
                                            {card}
                                        </li>
                                    )
                                })
                            }
                        </ul>
                    </Card.Body>
                </Card>
            </div>
        );
    }
}
