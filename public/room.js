var player;
var socket;
var playlist = [];
var playingIndex = -1;
var history = [];

var seekBar = new Slider(
    document.querySelector('#seekbar'),
    document.querySelector('#seekbar div'),
    document.querySelector('#seekbar button')
);
var timer;

var volume = new Slider(
    document.querySelector('#volume'),
    undefined,
    document.querySelector('#volume button'),
    0
);
volume.lastValue = volume.value;    // 音量0になる直前の値

function onPlayerReady(event) {
    player = new Player(event.target);            
    socket = new Socket();

    player.frame.setVolume(volume.value);
    document.querySelector('#mute_button').addEventListener('click', (event)=>{
        if (!event.target.classList.contains('muted')) {
            volume.changeValue(0);
        } else {
            volume.changeValue(volume.lastValue);
        }
        event.target.classList.toggle('muted');
        player.frame.setVolume(volume.value);
    }, false);
    volume.addEventListener('onSlideStart', (event)=>{ 
        if (event.target.value > 0) {
            volume.lastValue = event.target.value;
        }
        player.frame.setVolume(volume.value);
    });
    volume.addEventListener('onSlide', (event)=>{
        var muteBtn = document.querySelector('#mute_button');
        if (muteBtn.classList.contains('muted') && event.target.value > 0 ||
                !muteBtn.classList.contains('muted') && event.target.value == 0) {
            muteBtn.classList.toggle('muted');
        }
        player.frame.setVolume(event.target.value);
    });
    volume.addEventListener('onInput', (event)=>{
        if (event.target.value > 0) {
            volume.lastValue = event.target.value;
        }
    });
}

function onEnterRoom(event) {
    player.load(event.videoId, event.seekTime, event.isPlaying);

    updatePlaylist(event.playlist, event.playingIndex);

    document.getElementById('play_pause_button').addEventListener('click', onClickPlayPauseButton, false);

    seekBar.addEventListener('onSlideStart', (event)=>{ clearInterval(timer); });
    seekBar.addEventListener('onInput', onSlideSeekbar);

    document.forms['chat'].onsubmit = onSubmitChatMessage;

    document.forms['add_video'].onsubmit = onSubmitAddVideo;

    setTimer();
}

function setTimer() {
    timer = setInterval(function() {
        if (player.isPlaying()) {
            setPlayTime(player.frame.getCurrentTime(), player.frame.getDuration());
        }
    }, 1000);
}

function onClickPlayPauseButton(event) {
    if (player.isPlaying()) {   // ボタン操作による停止
        player.pause();
        socket.sendPause();
    } else {                    // ボタン操作による再生
        player.play();
        socket.sendPlay();
    }
}

function onSlideSeekbar(event) {
    var seekTime = event.target.value * player.frame.getDuration() / 100;
    player.frame.seekTo(seekTime, true);
    socket.sendSeek(seekTime);
    setTimer();
}

function onChangeOthersPlayerState(event) {
    switch (event.type) {
        case 'play':            // 他のユーザによる再生
            player.play();
            break;
        case 'pause':           // 他のユーザによる停止
            player.pause();
            break;
        case 'seek':
            player.frame.seekTo(event.data);
            break;
        case 'load':
            player.load(event.data.videoId, event.data.seekTime, event.data.load);
    }
}

// 動画画面クリックによる再生
function onPlayWithTouchingFrame() {
    socket.sendPlay();
}

// 動画画面クリックによる停止
function onPauseWithTouchingFrame() {
    socket.sendPause();
}

// どの方法で再生したかによらない共通の動作
function onPlay() {
    document.querySelector('#play_pause_button').classList.toggle('pause');
}

// どの方法で停止したかによらない共通の動作
function onPause() {
    document.querySelector('#play_pause_button').classList.toggle('pause');
}

function onFinish() {
    var len = playlist.length;
    var now = playingIndex;
    if (len > 0) {
        if (now < 0) {
            markPlaylist(0);
            player.load(playlist[0].id, 0, true);
        } else if(now < len - 1) {
            markPlaylist(now + 1);
            player.load(playlist[now + 1].id, 0, true);
        } else {
            markPlaylist(-1);
        }
    } else {
        markPlaylist(-1);
    }
}

function onClickDeleteButtonInPlaylist(event) {
    var index = Array.from(document.querySelectorAll('.playlist_item>button')).indexOf(event.target);
    playlist.splice(index, 1);
    var videoInfo = event.target.parentNode;
    videoInfo.parentNode.removeChild(videoInfo);

    if (index == playingIndex) {
        markPlaylist(-1);
    }

    socket.sendUpdatePlaylist(playlist, playingIndex);
}

function onClickVideoInfo(event) {
    var index = Array.from(document.getElementsByClassName('video_info')).indexOf(event.currentTarget);
    markPlaylist(index);
    player.load(playlist[playingIndex].id, 0, true);
    socket.sendUpdatePlaylist(playlist, playingIndex);
    socket.sendLoad(playlist[playingIndex].id, 0, true);
}

function onSubmitAddVideo(event) {
    var videoId = getUrlVar(event.target.elements['videoUrl'].value)['v'];
    addVideoInfoInPlaylist(getVideoInfo(videoId));
    socket.sendUpdatePlaylist(playlist, playingIndex);
    event.target.elements['videoUrl'].value = '';
    return false;
}

function onSubmitChatMessage(event) {
    socket.sendMessage(
        event.target.elements['message'].value
    );
    event.target.elements['message'].value = '';
    return false;
};

function getRoomName() {
    return location.href.split('/').pop();
}

function getPlayerInfo() {
    return {
        isPlaying: player.isPlaying(),
        videoId: getUrlVar(player.frame.getVideoUrl())['v'],
        seekTime: player.frame.getCurrentTime(),
        playlist: playlist,
        playingIndex: playingIndex,
    }
}

function getUrlVar(url) {
    var ret = {};
    var query = url.split('?')[1];
    query.split('&').forEach((q)=>{
        let k = q.split('=')[0];
        let v = q.split('=')[1];
        ret[k] = v;
    });
    return ret;
}

function getVideoInfo(id) {
    return {
        id: id,
        img_src: `http://img.youtube.com/vi/${id}/default.jpg`,
    };
}

function setPlayTime(current, total) {
    function zeroPadding(num, len) {
        return (Array(len).join('0') + num).slice(-len);
    }

    function timeStr(sec, hourPaddings) {
        var hour = Math.floor(sec / 3600);
        var min = Math.floor(sec % 3600 / 60);
        sec = Math.floor(sec % 60);
        return `${zeroPadding(hour, hourPaddings)}:${zeroPadding(min, 2)}:${zeroPadding(sec, 2)}`;
    }

    if (total > 0) {
        var tHour = Math.floor(total / 3600);
        var currentStr = timeStr(current, `${tHour}`.length);
        var totalStr = timeStr(total, `${tHour}`.length);
        document.getElementById('playtime').textContent = currentStr + '/' + totalStr;
        seekBar.changeValue(current / total * 100);
    }
}

function updatePlaylist(newPlaylist, newPlayingIndex) {
    playlist = [];

    var playlistItems = Array.from(document.getElementsByClassName('playlist_item'));
    playlistItems.forEach((playlistItem)=>{
        playlistItem.parentNode.removeChild(playlistItem);
    });

    newPlaylist.forEach(addVideoInfoInPlaylist);
    markPlaylist(newPlayingIndex);
}

function markPlaylist(index) {
    playingIndex = index;
    var videoInfos = Array.from(document.getElementsByClassName('video_info'));
    videoInfos.forEach((videoInfo)=>{
        videoInfo.classList.remove('playing');
    });
    if (playingIndex >= 0) {
        videoInfos[playingIndex].classList.add('playing');
    }
}

function addVideoInfoInPlaylist(videoInfo) {
    var div = document.querySelector('#playlist');
    var t = document.querySelector('#playlist_item_template');

    var clone = document.importNode(t.content, true);
    clone.querySelector('img').src = videoInfo.img_src;
    clone.querySelector('button').addEventListener('click', onClickDeleteButtonInPlaylist, false);
    clone.querySelector('.video_info').addEventListener('click', onClickVideoInfo, false);

    playlist.push(videoInfo);
    div.appendChild(clone);
}

function addVideoInfoInHistory(videoInfo) {
    var div = document.querySelector('#history');
    var t = document.querySelector('#history_item_template');

    var clone = document.importNode(t.content, true);
    clone.querySelector('img').src = videoInfo.img_src;
    clone.querySelector('.video_info').addEventListener('click', onClickVideoInfo, false);

    history.push(videoInfo);
    div.appendChild(clone);
}

function addMessage(msg, from, timestamp) {
    var div = document.querySelector('#messages');
    var t = document.querySelector('#message_info_template');

    var clone = document.importNode(t.content, true);
    var type = 'other';
    if (from == 'from_server') {
        type = 'server';
    } else if (from == socket.userName) {
        type = 'you';
    }
    clone.querySelector('.message_info').classList.add(type);
    clone.querySelector('.message').textContent = msg;
    clone.querySelector('.username').textContent = from;
    clone.querySelector('.timestamp').textContent = timestamp;

    div.appendChild(clone);
}

function updateUsers(users) {
    var ul = document.getElementById('users');
    while(ul.firstChild) { ul.removeChild(ul.firstChild); }
    users.forEach((user)=>{
        var li = document.createElement('li');
        li.appendChild(document.createTextNode(user.name));
        if (user.name == socket.userName) {
            li.classList.add('you');
        } else {
            li.classList.add('other');
        }
        ul.appendChild(li);
    });
}
