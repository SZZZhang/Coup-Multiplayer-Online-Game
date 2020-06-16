import React from 'react'
import { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap'
import CardStack from './CardStack';

export default function EventLog({ devMode, revealedCards }) {
    if (devMode) {
        return (
            <div>
                <h1>Revealed Cards</h1>
                <p>{JSON.stringify(revealedCards, null, 4)}</p>
            </div>
        );
    } else {

        const cardMap = {};
        for (const card of revealedCards) {
            if (!cardMap[card]) {
                cardMap[card] = 0;
            }
            cardMap[card]++
        }

        return (
            <div>
                <Card>
                    <Card.Body>
                        <Card.Title>
                            Revealed Cards
                        </Card.Title>
                        <div style={{
                            display: 'inline-flex',
                            flexDirection: 'row',
                            width: '100%'
                        }}>
                            {
                                Object.keys(cardMap).map((card, index) => {
                                    return (
                                        <CardStack number={cardMap[card]} name={card} />
                                    )
                                })
                            }
                        </div>
                    </Card.Body>
                </Card>
            </div>
        );
    }
}
