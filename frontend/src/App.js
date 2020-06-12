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
import constants from './constants';


const socket = io('http://localhost:5000');

function App() {

    const GAME_STATE = {
        JOIN_ROOM: 'join_room',
        LOBBY: 'lobby',
        IN_GAME: 'in_game',
        LOST_GAME: 'lost_game',
        WON_GAME: 'lost_game'
    };

    const ACTION_STATE = constants.ACTION_STATE;

    const [curGameState, setCurGameState] = useState(GAME_STATE.JOIN_ROOM);
    const [playerList, setPlayerList] = useState([]);
    const [roomOwner, setRoomOwner] = useState(null);
    const [playerInfo, setPlayerInfo] = useState({});
    const [curMessage, setCurMessage] = useState(null);
    const [devMode, setDevMode] = useState(true);
    const [actionPackage, setActionPackage] = useState(null);
    const [actionState, setActionState] = useState(ACTION_STATE.NONE);
    const [events, setEvents] = useState([])

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

        const onDealCards = (data) => {
            setCurGameState(GAME_STATE.IN_GAME);
            setPlayerInfo(data);
        };

        const onWaiting = (message) => {
            setCurMessage(message);
        };

        const onActions = () => {
            setCurMessage('Chose an action');
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
            setCurMessage('You lost! 😡😡😡😡 >:(')
            setCurGameState(GAME_STATE.LOST_GAME)
        }

        const onWinGame = () => {
            setCurMessage('You Win! 🎉🎊🎉🎉🎊🎉🎉🎊🎉')
            setCurGameState(GAME_STATE.WON_GAME)
        }

        socket.on('joinRoomSuccess', onJoinRoomSuccess);
        socket.on('joinRoomPlayerInfo', onJoinRoomPlayerInfo);
        socket.on('joinRoomFailed', onJoinRoomFailed);
        socket.on('dealCards', onDealCards);
        socket.on('waiting', onWaiting);
        socket.on('actions', onActions);
        socket.on('updatePlayersInfo', onUpdatePlayersInfo);
        socket.on('updatePlayerInfo', onUpdatePlayerInfo);
        socket.on('updateEvents', onUpdateEvents)
        socket.on('lostGame', onLostGame)

        return () => {
            socket.off('joinRoomSuccess', onJoinRoomSuccess);
            socket.off('joinRoomPlayerInfo', onJoinRoomPlayerInfo);
            socket.off('joinRoomFailed', onJoinRoomFailed);
            socket.off('dealCards', onDealCards);
            socket.off('waiting', onWaiting);
            socket.off('actions', onActions);
            socket.off('updatePlayersInfo', onUpdatePlayersInfo);
            socket.off('updatePlayerInfo', onUpdatePlayerInfo);
            socket.off('updateEvents', onUpdateEvents)
            socket.on('lostGame', onLostGame)
        };
    }, []);

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
    } else if (curGameState === GAME_STATE.IN_GAME || curGameState === GAME_STATE.LOST_GAME) {
        const MyInfoContent = <MyInfo
            playerInfo={playerInfo}
            devMode={devMode}
        />;

        const MessageContent = <Message
            message={(actionPackage && actionPackage.message) || curMessage}
            devMode={devMode}
            lostGame={curGameState === GAME_STATE.LOST_GAME}
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

        let InGameContent;
        if (devMode) {
            InGameContent = (
                <Container className='mt-5'>
                    {MyInfoContent}
                    {MessageContent}
                    {AllPlayerContent}
                    {EventLogContent}
                    {ActionControlsContent}
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
                        justifyContent: 'space-evenly',
                        marginBottom: 20
                    }}>
                        {MyInfoContent}
                        {AllPlayerContent}
                        {EventLogContent}
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
    }

    return (
        <div className="App">
            <Button style={{ marginTop: 5, marginLeft: 5 }} onClick={() => { setDevMode(!devMode); }}>Dev Mode is {devMode ? 'ON' : 'OFF'}</Button>
            {AppContent}
        </div>
    );
}

export default App;
