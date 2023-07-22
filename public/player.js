var isPlaying = false;
var Player = function(frame) {
    this.frame = frame;
};

Player.prototype.play = function() {
    isPlaying = true;
    this.frame.playVideo();
};

Player.prototype.pause = function() {
    isPlaying = false;
    this.frame.pauseVideo();
};

Player.prototype.load = function(videoId, seekTime, play) {
    if (play) {
        isPlaying = true;
        player.frame.loadVideoById(videoId, seekTime);
    } else {
        isPlaying = false;
        player.frame.cueVideoById(videoId, seekTime);
    }
}

Player.prototype.isPlaying = function() {
    return isPlaying;
};

function onYouTubeIframeAPIReady() {
    new YT.Player('player', {
        height: '400',
        width: '575',
        videoId: '',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
        },
        playerVars: {
            controls: 0,
            disablekb: 1,
        }
    });
}

function onPlayerStateChange(event) {
    switch (event.data) {
        case -1:    // 再生前
            break;
        case YT.PlayerState.ENDED:
            onFinish();
            break;
        case YT.PlayerState.PLAYING:
            if (!isPlaying) {
                onPlayWithTouchingFrame();
                isPlaying = true;
            }
            onPlay();
            break;
        case YT.PlayerState.PAUSED:
            if (isPlaying) {
                onPauseWithTouchingFrame();
                isPlaying = false;
            }
            onPause();
            break;
        case YT.PlayerState.BUFFERING:
            break;
        case YT.PlayerState.CUED:
            break;
        default:
    }
}
