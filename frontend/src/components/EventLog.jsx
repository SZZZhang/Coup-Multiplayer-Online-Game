import React from 'react'
import { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap'

export default function EventLog({ devMode, events }) {
    if (devMode) {
        return (
            <div>
                <h1>Event Log</h1>
                <p>{JSON.stringify(events, null, 4)}</p>
            </div>
        );
    } else {
        return (
            <div>
                <Card style={{ width: '18rem' }}>
                    <Card.Body>
                        <Card.Title>
                            Event Log
                        </Card.Title>
                        <ul>
                            {
                                events.map((event, index) => {
                                    return <li key={index} style={event.priority === 1 ? { color: 'black' } : { color: 'grey' }}>
                                        {event.name}
                                    </li>;
                                })
                            }
                        </ul>
                    </Card.Body>
                </Card>
            </div>
        );
    }
}
