#!/usr/bin/env node
const fs = require('fs');
const engine = require('./engine.js');
const Notification = require('./notification.js');
const syntax = require("./syntax.js");

const sideBarWidth = 5;
const navHeight = 2;
process.argv = process.argv.slice(2);
let filename = process.argv[0];
if (!fs.existsSync(filename)) {
    console.warn('Error! That file does not exist.');
    process.exit();
}


let modified = false;
let notSavedWarning = false;

let scrollY = 0, scrollX = 0;
let cursorPosX = 0, cursorPosY = 0;
let wantedCursorPosX = 0;

typeableChars = " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()-=_+[]{}|;':\",.<>/?`~\\"
typeableChars = typeableChars.split('');

let notification;

let file;
let lines = [];

let copyBuffer = "";

function setup() {
    loadFile();
    notification = new Notification.Notification(engine);
    engine.render();
}

function loadFile() {
    let lastDotIndex = filename.lastIndexOf(".");
    let fileExtension = lastDotIndex == -1 ? '' : filename.slice(lastDotIndex + 1);
    syntax.setLanguage(fileExtension);
    file = fs.readFileSync(filename);
    lines = file.toString().split("\n");
}

const draw = function () {
    // HEADER
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

    engine.noBg();

    // File Rendering
    for (let y = navHeight; y < engine.height; y++) {
        let index = y - navHeight + scrollY;
        let lineNum = index + 1;
        if (index < lines.length) {
            engine.fillForeground('lightblack');
            engine.drawText((sideBarWidth - 1) - lineNum.toString().length - scrollX, y, lineNum.toString());
            engine.fillForeground('white');
            let line = lines[index].toString();
            renderLine(line, y);
        }
    }

    notification.show(engine);

    engine.setCursor(cursorPosX + sideBarWidth - scrollX, cursorPosY - scrollY + navHeight);
    // engine.drawPoint(cursorPosX + sideBarWidth, cursorPosY - scrollY + navHeight, engine.BOX);
}


function keyPressed(key) {
    // Cursor Control:
    if (key.name == 'left') {
        moveCursorX(-1);
    }
    if (key.name == 'right') {
        moveCursorX(1);
    }
    if (key.name == 'up') {
        moveCursorY(-1);
    }
    if (key.name == 'down') {
        moveCursorY(1);
    }

    // Special Keys
    if (key.name == 'tab' && !key.ctrl) {
        let remainder = cursorPosX % 4;
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
        exit();
    }
    if (key.ctrl) {
        if (key.name == 's') {
            saveFile();
        }
        if (key.name == 'c') {
            copyBuffer = lines[cursorPosY];
            notification.notify("Line copied", 1000);
        }
        if (key.name == 'v') {
            lines.splice(cursorPosY, 0, copyBuffer);
            moveCursorY(1);
            modified = true;
            engine.render();
        }
        if (key.name == 'x') {
            copyBuffer = lines[cursorPosY];
            lines.splice(cursorPosY, 1);
            if (lines.length == 0) {
                lines.push("");
            }
            moveCursorY(-1);
            notification.notify("Line cut", 1000);
            modified = true;
            engine.render();
        }
        if (key.name == 'q') {
            if (cursorPosY > 0) {
                let temp = lines[cursorPosY - 1];
                lines[cursorPosY - 1] = lines[cursorPosY];
                lines[cursorPosY] = temp;
                moveCursorY(-1);
                modified = true;
                engine.render();
            }
        }
        if (key.name == 'a') {
            if (cursorPosY < lines.length - 1) {
                let temp = lines[cursorPosY + 1];
                lines[cursorPosY + 1] = lines[cursorPosY];
                lines[cursorPosY] = temp;
                moveCursorY(1);
                modified = true;
                engine.render();
            }
        }
        if (key.name == 'e') {
            exit();
        }

    }

    // Normal Keys
    if (typeableChars.indexOf(key.sequence) != -1) {
        typeChar(key.sequence);
    }
}


function typeChar(char) {
    lineStr = lines[cursorPosY];
    lines[cursorPosY] = lineStr.slice(0, cursorPosX) + char + lineStr.slice(cursorPosX);
    moveCursorX(1);
    engine.render();
    modified = true;
}

function returnKey() {
    let newStr = lines[cursorPosY].slice(cursorPosX);
    lines[cursorPosY] = lines[cursorPosY].slice(0, cursorPosX)
    lines.splice(cursorPosY + 1, 0, newStr);
    moveCursorX(1);
    modified = true;
    engine.render();
}

function deleteKey() {
    if (cursorPosX <= 0) {
        if (cursorPosY > 0) {
            let originalLineLength = lines[cursorPosY].length;
            lines[cursorPosY - 1] += lines[cursorPosY];
            moveCursorX(-1);
            moveCursorX(originalLineLength);
            lines.splice(cursorPosY + 1, 1);
            modified = true;
        }
    } else {
        lines[cursorPosY] = lines[cursorPosY].slice(0, cursorPosX - 1) + lines[cursorPosY].slice(cursorPosX);
        moveCursorX(-1);
        modified = true;
    }
    engine.render();
}

function moveCursorX(dir) {
    cursorPosX += dir;
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
    engine.setCursor(cursorPosX + sideBarWidth - scrollX, cursorPosY - scrollY + navHeight);
    updateScrollY();
    updateScrollX();
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
    engine.setCursor(cursorPosX + sideBarWidth - scrollX, cursorPosY - scrollY + navHeight);
    updateScrollY();
    updateScrollX();
}

function updateScrollY() {
    if (cursorPosY - scrollY > engine.height - 3 - navHeight) {
        scrollY++;
        engine.render();
    }
    if (cursorPosY - scrollY < 2 && scrollY > 0) {
        scrollY--;
        engine.render();
    }

}

function updateScrollX() {
    if (lines[cursorPosY].length > engine.width - 2 - sideBarWidth) {
        if (cursorPosX - scrollX > engine.width - 3 - sideBarWidth) {
            scrollX = (cursorPosX - scrollX) - (engine.width - 3 - sideBarWidth);
            engine.render();
        }
        if (cursorPosX - scrollX < 2 && scrollX > 0) {
            scrollX--;
            engine.render();
        }
    } else if (scrollX > 0) {
        scrollX = 0;
        engine.render();
    }
}

function renderLine(line, y) {
    let renderStr = syntax.computeSyntax(line);
    let currentColour = 'white';
    engine.fillForeground(currentColour);
    let offset = 0;
    let stack = 0;
    for (let x = 0; x < renderStr.length; x++) {
        let col = syntax.getColourFromSyntaxEscapeStr(renderStr[x]);
        if (col != '') {
            if (col == 'white') {
                stack--;
            } else {
                stack++;
            }
            if (stack == 1 && col != 'white') {
                engine.fillForeground(col);
            } else if (stack == 0) {
                engine.fillForeground('white');
            }
            offset++;
        } else {
            engine.drawPoint(x + sideBarWidth - scrollX - offset, y, renderStr[x]);
        }
    }
}

function saveFile() {
    let string = lines.join('\n');
    fs.writeFile(filename, string, (err) => {
        if (err) throw err;
        modified = false;
        engine.render();
    });
}

function exit() {
    if (!modified || notSavedWarning) {
        engine.exit();
    } else {
        // User has not saved. Create popup.
        notSavedWarning = true;
        notification.notify("File is not saved. Changes will be lost. Press ESC to continue", 2200, 'red');
        setTimeout(() => { notSavedWarning = false; }, 2200);
    }
}


engine.init(setup, draw, keyPressed, 1000, true);

