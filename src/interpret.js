// All the code I use to interpret the folder structure is here
const jsesc = require("jsesc");

const hex = {
    "0000": "0",
    "0001": "1",
    "0010": "2",
    "0011": "3",
    "0100": "4",
    "0101": "5",
    "0110": "6",
    "0111": "7",
    "1000": "8",
    "1001": "9",
    "1010": "a",
    "1011": "b",
    "1100": "c",
    "1101": "d",
    "1110": "e",
    "1111": "f"
}
const types = [
    "int",
    "float",
    "string",
    "char"
];

let code = "";

function interpret(data) {
    for (let command of Object.values(data))
        code += interpretCmd(command);
    return code.replace(/;/g, ";\n").replace(/{/g, "{\n").split("\n").filter(x => x != "").join("\n");
}

function interpretCmd(command) {
    let cmd = Object.values(command);
    let returnValue = "";
    switch (Object.values(cmd[0]).length) {
        case 0:
            returnValue = "if (" + interpretExpr(cmd[1]) + ") {";
            for (let subcommand of Object.values(cmd[2])) {
                for (let subcmdLine of interpretCmd(subcommand).split("\n"))
                    returnValue += "    " + subcmdLine;
            }
            returnValue += "}";
            break;
        case 1:
            returnValue = "while (" + interpretExpr(cmd[1]) + ") {";
            for (let subcommand of Object.values(cmd[2])) {
                for (let subcmdLine of interpretCmd(subcommand).split("\n"))
                    returnValue += "    " + subcmdLine;
            }
            returnValue += "}";
            break;
        case 2:
            return "let var_" + folderLength(cmd[2]) + ";";
        case 3:
            let cmd1Length = folderLength(cmd[1]);
            return (code.includes("let var_" + cmd1Length) ? "" : "let ") + "var_" + cmd1Length + " = " + interpretExpr(cmd[2]) + ";";
        case 4:
            return "process.stdout.write((" + interpretExpr(cmd[1]) + ").toString());";
        case 5:
        default:
            return (
`let rl = require(\"readline\").createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.question("", answer => {
    var_${folderLength(cmd[1])} = isNaN(answer) ? answer : parseInt(answer);
    rl.close();
});`
            );
    }

    return returnValue;
}

function interpretExpr(expression) {
    let expr = Object.values(expression);
    switch (Object.values(expr[0]).length) {
        case 0:
            return "var_" + folderLength(expr[1]);
        case 1:
            return "(" + interpretExpr(expr[1]) + " + " + interpretExpr(expr[1]) + ")";
        case 2:
            return "(" + interpretExpr(expr[1]) + " - " + interpretExpr(expr[1]) + ")";
        case 3:
            return "(" + interpretExpr(expr[1]) + " * " + interpretExpr(expr[1]) + ")";
        case 4:
            return "(" + interpretExpr(expr[1]) + " / " + interpretExpr(expr[1]) + ")";
        case 5:
            return interpretValue(expr[2], types[folderLength(expr[1])]);
        case 6:
            return "(" + interpretExpr(expr[1]) + " == " + interpretExpr(expr[1]) + ")";
        case 7:
            return "(" + interpretExpr(expr[1]) + " > " + interpretExpr(expr[1]) + ")";
        case 8:
        default:
            return "(" + interpretExpr(expr[1]) + " < " + interpretExpr(expr[1]) + ")";
    }
}

function interpretValue(fullValue, type) {
    let thing = "";
    switch (type.toLowerCase()) {
        case "string":
            thing = "\"";
            break;
        case "char":
            thing = "'";
            break;
    }

    let value = Object.values(fullValue);
    let returnValue = "";
    switch (type.toLowerCase()) {
        case "string":
            for (let char of value) {
                let parsedChar = interpretValue(char, "CHAR");
                returnValue += parsedChar.slice(1, parsedChar.length - 1);
            }
            returnValue = returnValue.replace(/\\'/g, "'").replace(/"/g, "\\\"");
            break;
        case "char":
            if (value.length != 2)
                value = value.length < 2 ? [...Array(2 - value.length).fill({ 1: {}, 2: {}, 3: {}, 4: {} }), ...value] : value.splice(0, 2);
            for (let hexDigit of value) {
                let digit = Object.values(hexDigit);
                if (digit.length != 4)
                    digit = digit.length < 4 ? [...Array(4 - digit.length).fill({}), ...digit] : digit.splice(0, 4);

                let digitValue = "";
                for (let bit of digit)
                    digitValue += folderLength(bit) > 0 ? "1" : "0";
                returnValue += hex[digitValue];
            }
            returnValue = jsesc(String.fromCharCode(parseInt(returnValue, 16)));
            break;
        case "int":
        case "float":
            for (let hexDigit of value) {
                let digit = Object.values(hexDigit);
                if (digit.length != 4)
                    digit = digit.length < 4 ? [...Array(4 - digit.length).fill({}), ...digit] : digit.splice(0, 4);

                let digitValue = "";
                for (let bit of digit)
                    digitValue += folderLength(bit) > 0 ? "1" : "0";
                returnValue += hex[digitValue];
            }
            returnValue = parseInt(returnValue, 16);
            break;
    }

    return thing + returnValue + thing;
}

function folderLength(folder) {
    return Object.values(folder).length;
}

module.exports = interpret;