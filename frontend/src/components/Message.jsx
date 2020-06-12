import React from 'react';
import { Alert } from 'react-bootstrap';

export default function Message({ message, devMode, lostGame }) {
    if (devMode) {
        return (
            <div>
                <h1>Message</h1>
                <p>{JSON.stringify(message, null, 4)}</p>
            </div>
        );
    } else {
        return (
            <div style={{ margin: 20 }}>
                <Alert variant={lostGame ? 'danger' : 'secondary'}>{message}</Alert>
            </div>
        );
    }
}
