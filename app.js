const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const port = process.env.PORT || 3000;

var rooms = {};


app.use('/', express.static(`${__dirname}/public`));

app.get('/', (req, res)=>{
    res.sendFile(`${__dirname}/public/index.html`);
});

app.post('/', (req, res)=>{
    var roomName = Math.random().toString(36).slice(-10);
    console.log(`Created room:${roomName}.`);
    rooms[roomName] = {
        users: []
    };

    res.redirect(`/rooms/${roomName}`);
});

app.get('/rooms/:roomName', (req, res)=>{
    if (req.params.roomName in rooms) {
        res.sendFile(`${__dirname}/public/room.html`);
    } else {
        console.log('Unknown client has tried entering non-existent room.')
        res.status(404).send();
    }
});


io.on('connection', (socket)=>{
    var roomName = '';
    var userName = '';
    const defaultVideoId = 'u7adbYXou8Q';

    socket.on('enter_room_from_client', (data)=>{
        if (data.roomName in rooms) {
            roomName = data.roomName;
            userName = `User-${Math.random().toString(36).slice(-5)}${rooms[roomName].users.length}`;
            rooms[roomName].users.push({
                name: userName,
                socketId: socket.id,
            });

            socket.join(roomName);
            console.log(`${userName} has entered in ${roomName}.`);

            if (rooms[roomName].users.length > 1) {
                io.to(rooms[roomName].users[0].socketId).emit('player_info_from_server', {
                    newUserName: userName,
                });
            } else {
                io.to(roomName).emit('enter_room_from_server', {
                    time: new Date().toLocaleTimeString(),
                    msg: `${userName} has entered.`,
                    userName: userName,
                    users: rooms[roomName].users,
                    isPlaying: true,
                    videoId: defaultVideoId,
                    seekTime: 0,
                    playlist: [],
                    playingIndex: -1,
                });
            }
        }
    });

    socket.on('player_info_from_client', (data)=>{
        io.to(roomName).emit('enter_room_from_server', {
            time: new Date().toLocaleTimeString(),
            msg: `${data.newUserName} has entered.`,
            userName: data.newUserName,
            users: rooms[roomName].users,
            isPlaying: data.isPlaying,
            videoId: data.videoId,
            seekTime: data.seekTime,
            playlist: data.playlist,
            playingIndex: data.playingIndex,
        })
    });

    socket.on('control_video_from_client', (data)=>{
        data.userName = userName;
        io.to(roomName).emit('control_video_from_server', data);
    });

    socket.on('update_playlist_from_client', (data)=>{
        data.userName = userName;
        io.to(roomName).emit('update_playlist_from_server', data);
    });

    socket.on('chat_from_client', (data)=>{
        io.to(roomName).emit('chat_from_server', {
            time: new Date().toLocaleTimeString(),
            msg: data.msg,
            userName: userName,
        });
    });

    socket.on('disconnect', ()=>{
        if (userName == '') {
            console.log('Unknown user has disconnected without entering.');
        } else {
            console.log(`${userName} has leaved in ${roomName}.`);
            rooms[roomName].users.splice(
                rooms[roomName].users.findIndex(
                    (user)=>{ return user.name == userName; }
                ), 1);
            
            if (rooms[roomName].users.length == 0) {
                console.log(`Deleted room:${roomName}`);
                delete rooms[roomName];
            } else {
                io.to(roomName).emit('leave_room_from_server', {
                    time: new Date().toLocaleTimeString(),
                    msg: `${userName} has leaved.`,
                    userName: userName,
                    users: rooms[roomName].users,
                });
            }
        }
    })
});


http.listen(port, ()=>{
    console.log(`Server listening on port:${port}.`);
})