import React, { useEffect, useState } from 'react';
import { Container, Button } from 'react-bootstrap';
import io from 'socket.io-client';
import MyInfo from './components/MyInfo';
import Message from './components/Message';
import AllPlayers from './components/AllPlayers';
import ActionControls from './components/ActionControls';
import JoinGameScreen from './components/JoinGameScreen';
import LobbyScreen from './components/LobbyScreen';
import constants from './constants';


const socket = io('http://localhost:5000');

function App() {

    const GAME_STATE = {
        JOIN_ROOM: 'join_room',
        LOBBY: 'lobby',
        IN_GAME: 'in_game'
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
            setPlayerInfo(player);
        };

        socket.on('joinRoomSuccess', onJoinRoomSuccess);
        socket.on('joinRoomPlayerInfo', onJoinRoomPlayerInfo);
        socket.on('joinRoomFailed', onJoinRoomFailed);
        socket.on('dealCards', onDealCards);
        socket.on('waiting', onWaiting);
        socket.on('actions', onActions);
        socket.on('updatePlayersInfo', onUpdatePlayersInfo);
        socket.on('updatePlayerInfo', onUpdatePlayerInfo);

        return () => {
            socket.off('joinRoomSuccess', onJoinRoomSuccess);
            socket.off('joinRoomPlayerInfo', onJoinRoomPlayerInfo);
            socket.off('joinRoomFailed', onJoinRoomFailed);
            socket.off('dealCards', onDealCards);
            socket.off('waiting', onWaiting);
            socket.off('actions', onActions);
            socket.off('updatePlayersInfo', onUpdatePlayersInfo);
            socket.off('updatePlayerInfo', onUpdatePlayerInfo);
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
    } else if (curGameState === GAME_STATE.IN_GAME) {
        const MyInfoContent = <MyInfo
            playerInfo={playerInfo}
            devMode={devMode}
        />;

        const MessageContent = <Message
            message={curMessage}
            devMode={devMode}
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

        let InGameContent;
        if (devMode) {
            InGameContent = (
                <Container className='mt-5'>
                    {MyInfoContent}
                    {MessageContent}
                    {AllPlayerContent}
                    {ActionControlsContent}
                </Container >
            );
        } else {
            InGameContent = (
                <Container className='mt-5'>
                    {MessageContent}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row'
                    }}>
                        {MyInfoContent}
                        {AllPlayerContent}
                    </div>
                    {ActionControlsContent}
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
