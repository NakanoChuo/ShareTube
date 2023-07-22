var Slider = function(bar, smallBar, knob, value, onSlideStart, onSlide, onInput) {
    this.bar = bar;
    this.smallBar = smallBar;
    this.knob = knob;
    this.value = (value != undefined) ? value % 100 : 0;
    this.onSlideStart = (onSlideStart != undefined) ? onSlideStart : (event)=>{};
    this.onSlide = (onSlide != undefined) ? onSlide : (event)=>{};
    this.onInput = (onInput != undefined) ? onInput : (event)=>{};
    this.isDragging = false;

    this.changeValue(this.value);

    this.knob.addEventListener('mousedown', (event)=>{
        this.isDragging = true;
        this.onSlideStart(event);
        return false;
    });
    this.bar.addEventListener('mousedown', (event)=>{
        this.isDragging = true;
        var dPos = event.clientX - this.bar.getBoundingClientRect().left;
        var value = 100 * dPos / this.bar.clientWidth;
        this.changeValue(value);

        event.target.value = this.value;
        event.currentTarget.value = this.value;
        this.onSlideStart(event);
        this.onSlide(event);
    }, false);
    document.addEventListener('mousemove', (event)=>{
        if (this.isDragging) {
            var dPos = event.clientX - this.bar.getBoundingClientRect().left;
            if (dPos < 0) { dPos = 0; }
            else if (dPos > this.bar.clientWidth) { dPos = this.bar.clientWidth; }
            var value = 100 * dPos / this.bar.clientWidth;
            this.changeValue(value);
            
            event.target.value = this.value;
            event.currentTarget.value = this.value;
            this.onSlide(event);
        }
    }, false);
    document.addEventListener('mouseup', (event)=>{
        if (this.isDragging) {
            this.isDragging = false;
            event.target.value = this.value;
            event.currentTarget.value = this.value;
            this.onInput(event);
        }
    }, false);
};

Slider.prototype.changeValue = function(value) {
    var pos = this.bar.clientWidth * value / 100;
    this.value = value;
    this.knob.style.left = `${pos - this.knob.clientWidth / 2}px`;
    if (this.smallBar != undefined) {
        this.smallBar.style.width = `${pos}px`;
    }
};

Slider.prototype.addEventListener = function(eventName, callback) {
    if (eventName == 'onSlideStart') {
        this.onSlideStart = callback;
    } else if (eventName == 'onSlide') {
        this.onSlide = callback;
    } else if (eventName = 'onInput') {
        this.onInput = callback;
    }
};