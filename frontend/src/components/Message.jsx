import React from 'react';
import { Alert } from 'react-bootstrap';
import constants from '../constants'

export default function Message({ message, devMode, curGameState, socket }) {
    const restartGame = () => {
        socket.emit('startGame');
    }

    if (devMode) {
        return (
            <div>
                <h1>Message</h1>
                <p>{JSON.stringify(message, null, 4)}</p>
            </div>
        );
    } else {
        let alertVariant = 'secondary';
        if (curGameState === constants.GAME_STATE.WON_GAME) {
            alertVariant = 'success'
        } else if (curGameState === constants.GAME_STATE.LOST_GAME) {
            alertVariant = 'danger'
        }
        return (
            <div style={{ margin: 20 }}>
                <Alert variant={alertVariant}>
                    {message}
                    {curGameState === constants.GAME_STATE.WON_GAME ?
                        <div>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                marginTop: 30,
                                justifyContent: 'center'
                            }}>
                                <img src='https://media1.tenor.com/images/95b086d08546be2b72b7dfad7a87634e/tenor.gif' />
                            </div>
                            <button className = 'btn btn-primary' onClick={restartGame}>Restart Game</button>
                        </div>
                        : null}
                </Alert>
            </div>
        );
    }
}
