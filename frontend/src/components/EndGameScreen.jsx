import React from 'react'
import constants from '../constants'
import { Button, Container } from 'react-bootstrap';

export default function EndGameScreen({ devMode, curGameState, socket, leaderboard }) {

    const restartGame = () => {
        socket.emit('restartGame');
    }

    let bgColor;
    let primaryText;
    let secondaryText;
    let wonGame;
    let gameEnded = !!leaderboard;
    if (curGameState === constants.GAME_STATE.LOST_GAME) {
        wonGame = false;
        bgColor = '#ffaca6';
        primaryText = 'You lost! 😡😡😡😡';
    } else if (curGameState === constants.GAME_STATE.WON_GAME) {
        wonGame = true;
        bgColor = '#b8ffa6';
        primaryText = 'You win! You Win! 🎉🎊🎉🎉🎊🎉🎉🎊🎉';
    }

    if (leaderboard) {
        secondaryText = JSON.stringify(leaderboard);
    } else {
        secondaryText = 'Waiting for game to end...';
    }

    return (
        <Container className='mt-5' style={{
            height: '100%'
        }}>
            <div className='p-5' style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                alignContent: 'center',
                backgroundColor: bgColor,
                textAlign: 'center',
                borderRadius: 40
            }}>
                <div style={{
                    flexGrow: 1,
                    fontSize: 40,
                    marginBottom: 20
                }}>
                    {primaryText}
                </div>
                <div style={{
                    flexGrow: 1,
                    fontSize: 20,
                }}>
                    {secondaryText}
                </div>
                <div style={{
                    marginTop: 20
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        marginTop: 30,
                        justifyContent: 'center'
                    }}>
                        <img src={wonGame ? 'https://media1.tenor.com/images/95b086d08546be2b72b7dfad7a87634e/tenor.gif' : 'https://i.pinimg.com/originals/8a/ce/0b/8ace0bd4e6e94bed0a4a1a9883670008.gif'} />
                    </div>
                </div>
                <div style={{
                    marginTop: 20
                }}>
                    {gameEnded ? <Button onClick={restartGame}>
                        Restart Game
                    </Button> : null}
                </div>
            </div>
        </Container>
    )
}
