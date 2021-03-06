import React, { useEffect, useState } from 'react';
import { Container, Button } from 'react-bootstrap';
import io from 'socket.io-client';
import MyInfo from './components/MyInfo';
import Message from './components/Message';
import AllPlayers from './components/AllPlayers';
import ActionControls from './components/ActionControls';
import JoinGameScreen from './components/JoinGameScreen';
import LobbyScreen from './components/LobbyScreen';
import EventLog from './components/EventLog'
import RevealedCards from './components/RevealedCards'
import constants from './constants';
import EndGameScreen from './components/EndGameScreen';


const socket = io('http://localhost:5000');

function App() {

    const GAME_STATE = constants.GAME_STATE;

    const ACTION_STATE = constants.ACTION_STATE;

    const [curGameState, setCurGameState] = useState(GAME_STATE.JOIN_ROOM);
    const [gameOver, setGameOver] = useState(false);
    const [leaderboard, setLeaderboard] = useState(null);
    const [playerList, setPlayerList] = useState([]);
    const [roomOwner, setRoomOwner] = useState(null);
    const [playerInfo, setPlayerInfo] = useState({});
    const [curMessage, setCurMessage] = useState(null);
    const [devMode, setDevMode] = useState(true);
    const [actionPackage, setActionPackage] = useState(null);
    const [actionState, setActionState] = useState(ACTION_STATE.NONE);
    const [events, setEvents] = useState([])
    const [revealedCards, setRevealedCards] = useState([])   

    useEffect(() => {
        const onJoinRoomSuccess = (data) => {
            const room = data.room;
            setPlayerList(room.players);
            setRoomOwner(room.owner.username);
            setCurGameState(GAME_STATE.LOBBY);
        };

        const onJoinRoomPlayerInfo = (data) => {
            setPlayerInfo(data);
        };

        const onJoinRoomFailed = ({ message }) => {
            alert(message);
        };

        const onStartRoomFailed = ({ message }) => {
            alert(message);
        };

        const onDealCards = (data) => {
            console.log('deal cards')
            setGameOver(false);
            setLeaderboard(null);
            setCurGameState(GAME_STATE.IN_GAME);
            setPlayerInfo(data);
        };

        const onWaiting = (message) => {
            if (curGameState === GAME_STATE.IN_GAME) {
                setCurMessage(message);
            }
        };

        const onActions = (actions) => {
            if (curGameState === GAME_STATE.IN_GAME) {
                setCurMessage('Choose an action');
                setActionPackage(actions);
                setActionState(ACTION_STATE.CHOOSING_MAIN_ACTION);
            }
        };

        const onUpdatePlayersInfo = ({ playerList }) => {
            setPlayerList(playerList);
        };

        const onUpdatePlayerInfo = (player) => {
            console.log('update player info')
            console.log(player)
            setPlayerInfo(player);
        };

        const onUpdateEvents = (newEvents) => {
            console.log('update events');
            setEvents(newEvents)
        };

        const onLostGame = () => {
            setGameOver(true);
            console.log('got lose game event')
            setCurMessage('You lost! 😡😡😡😡 Waiting for game to end...')
            setCurGameState(GAME_STATE.LOST_GAME)
            setActionPackage(null);
        }

        const onWinGame = () => {
            console.log('got win game event')
            setCurMessage('You Win! 🎉🎊🎉🎉🎊🎉🎉🎊🎉')
            setCurGameState(GAME_STATE.WON_GAME)
            setActionPackage(null);
        }

        const onGameOver = (leaderboard) => {
            setGameOver(true);
            setLeaderboard(leaderboard);
        }

        const onUpdateRevealedCards = (revealedCards) => {
            setRevealedCards(revealedCards)
        }

        socket.on('joinRoomSuccess', onJoinRoomSuccess);
        socket.on('joinRoomPlayerInfo', onJoinRoomPlayerInfo);
        socket.on('joinRoomFailed', onJoinRoomFailed);
        socket.on('startRoomFailed', onStartRoomFailed);
        socket.on('dealCards', onDealCards);
        socket.on('waiting', onWaiting);
        socket.on('actions', onActions);
        socket.on('updatePlayersInfo', onUpdatePlayersInfo);
        socket.on('updatePlayerInfo', onUpdatePlayerInfo);
        socket.on('updateEvents', onUpdateEvents)
        socket.on('lostGame', onLostGame)
        socket.on('winGame', onWinGame)
        socket.on('gameOver', onGameOver)
        socket.on('updateRevealedCards', onUpdateRevealedCards)

        return () => {
            socket.off('joinRoomSuccess', onJoinRoomSuccess);
            socket.off('joinRoomPlayerInfo', onJoinRoomPlayerInfo);
            socket.off('joinRoomFailed', onJoinRoomFailed);
            socket.off('startRoomFailed', onStartRoomFailed);
            socket.off('dealCards', onDealCards);
            socket.off('waiting', onWaiting);
            socket.off('actions', onActions);
            socket.off('updatePlayersInfo', onUpdatePlayersInfo);
            socket.off('updatePlayerInfo', onUpdatePlayerInfo);
            socket.off('updateEvents', onUpdateEvents)
            socket.off('lostGame', onLostGame)
            socket.off('winGame', onWinGame)
            socket.off('gameOver', onGameOver)
            socket.off('updateRevealedCards', onUpdateRevealedCards)
        };
    }, [curGameState]);

    useEffect(() => {
        return () => {
            socket.disconnect();
        };
    }, []);

    let AppContent;
    if (curGameState === GAME_STATE.JOIN_ROOM) {
        AppContent = <JoinGameScreen
            socket={socket}
            devMode={devMode}
        />;
    } else if (curGameState === GAME_STATE.LOBBY) {
        AppContent = <LobbyScreen
            playerList={playerList}
            roomOwner={roomOwner}
            playerInfo={playerInfo}
            socket={socket}
            devMode={devMode}
        />;
    } else if (curGameState === GAME_STATE.IN_GAME) {
        const MyInfoContent = <MyInfo
            playerInfo={playerInfo}
            devMode={devMode}
        />;

        const MessageContent = <Message
            message={(actionPackage && actionPackage.message) || curMessage}
            devMode={devMode}
            curGameState={curGameState}
            socket={socket}
        />;

        const AllPlayerContent = <AllPlayers
            playerList={playerList}
            devMode={devMode}
        />;

        const ActionControlsContent = <ActionControls
            playerInfo={playerInfo}
            playerList={playerList}
            socket={socket}
            devMode={devMode}
            actionPackage={actionPackage}
            setActionPackage={setActionPackage}
            actionState={actionState}
            setActionState={setActionState}
        />;

        const EventLogContent = <EventLog
            devMode={devMode}
            events={events}
        />

        const RevealedCardsContent = <RevealedCards
            devMode={devMode}
            revealedCards={revealedCards}
        />

        let InGameContent;
        if (devMode) {
            InGameContent = (
                <Container className='mt-5'>
                    {MyInfoContent}
                    {MessageContent}
                    {AllPlayerContent}
                    {EventLogContent}
                    {ActionControlsContent}
                    {RevealedCardsContent}
                </Container >
            );
        } else {
            InGameContent = (
                <Container className='mt-5' style={{
                    justifyContent: 'space-evenly'
                }}>
                    <div style={{
                        marginBottom: 20
                    }}>
                        {MessageContent}
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        justifyContent: 'space-evenly',
                        marginBottom: 20
                    }}>
                        {MyInfoContent}
                        {AllPlayerContent}
                        {EventLogContent}
                        {RevealedCardsContent}
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-evenly',
                        marginBottom: 20
                    }}>
                        {ActionControlsContent}
                    </div>
                </Container >
            );
        }
        AppContent = InGameContent;
    } else if (curGameState === GAME_STATE.LOST_GAME || curGameState === GAME_STATE.WON_GAME) {
        AppContent = (
            <EndGameScreen
                devMode={devMode}
                curGameState={curGameState}
                socket={socket}
                leaderboard={leaderboard}
            />
        )
    }

    return (
        <div className="App">
            <Button style={{ marginTop: 5, marginLeft: 5 }} onClick={() => { setDevMode(!devMode); }}>Dev Mode is {devMode ? 'ON' : 'OFF'}</Button>
            {AppContent}
        </div>
    );
}

export default App;
