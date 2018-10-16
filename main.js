#!/usr/bin/env node
const fs = require('fs');
const engine = require('./engine.js');

const sideBarWidth = 5;
const navHeight = 2;

var filename = process.argv[2];
if (!fs.existsSync(filename)) {
    console.warn('Error! That file does not exist.');
    process.exit();
}

var modified = false;
var notSavedWarning = false;
var notSavedWarningText = "File is not saved. Changes will be lost. Press ESC to continue";
var scrollY = 0,
    scrollX = 0;

var cursorPosX = 0;
var cursorPosY = 0;
var wantedCursorPosX = 0;


typeableChars = " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()-=_+[]{}|;':\",.<>/?`~"
typeableChars = typeableChars.split('');


var file = fs.readFileSync(filename);
var lines = file.toString().split("\n");

function setup() {
    engine.render();
}

const draw = function () {
    // HEADER
    if (notSavedWarning) {
        engine.fillBackground('red');
        engine.fillForeground('red');
        engine.drawLine(0, 0, 1, 0, engine.width, engine.BOX);
        engine.fillForeground('black');
        engine.drawText(Math.floor(engine.width / 2) - Math.floor(notSavedWarningText.length / 2), 0, notSavedWarningText);
    } else {
        engine.fillBackground('yellow')
        engine.fillForeground('yellow');
        engine.drawLine(0, 0, 1, 0, engine.width, engine.BOX);
        engine.fillForeground('black');
        engine.drawText(2, 0, "ESC to close");
        engine.drawText(Math.floor(engine.width / 2) - Math.floor(filename.length / 2), 0, filename);
        if (modified) {
            engine.drawText(engine.width - 10, 0, "modified");
        } else {
            engine.drawText(engine.width - 7, 0, "saved");
        }
    }
    engine.noBg();

    // File Rendering
    for (let y = navHeight; y < engine.height; y++) {
        var index = y - navHeight + scrollY;
        var lineNum = index + 1;
        if (index < lines.length) {
            engine.fillForeground('yellow');
            engine.drawText((sideBarWidth - 1) - lineNum.toString().length, y, lineNum.toString());
            engine.fillForeground('white');
            engine.drawText(sideBarWidth, y, lines[index].toString());
        }
    }
    engine.setCursor(cursorPosX + sideBarWidth, cursorPosY - scrollY + navHeight);
    // engine.drawPoint(cursorPosX + sideBarWidth, cursorPosY - scrollY + navHeight, engine.BOX);
}


function keyPressed(key) {
    // Cursor Control:
    if (key.name == 'left') {
        moveCursorX(1);
    }
    if (key.name == 'right') {
        moveCursorX(-1);
    }
    if (key.name == 'up') {
        moveCursorY(-1);
    }
    if (key.name == 'down') {
        moveCursorY(1);
    }

    // Special Keys
    if (key.ctrl && key.name == 's') {
        saveFile();
    }
    if (key.name == 'tab' && !key.ctrl) {
        var remainder = cursorPosX % 4;
        remainder = 4 - remainder == 0 ? 4 : 4 - remainder;
        for (let i = 0; i < remainder; i++) {
            typeChar(' ');
        }
    }
    if (key.name == 'backspace') {
        if (key.ctrl) {
            // delete whole word
        } else {
            deleteKey();
        }
    }
    if (key.name == 'return' && !key.ctrl) {
        returnKey();
    }
    if (key.name == 'escape') {
        if (!modified || notSavedWarning) {
            engine.exit();
        } else {
            // User has not saved. Create popup.
            notSavedWarning = true;
            setTimeout(() => { notSavedWarning = false; engine.render() }, 3000);
        }
    }

    // Normal Keys
    if (typeableChars.indexOf(key.sequence) != -1) {
        typeChar(key.sequence);
    }
    engine.render();
}


function typeChar(char) {
    lineStr = lines[cursorPosY];
    lines[cursorPosY] = lineStr.slice(0, cursorPosX) + char + lineStr.slice(cursorPosX);
    moveCursorX(-1);
    modified = true;
}

function returnKey() {
    var newStr = lines[cursorPosY].slice(cursorPosX);
    lines[cursorPosY] = lines[cursorPosY].slice(0, cursorPosX)
    lines.splice(cursorPosY + 1, 0, newStr);
    moveCursorX(-1);
    modified = true;
}

function deleteKey() {
    if (cursorPosX <= 0) {
        if (cursorPosY > 0) {
            let originalLineLength = lines[cursorPosY].length;
            lines[cursorPosY - 1] += lines[cursorPosY];
            moveCursorX(1);
            moveCursorX(originalLineLength);
            lines.splice(cursorPosY + 1, 1);
            modified = true;
        }
    } else {
        lines[cursorPosY] = lines[cursorPosY].slice(0, cursorPosX - 1) + lines[cursorPosY].slice(cursorPosX);
        moveCursorX(1);
        modified = true;
    }
}

function moveCursorX(dir) {
    cursorPosX -= dir;
    if (cursorPosX < 0) {
        if (cursorPosY > 0) {
            cursorPosY--;
            cursorPosX = lines[cursorPosY].length;
        } else {
            cursorPosX = 0;
            cursorPosY = 0;
        }
    }
    if (cursorPosX > lines[cursorPosY].length) {
        if (cursorPosY < lines.length - 1) {
            cursorPosY++;
            cursorPosX = 0;
        } else {
            cursorPosX = lines[cursorPosY].length;
            cursorPosY = lines.length - 1;
        }
    }
    wantedCursorPosX = cursorPosX;
    updateScrollY();
}

function moveCursorY(dir) {
    cursorPosX = wantedCursorPosX;
    cursorPosY += dir;
    if (cursorPosY < 0) {
        cursorPosY = 0;
        cursorPosX = 0;
    }
    if (cursorPosY >= lines.length) {
        cursorPosY = lines.length - 1;
        cursorPosX = lines[cursorPosY].length;
    }
    if (cursorPosX > lines[cursorPosY].length) {
        cursorPosX = lines[cursorPosY].length;
    }
    updateScrollY();
}

function updateScrollY() {
    if (cursorPosY - scrollY > engine.height - 3 - navHeight) {
        scrollY++;
    }
    if (cursorPosY - scrollY < 2 && scrollY > 0) {
        scrollY--;
    }

}

function saveFile() {
    var string = lines.join('\n');
    fs.writeFile(filename, string, (err) => {
        if (err) throw err;
        modified = false;
        engine.render();
    });
}

engine.init(setup, draw, keyPressed, 1000, true);

