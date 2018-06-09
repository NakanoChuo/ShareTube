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

    socket.on('enter_room_from_client', (data)=>{
        if (data.roomName in rooms) {
            roomName = data.roomName;
            userName = `User-${Math.random().toString(36).slice(-5)}${rooms[roomName].users.length}`;
            rooms[roomName].users.push(userName);

            socket.join(roomName);

            console.log(`${userName} has entered in ${roomName}.`);
            io.to(roomName).emit('enter_room_from_server', {
                date: new Date().toLocaleTimeString(),
                msg: `${userName} has entered.`,
                userName: userName,
                users: rooms[roomName].users,
            });
        }
    });

    socket.on('control_video_from_client', (data)=>{
        io.to(roomName).emit('control_video_from_server', {
            type: data.type,
            userName: userName,
        })
    });

    socket.on('chat_from_client', (data)=>{
        io.to(roomName).emit('chat_from_server', {
            date: new Date().toLocaleTimeString(),
            msg: data.msg,
            userName: userName,
        });
    });

    socket.on('disconnect', ()=>{
        if (userName == '') {
            console.log('Unknown user has disconnected without entering.');
        } else {
            console.log(`${userName} has leaved in ${roomName}.`);

            rooms[roomName].users.splice(rooms[roomName].users.indexOf(userName), 1);
            if (rooms[roomName].users.length == 0) {
                console.log(`Deleted room:${roomName}`);
                delete rooms[roomName];
            } else {
                io.to(roomName).emit('leave_room_from_server', {
                    date: new Date().toLocaleTimeString(),
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