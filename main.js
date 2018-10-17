#!/usr/bin/env node
const fs = require('fs');
const engine = require('./engine.js');
const Notification = require('./notification.js');

const sideBarWidth = 5;
const navHeight = 2;
process.argv = process.argv.slice(2);
var filename = process.argv[0];
if (!fs.existsSync(filename)) {
    console.warn('Error! That file does not exist.');
    process.exit();
}
// Get file extension
var syntax = '';
var codeExtensions = "js java cs ts json"
codeExtensions = codeExtensions.split(' ');
var fileExtension = filename.indexOf('.') != -1 ? filename.slice(filename.indexOf('.') + 1) : "";
if (codeExtensions.indexOf(fileExtension) != -1) syntax = fileExtension;

var notSavedWarning = false;
var modified = false;
var scrollY = 0,
    scrollX = 0;

var cursorPosX = 0;
var cursorPosY = 0;
var wantedCursorPosX = 0;


typeableChars = " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()-=_+[]{}|;':\",.<>/?`~"
typeableChars = typeableChars.split('');

var notification;

var file = fs.readFileSync(filename);
var lines = file.toString().split("\n");

var copyBuffer = "";

function setup() {
    notification = new Notification.Notification(engine);
    engine.render();
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
        var index = y - navHeight + scrollY;
        var lineNum = index + 1;
        if (index < lines.length) {
            engine.fillForeground('yellow');
            engine.drawText((sideBarWidth - 1) - lineNum.toString().length, y, lineNum.toString());
            engine.fillForeground('white');
            var line = lines[index].toString();
            renderLine(line, y);
        }
    }

    notification.show(engine);

    engine.setCursor(cursorPosX + sideBarWidth, cursorPosY - scrollY + navHeight);
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
        exit();
    }
    if (key.ctrl) {
        if (key.ctrl && key.name == 's') {
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
        }
        if (key.name == 'q') {
            if (cursorPosY > 0) {
                var temp = lines[cursorPosY - 1];
                lines[cursorPosY - 1] = lines[cursorPosY];
                lines[cursorPosY] = temp;
                moveCursorY(-1);
                modified = true;
            }
        }
        if (key.name == 'a') {
            if (cursorPosY < lines.length - 1) {
                var temp = lines[cursorPosY + 1];
                lines[cursorPosY + 1] = lines[cursorPosY];
                lines[cursorPosY] = temp;
                moveCursorY(1);
                modified = true;
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
    engine.render();
}


function typeChar(char) {
    lineStr = lines[cursorPosY];
    lines[cursorPosY] = lineStr.slice(0, cursorPosX) + char + lineStr.slice(cursorPosX);
    moveCursorX(1);
    modified = true;
}

function returnKey() {
    var newStr = lines[cursorPosY].slice(cursorPosX);
    lines[cursorPosY] = lines[cursorPosY].slice(0, cursorPosX)
    lines.splice(cursorPosY + 1, 0, newStr);
    moveCursorX(1);
    modified = true;
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

function renderLine(line, y) {
    if (syntax != '') {
        let isString = false;
        let isNumber = false;
        let isKeyword = false;
        let isComment = false;
        let numbers = "1234567890."
        let keywords = "var if else function let for throw => while"
        keywords = keywords.split(' ');
        let wordBreakChars = '() =!+;,';
        wordBreakChars = wordBreakChars.split('');
        let cyanChars = '=+-/*<>%!'
        cyanChars = cyanChars.split('');

        for (let x = 0; x < line.length; x++) {

            let justSetString = false;
            if (line[x] == '"' || line[x] == "'") {
                if (!isString) {
                    isString = true;
                    justSetString = true;
                }
            }
            if (!isString) {
                if (line[x] == '/' && line[x + 1] == '/' || line[x] == '#') {
                    isComment = true;
                }
                if (!isComment) {

                    if (wordBreakChars.indexOf(line[x]) != -1) {
                        isKeyword = false;
                        isNumber = false;
                    }
                    if (x == 0 || wordBreakChars.indexOf(line[(x - 1) < 0 ? 0 : x - 1]) != -1) {
                        var str = ''
                        let i = x;
                        while (i < line.length && wordBreakChars.indexOf(line[x]) == -1) {
                            str += line[i];
                            if (keywords.indexOf(str) != -1) {
                                isKeyword = true;
                                break;
                            } else if (!isNaN(str) || str == 'true' || str == 'false' || str == 'undefined' || str == "null") {
                                isNumber = true;
                            }
                            i++;
                        }
                    }
                }
            }
            if (isString) {
                engine.fillForeground('green');
            } else if (isComment) {
                engine.fillForeground('blue');
            } else if (isKeyword) {
                engine.fillForeground('magenta');
            } else if (isNumber) {
                engine.fillForeground('yellow');
            } else if (cyanChars.indexOf(line[x]) != -1) {
                engine.fillForeground('cyan');
            } else {
                engine.fillForeground('white');
            }
            engine.drawPoint(x + sideBarWidth, y, line[x]);

            if ((line[x] == '"' || line[x] == "'") && !justSetString) {
                if (isString) isString = false;
            }


        }
    } else {
        engine.fillForeground("white");
        engine.drawText(sideBarWidth, y, line);
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

