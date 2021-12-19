// All the code for the wacky command line interface is here
const fs = require("fs");
const path = require("path");
const arg = require("arg");
const interpret = require("./interpret");

function readDirectory(folderPath) {
    try {
        if (fs.statSync(folderPath).isDirectory()) {
            let list = fs.readdirSync(folderPath);
            if (list.length > 0) {
                let obj = {};
                for (let item of list.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
                    if (!fs.statSync(path.join(folderPath, item)).isDirectory())
                        continue;
                    else
                        obj[item] = readDirectory(path.join(folderPath, item));
                }

                return obj;
            }

            return [];
        }
        else {
            console.error(folderPath + " is not a directory!");
            process.exit(1);
        }
    } catch {
        console.error(folderPath + " is not a directory!");
        process.exit(1);
    }
}

function cli(argv) {
    if (!argv[0]) {
        console.log("   __       _     _                  _     ");
        console.log("  / _| ___ | | __| | ___ _ __ ___   (_)___ ");
        console.log(" | |_ / _ \\| |/ _` |/ _ \\ '__/ __|  | / __|");
        console.log(" |  _| (_) | | (_| |  __/ |  \\__ \\_ | \\__ \\");
        console.log(" |_|  \\___/|_|\\__,_|\\___|_|  |___(_)/ |___/");
        console.log("                                  |__/     ");
        console.log("");
        console.log("Format: folders (directory name) [--code]");
        console.log("");
        console.log("You can optionally pass the --code option, that converts the folder structure into JavaScript code.");
        return;
    }
    let args = arg({ "--code": Boolean }, { argv });
    let code = interpret(readDirectory(path.resolve(process.cwd(), args._[0])));
    if (args["--code"])
        console.log(code);
    else
        new Function(code)();
}

module.exports = cli;