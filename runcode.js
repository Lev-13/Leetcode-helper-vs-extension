const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const { spawn } = require('child_process');

async function runcppfile(solutionfile, problemfolder, exefile) {
    const result = vscode.window.createOutputChannel('Test Results');

    // Compile the solution file
    const compile = spawn('g++', [solutionfile, '-o', exefile]);

    compile.on('error', (error) => {
        console.error(`Error spawning g++: ${error.message}`);
    });

    compile.stderr.on('data', (data) => {
        console.error(`g++ error: ${data}`);
    });

    await new Promise((resolve) => {
        compile.on('close', (code) => {
            if (code === 0) {
                console.log('Compilation successful.');
            } else {
                console.error(`g++ process exited with code ${code}`);
            }
            resolve();
        });
    });

    // Collect input and output files
    const inputFiles = fs.readdirSync(problemfolder).filter((file) => file.startsWith('input'));
    const outputFiles = fs.readdirSync(problemfolder).filter((file) => file.startsWith('output'));

    if (inputFiles.length !== outputFiles.length) {
        result.appendLine('Error: Mismatch in input and output files count.');
        result.show();
        return;
    }

    let passed = [];
    for (let i = 0; i < inputFiles.length; i++) {
        const inpFile = path.join(problemfolder, inputFiles[i]);
        const outFile = path.join(problemfolder, outputFiles[i]);

        const inpData = fs.readFileSync(inpFile, 'utf-8');
        const expectedOutput = fs.readFileSync(outFile, 'utf-8').trim();

        const run = spawn(exefile);
        run.stdin.write(inpData);
        run.stdin.end();

        let actualOutput = '';

        run.stdout.on('data', (data) => {
            actualOutput += data.toString();
        });

        await new Promise((resolve) => {
            run.on('close', (code) => {
                if (code === 0) {
                    actualOutput = actualOutput.trim();
                    passed.push(actualOutput === expectedOutput);
                } else {
                    passed.push(false);
                }
                resolve();
            });
        });
    }

    result.clear();
    passed.forEach((pass, index) => {
        if (pass) {
            result.appendLine(`Test case ${index + 1} passed!`);
        } else {
            result.appendLine(`Test case ${index + 1} failed.`);
            const expectedOutput = fs.readFileSync(
                path.join(problemfolder, outputFiles[index]),
                'utf-8'
            ).trim();
            result.appendLine(`Expected: ${expectedOutput}`);
        }
    });
    result.show();
}

async function runPythonFile(solutionfile, problemfolder) {
    const result = vscode.window.createOutputChannel('Test Results');

    // Collect input and output files
    const inputFiles = fs.readdirSync(problemfolder).filter((file) => file.startsWith('input'));
    const outputFiles = fs.readdirSync(problemfolder).filter((file) => file.startsWith('output'));

    if (inputFiles.length !== outputFiles.length) {
        result.appendLine('Error: Mismatch in input and output files count.');
        result.show();
        return;
    }

    let passed = [];
    for (let i = 0; i < inputFiles.length; i++) {
        const inpFile = path.join(problemfolder, inputFiles[i]);
        const outFile = path.join(problemfolder, outputFiles[i]);

        const inpData = fs.readFileSync(inpFile, 'utf-8');
        const expectedOutput = fs.readFileSync(outFile, 'utf-8').trim();

        const run = spawn('python', [solutionfile]);
        run.stdin.write(inpData);
        run.stdin.end();

        let actualOutput = '';

        run.stdout.on('data', (data) => {
            actualOutput += data.toString();
        });

        await new Promise((resolve) => {
            run.on('close', (code) => {
                if (code === 0) {
                    actualOutput = actualOutput.trim();
                    passed.push(actualOutput === expectedOutput);
                } else {
                    passed.push(false);
                }
                resolve();
            });
        });
    }

    result.clear();
    passed.forEach((pass, index) => {
        if (pass) {
            result.appendLine(`Test case ${index + 1} passed!`);
        } else {
            result.appendLine(`Test case ${index + 1} failed.`);
            const expectedOutput = fs.readFileSync(
                path.join(problemfolder, outputFiles[index]),
                'utf-8'
            ).trim();
            result.appendLine(`Expected: ${expectedOutput}`);
        }
    });
    result.show();
}


module.exports = {runcppfile , runPythonFile };
