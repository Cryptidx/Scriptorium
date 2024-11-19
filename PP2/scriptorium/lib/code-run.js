const fs = require('fs');
const { spawn } = require('child_process');

function fileEnd(lang) {
    // returns the file extension for each programming language
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
    // file running for programming languages that do not require a file to be compiled (JavaScript & Python)
    try {
        // output strings
        var stdout = "";
        var stderr = "";

        // creates process based on passed command and arguments
        const process = spawn(command, args);

        // writes each input to the standard of the spawned process
        if (stdin.length > 0) {   
            stdin.forEach(input => {
                process.stdin.write(input + '\n');  // writes each input followed by a newline
            });
            process.stdin.end();
        }

        // gets the spawned process' standard out and standard error
        process.stdout.on("data", data => stdout += data.toString());
        process.stderr.on("data", data => stderr += data.toString());

        // waits for code to exit
        const code = await new Promise((resolve) => {
            process.on('close', (code) => {
                resolve(code);
            });
        });
        
        // returns code and outputs
        return [code, stdout, stderr];

    } catch (error) {

        // error during compilation
        return [-1, "", error.message];
    }
}

async function compileRun(commandOne, argsOne, commandTwo, argsTwo, stdin) {
    // file running for programming languages that do require a file to be compiled and run (Java, C, & C++)
    try {
        // output strings
        var stdout = "";
        var compileStderr = "";
        var processStderr = "";

        // creates process to compile the fule into an executable
        const compile = spawn(commandOne, argsOne);

        // gets standard error from compiler
        compile.stderr.on("data", data => compileStderr += data.toString())

        // waits for compilation code to exit
        const compileCode = await new Promise((resolve) => {
            compile.on('close', (code) => {
                resolve(code);
            })
        })

        // makes sure compilation code succeeds, otherwise returns error
        if (compileCode !== 0) {
            return [compileCode, "", compileStderr];
        }

        // creates process to run the executable file just created
        const process = spawn(commandTwo, argsTwo);

        // writes each input to the standard in of the spawned process
        if (stdin.length > 0) {   
            stdin.forEach(input => {
                process.stdin.write(input + '\n');  // writes each input followed by a newline
            });
            process.stdin.end();
        }

        // gets data from standard out and standard error of spawned process
        process.stdout.on("data", data => stdout += data.toString());
        process.stderr.on("data", data => processStderr += data.toString());

        // waits for process to exit
        const processCode = await new Promise((resolve) => {
            process.on('close', (code) => {
                resolve(code);
            });
        });

        // returns exit code and outputs of process
        return [processCode, stdout, processStderr];

    } catch (error) {

        // error during compilation
        return [-1, "", error.message];
    }
}

async function runFile(lang, code, stdin = []) {
    // creates a temp file based on the file extension of the given language
    const tempFile = "file" + fileEnd(lang);

    // writes file synchronously
    fs.writeFileSync(tempFile, code);

    // sets the variables and function calls for each langauge
    switch (lang) {
        case "javascript":
            var command = "node";
            var args = [tempFile];

            var output = await basicRun(command, args, stdin);

            // deletes file (checks to make sure it exists first - error checking)
            if (fs.existsSync(tempFile)){
                fs.unlinkSync(tempFile);
            }
            return output;

        case "python":
            var command = "python";
            var args = [tempFile];
            
            output = await basicRun(command, args, stdin);

            if (fs.existsSync(tempFile)){
                fs.unlinkSync(tempFile);
            }
            return output;

        case "java":
            var commandOne = "javac";
            var argsOne = [tempFile];
            
            var commandTwo = "java";
            var argsTwo = ["file"];

            output = await compileRun(commandOne, argsOne, commandTwo, argsTwo, stdin);
            
            if (fs.existsSync(tempFile)){
                fs.unlinkSync(tempFile);
            }

            if (fs.existsSync("file.class")) {
                fs.unlinkSync("file.class");
            }
            return output;
        
        case "c":
            var commandOne = "gcc";
            var argsOne = [tempFile, "-o", "file"];
            
            // depending on user's OS, the executable is either saved as file.exe or just file, meaning different commands to run executbales
            // windows is the former, linux and macos are the latter
            var commandTwo = process.platform === 'win32' ? 'file.exe' : './file';;
            var argsTwo = [];

            output = await compileRun(commandOne, argsOne, commandTwo, argsTwo, stdin);

            // depending on user's OS, the executable is either saved as file.exe or just file, meaning different files need to be deleted
            // windows is the former, linux and macos are the latter
            var removeFile = process.platform === 'win32' ? 'file.exe' : 'file';;

            if (fs.existsSync(tempFile)){
                fs.unlinkSync(tempFile);
            }

            if (fs.existsSync(removeFile)) {
                fs.unlinkSync(removeFile);
            }
            return output;

        case "c++":
            var commandOne = "g++";
            var argsOne = [tempFile, "-o", "file"];

            var commandTwo = process.platform === 'win32' ? 'file.exe' : './file';;
            var argsTwo = [];

            output = await compileRun(commandOne, argsOne, commandTwo, argsTwo, stdin);

            var removeFile = process.platform === 'win32' ? 'file.exe' : 'file';;

            if (fs.existsSync(tempFile)){
                fs.unlinkSync(tempFile);
            }

            if (fs.existsSync(removeFile)) {
                fs.unlinkSync(removeFile);
            }
            return output;
            
        default:
            // language that is not one of the above was passed
            return [-2, "unsupported language", ""];
    }
}

module.exports = { runFile, fileEnd };