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
            addMessage(`You've entered as ${this.userName}. ---${data.time}`);
        } else {
            addMessage(`${data.msg} ---${data.time}`);
        }
        this.roommateCount = data.roommateCount;
        updateUsers(data.users);
        onEnterRoom(data);
    });
    
    this.socket.on('control_video_from_server', (data)=>{
        if (this.userName != data.userName) {
            onChangeOthersPlayerState(data);
        }
    });

    this.socket.on('chat_from_server', (data)=>{
        addMessage(`${data.userName}:${data.msg} ---${data.time}`);
    });

    this.socket.on('leave_room_from_server', (data)=>{
        updateUsers(data.users);
        addMessage(`${data.msg} ---${data.time}`);
    });
};

Socket.prototype.sendPlay = function() {
    this.socket.emit('control_video_from_client', {
        type: 'play',
    })
}

Socket.prototype.sendPause = function() {
    this.socket.emit('control_video_from_client', {
        type: 'pause',
    })
}

Socket.prototype.sendSeek = function (seekTime) {
    this.socket.emit('control_video_from_client', {
        type: 'seek',
        data: seekTime,
    })
}

Socket.prototype.sendMessage = function(msg) {
    this.socket.emit('chat_from_client', {
        msg: msg,
    });
};
