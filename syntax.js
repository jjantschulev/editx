let languages = "js"
languages = languages.split(' ');

let funcs = {
    language: "",
}

const languageExpressions = {
    js: {
        strReg1: /"(.*?)"/g,
        strReg2: /'(.*?)'/g,
        specialReg: /\b(var|let|for|while|continue|break|switch|function|return|do|case|throw|new|default|else|finally|goto|try|catch)(?=[^\w])/g,
        specialReg2: /\b(const|null|undefined|true|false)(?=[^\w])/g,
        specialJsGlobReg: /\b(document|window|Array|String|Object|Math|Number|JSON|\$)(?=[^\w])/g,
        specialJsReg: /\b(getElementsBy(TagName|ClassName|Name)|getElementById|typeof|instanceof)(?=[^\w])/g,
        specialMethReg: /\.(lastIndexOf|parse|substring|slice|splice|exit|add|sub|indexOf|match|replace|toString|floor|ciel|round|push)(?=\()/g,
        specialMathReg: /(\+|\-|\*|\/|\:|\!|\<|\>|\=|\%)/g,
        specialCommentReg: /(\/\*.*\*\/)/g,
        inlineCommentReg: /(\/\/.*)/g
    }
}

funcs.setLanguage = function (lang) {
    if (languages.indexOf(lang) != -1) {
        funcs.language = lang;
    }
}

funcs.computeSyntax = function (line) {
    if (funcs.language == "") return line;
    let langExpression = languageExpressions[funcs.language];

    let parsed = line.replace(langExpression.strReg1, '\1"$1"\0');
    parsed = parsed.replace(langExpression.strReg2, "\1'$1'\0");
    parsed = parsed.replace(langExpression.specialReg, '\2$1\0');
    parsed = parsed.replace(langExpression.specialReg2, '\6$1\0');
    parsed = parsed.replace(langExpression.specialJsGlobReg, '\6$1\0');
    parsed = parsed.replace(langExpression.specialJsReg, '\4$1\0');
    parsed = parsed.replace(langExpression.specialMethReg, '.\4$1\0');
    parsed = parsed.replace(langExpression.specialCommentReg, '\5$1\0');
    parsed = parsed.replace(langExpression.inlineCommentReg, '\5$1\0');
    parsed = parsed.replace(langExpression.specialMathReg, '\4$1\0');
    return parsed;
}

funcs.getColourFromSyntaxEscapeStr = function (value) {
    switch (value) {
        case '\0':
            return 'white';
        case '\1':
            return 'green';
        case '\2':
            return 'magenta';
        case '\3':
            return 'red';
        case '\4':
            return 'cyan';
        case '\5':
            return 'lightblack';
        case '\6':
            return 'yellow';
    }
    return '';
}


module.exports = funcs;