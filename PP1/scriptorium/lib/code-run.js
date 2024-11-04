const fs = require('fs');
const { spawn } = require('child_process');

function fileEnd(lang) {
    switch(lang) {
        case "javascript":
            return ".js";
        case "python":
            return ".py";
        case "java":
            return ".java";
        case "c":
            return ".c";
        case "c++":
            return ".cpp";
        default:
            return "";
        
    }
}

async function basicRun(command, args, stdin) {
    try {
        var stdout = "";
        var stderr = "";

        const process = spawn(command, args);

        if (stdin.length > 0) {   
            stdin.forEach(input => {
                process.stdin.write(input + '\n');  // Write each input followed by a newline
            });
            process.stdin.end();
        }

        process.stdout.on("data", data => stdout += data.toString());
        process.stderr.on("data", data => stderr += data.toString());

        const code = await new Promise((resolve) => {
            process.on('close', (code) => {
                resolve(code);
            });
        });

        return [code, stdout, stderr];

    } catch (error) {

        return [-1, "", error.message];
    }
}

async function compileRun(commandOne, argsOne, commandTwo, argsTwo, stdin) {
    try {
        var stdout = "";
        var compileStderr = "";
        var processStderr = "";

        const compile = spawn(commandOne, argsOne);

        compile.stderr.on("data", data => compileStderr += data.toString())

        const compileCode = await new Promise((resolve) => {
            compile.on('close', (code) => {
                resolve(code);
            })
        })

        if (compileCode !== 0) {
            return [compileCode, "", compileStderr];
        }

        const process = spawn(commandTwo, argsTwo);

        if (stdin.length > 0) {   
            stdin.forEach(input => {
                process.stdin.write(input + '\n');  // Write each input followed by a newline
            });
            process.stdin.end();
        }

        process.stdout.on("data", data => stdout += data.toString());
        process.stderr.on("data", data => processStderr += data.toString());

        const processCode = await new Promise((resolve) => {
            process.on('close', (code) => {
                resolve(code);
            });
        });

        return [processCode, stdout, processStderr];

    } catch (error) {

        return [-1, "", error.message];
    }
}

async function runFile(lang, code, stdin = []) {
    const tempFile = "file" + fileEnd(lang);
    fs.writeFileSync(tempFile, code); // writes file synchronously

    switch (lang) {
        case "javascript":
            var command = "node";
            var args = [tempFile];

            var output = await basicRun(command, args, stdin);

            fs.unlinkSync(tempFile);
            return output;

        case "python":
            var command = "python";
            var args = [tempFile];
            
            output = await basicRun(command, args, stdin);
            fs.unlinkSync(tempFile);
            return output;

        case "java":
            var commandOne = "javac";
            var argsOne = [tempFile];
            
            var commandTwo = "java";
            var argsTwo = ["file"];

            output = await compileRun(commandOne, argsOne, commandTwo, argsTwo, stdin);

            fs.unlinkSync(tempFile);
            fs.unlinkSync("file.class");
            return output;
        
        case "c":
            var commandOne = "gcc";
            var argsOne = [tempFile, "-o", "file"];
            
            var commandTwo = process.platform === 'win32' ? 'file.exe' : './file';;
            var argsTwo = [];

            output = await compileRun(commandOne, argsOne, commandTwo, argsTwo, stdin);

            var removeFile = process.platform === 'win32' ? 'file.exe' : 'file';;

            fs.unlinkSync(tempFile);
            fs.unlinkSync(removeFile);
            return output;

        case "c++":
            var commandOne = "g++";
            var argsOne = [tempFile, "-o", "file"];

            var commandTwo = process.platform === 'win32' ? 'file.exe' : './file';;
            var argsTwo = [];

            output = await compileRun(commandOne, argsOne, commandTwo, argsTwo, stdin);

            var removeFile = process.platform === 'win32' ? 'file.exe' : 'file';;

            fs.unlinkSync(tempFile);
            fs.unlinkSync(removeFile);
            return output;
            
        default:
            return [-2, "unsupported language", ""];
    }

    try {
        var stdout = "";
        var stderr = "";

        const process = spawn(command, args);

        for (const input in stdin) {
            process.stdin.write(input);
        }
        process.stdin.end();

        process.stdout.on("data", data => stdout += data.toString());
        process.stderr.on("data", data => stderr += data.toString());

        const code = await new Promise((resolve) => {
            process.on('close', (code) => {
                resolve(code);
            });
        });

        return [code, stdout, stderr];

    } catch (error) {

        return [-1, "", error.message];
    }

}

module.exports = { runFile, fileEnd };