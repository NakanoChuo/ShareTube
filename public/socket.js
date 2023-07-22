var Socket = function() {
    this.socket = io();
    this.roomName = getRoomName();
    this.userName = '';
    this.isEntered = false;

    this.socket.emit('enter_room_from_client', {
        roomName: this.roomName,
    });

    this.socket.on('enter_room_from_server', (data)=>{
        if (!this.isEntered) {
            this.userName = data.userName;
            this.isEntered = true;
            addMessage(`You've entered as ${this.userName}.`, 'from_server', data.time);
            onEnterRoom(data);
        } else {
            addMessage(data.msg, 'from_server', data.time);
        }
        updateUsers(data.users);
    });

    this.socket.on('player_info_from_server', (data)=>{
        this.socket.emit('player_info_from_client', Object.assign(data, getPlayerInfo()));
    });
    
    this.socket.on('control_video_from_server', (data)=>{
        if (this.userName != data.userName) {
            onChangeOthersPlayerState(data);
        }
    });

    this.socket.on('update_playlist_from_server', (data)=>{
        if (this.userName != data.userName) {
            updatePlaylist(data.playlist, data.playingIndex);
        }
    });

    this.socket.on('chat_from_server', (data)=>{
        addMessage(data.msg, data.userName, data.time);
    });

    this.socket.on('leave_room_from_server', (data)=>{
        updateUsers(data.users);
        addMessage(data.msg, 'from_server', data.time);
    });
};

Socket.prototype.sendPlay = function() {
    this.socket.emit('control_video_from_client', {
        type: 'play',
    });
};

Socket.prototype.sendPause = function() {
    this.socket.emit('control_video_from_client', {
        type: 'pause',
    });
};

Socket.prototype.sendSeek = function (seekTime) {
    this.socket.emit('control_video_from_client', {
        type: 'seek',
        data: seekTime,
    });
};

Socket.prototype.sendLoad = function(videoId, seekTime, load) {
    this.socket.emit('control_video_from_client', {
        type: 'load',
        data: {
            videoId: videoId,
            seekTime: seekTime,
            load: load,
        },
    });
}

Socket.prototype.sendUpdatePlaylist = function (playlist, playingIndex) {
    this.socket.emit('update_playlist_from_client', {
        playlist: playlist,
        playingIndex: playingIndex,
    });
};

Socket.prototype.sendMessage = function(msg) {
    this.socket.emit('chat_from_client', {
        msg: msg,
    });
};
