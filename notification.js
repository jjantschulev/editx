module.exports.Notification = function (e) {
    this.on = false;
    this.message = "";
    this.color = 'yellow'
    this.timeOut = undefined;
    this.engine = e;


    this.notify = function (str, time, color) {
        this.color = color || 'yellow';
        this.on = true;
        this.message = ' ' + str + ' ';
        if (this.timeOut != undefined) clearTimeout(this.timeOut);
        this.timeOut = setTimeout(() => { this.hide(this.engine); }, time);
        this.engine.render();
    }

    this.show = function () {
        if (this.on) {
            this.engine.fillBackground(this.color);
            this.engine.fillForeground('black');
            this.engine.drawText(Math.floor(this.engine.width / 2) - Math.floor(this.message.length / 2), this.engine.height - 1, this.message);
        }
    }

    this.hide = function (e) {
        this.on = false;
        this.timeOut = undefined;
        e.render();
    }

}
