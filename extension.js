// The module 'vscode' contains the VS Code extensibility API

const extraction = require('./fetchtestcase');

const fs = require('fs');
const path = require('path');

const  {runcppfile,runPythonFile}  = require('./runcode.js');

// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */


function findlang( fp ){
	const ext = path.extname(fp).toLowerCase();
	if( ext === '.cpp' ){
		return 'cpp' ;
	}
	else if ( ext === '.py' ){
		return 'python' ;
	}
	else{
		return 'unknown' ;
	}
}

function getProblemName(url) {

	url = url.slice(8);
	const urlParts = url.split('/');
	let idx = -1;
	for (let i = 0; i < urlParts.length; i++) {
	  if (urlParts[i] === 'problems') {
		idx = i + 1;
		break;
	  }
	}
  	if (idx === -1) {
	  throw new Error("The URL does not contain 'problems'") ;
	}
  	return urlParts[idx];
  }
  
  async function fetchcases(url) {
    try {
        vscode.window.showInformationMessage("Fetching test cases...");

        const [inp, out] = await extraction(url) ;
        let problemName = getProblemName(url);
        problemName = problemName.toLowerCase().replace(/\s+/g, '');

		
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder open!');
            return;
        }

        // Use the first workspace folder
        let folderpath = workspaceFolders[0].uri.fsPath;

        // Create TestCases folder if it doesn't exist
        let testcasefolder = path.join(folderpath, 'TestCases');
        if (!fs.existsSync(testcasefolder)) {
            fs.mkdirSync(testcasefolder);
        }

        // Create problem folder
        let problemfolder = path.join(testcasefolder, problemName);
        if (!fs.existsSync(problemfolder)) {
            fs.mkdirSync(problemfolder);
        }

        // Write input and output files
        for (let i = 0; i < inp.length ; i++ ) {
            let inputpath = path.join(problemfolder, `input${i}.txt`);
            fs.writeFileSync(inputpath, inp[i]);
        }

        for (let i = 0; i < out.length ; i++ ) {
            let outputpath = path.join(problemfolder, `output${i}.txt`);
            fs.writeFileSync(outputpath, out[i]);
        }

        vscode.window.showInformationMessage("Test cases fetched and stored successfully!");
    } catch (error) {
        vscode.window.showErrorMessage(`Error fetching test cases: ${error.message}`);
    }
}


async function activate(context) {

	console.log('Congratulations, your extension "lh" is now active!') ;

	const fetching = vscode.commands.registerCommand('lh.fetchcases', async function () {
		// The code here will be executed every time your command is executed
	  
		try {
		  // Prompt the user to enter the URL
		  const url = await vscode.window.showInputBox({
			placeHolder: 'Enter the URL of the problem',
			validateInput: text => {
			  return text === '' ? 'This field is required' : null;
			}
		  });
	  
		  // Handle case where user cancels the input box
		  if (!url) {
			vscode.window.showWarningMessage('No URL entered. Command aborted.');
			return;
		  }
	  
		  // Call the fetchcases function with the provided URL
		  await fetchcases(url);
	  
		  // Display a success message
		  vscode.window.showInformationMessage('Cases fetched successfully for the provided URL!');
		} catch (error) {
		  // Handle unexpected errors
		  vscode.window.showErrorMessage(`An error occurred: ${error.message}`);
		}
	  });
	  
	const runcases = vscode.commands.registerCommand('lh.runcases', async function () {
		
		
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor! Open your solution file.');
			return;
		}

		let fp = editor.document.uri.fsPath ;
		
		const lang = findlang( fp ) ;
		let code = editor.document.getText();

		let prob = await vscode.window.showInputBox({
			prompt: "Enter the problem name",
		});

		if( !prob ){
			vscode.window.showErrorMessage('No problem name entered!');
			return;
		}

		prob = prob.toLowerCase().replace(/\s+/g, '-');

		let folderpath = vscode.workspace.workspaceFolders ;

		let problemfolder ;

		for( let folder of folderpath ){
			let temp = folder.uri.fsPath ;
			let testcasefolder = path.join( temp, 'TestCases');
			if( !fs.existsSync(testcasefolder)){
				continue ;
			}
			problemfolder = path.join( testcasefolder, prob );
			if( !fs.existsSync(problemfolder)){
				console.log( "Problem folder not found, first fetch the test cases!" ) ;
				continue ;
			}
			else{
				console.log( "probelm test cases found ! " ) ;
				break ;
			}
		}

		if( lang == 'cpp' ){
			
			const solutionfile = path.join( problemfolder, 'solution.cpp' ) ;
			const exefile = path.join( problemfolder , 'solution.exe' ) ;
			fs.writeFileSync( solutionfile, code ) ;
			
			runcppfile( solutionfile , problemfolder , exefile ) ;
		}
		else if( lang == 'python' ){
			const solutionfile = path.join(problemfolder, 'solution.py');
			fs.writeFileSync(solutionfile, code);

			runPythonFile(solutionfile, problemfolder);
	
		}
		else{
			vscode.window.showErrorMessage('Unknown file type!');
		}
		





	});



	context.subscriptions.push(fetching , runcases );
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
