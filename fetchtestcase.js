const puppeteer = require('puppeteer');
const assert = require('assert');

// Utility functions
function returnClean(input) {
    input += ',';
    let cleanInput = [];
    let i = 0;
    while (i < input.length) {
        let ch = input[i];
        if (ch !== '=') {
            i++;
        } else {
            i += 2; // Skip space
            let str11 = "";
            let ndim = 0;
            while (input[i] === '[') {
                i++;
                ndim++;
            }
            if (ndim !== 0) { // Array is present
                i -= ndim;
                str11 = "";
                const closingBrackets = ']'.repeat(ndim);
                while (input.slice(i, i + ndim) !== closingBrackets) {
                    str11 += input[i];
                    i++;
                }
                str11 += ']'.repeat(ndim);
                const arr = JSON.parse(str11);
                const dimMatrix = findDimensions(arr);
                assert(dimMatrix.length === ndim || (!dimMatrix.length && ndim === 1));
                const resultantMatrix = dimMatrix.join(" ") + " " + Array.from(flattenList(arr)).join(" ");
                cleanInput.push(resultantMatrix);
            } else {
                if (input[i] === '"') {
                    i++;
                    while (input[i] !== '"') {
                        str11 += input[i];
                        i++;
                    }
                } else {
                    while (input[i] !== ',') {
                        str11 += input[i];
                        i++;
                    }
                }
                cleanInput.push(str11);
            }
            i++;
        }
    }
    return cleanInput.join(" ");
}

function findDimensions(array) {
    if (!Array.isArray(array) || array.length === 0) {
        return [];
    }
    return [array.length, ...findDimensions(array[0])];
}

function* flattenList(nestedList) {
    for (const element of nestedList) {
        if (Array.isArray(element)) {
            yield* flattenList(element);
        } else {
            yield element;
        }
    }
}




async function extraction( url ){
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

try {

console.log( " 22 " ) ;

await page.goto(url); // Replace with the target URL
const elements = await page.$$('.elfjS pre');

let formattedInput = [];
let formattedOutput = [];
console.log("Elements found:", elements.length);
console.log( " 3 " ) ;
for (const element of elements) {
    let text = await page.evaluate(el => el.textContent, element);
    let cleanedText = text.replace(/(Input:|Output:|Explanation:)\s*/g, '').trim();
    let [input, expectedOutput] = cleanedText.split('\n');
    console.log( " 4 " ) ;
    console.log( input ) ;
    console.log( expectedOutput ) ;
    let processedOutput = expectedOutput.startsWith('[') ? JSON.parse(expectedOutput) : expectedOutput;

    if (Array.isArray(processedOutput)) {
        let dimArray = findDimensions(processedOutput);
        processedOutput = dimArray.length > 1
            ? processedOutput.map(subArray => subArray.join(' ')).join('\n')
            : processedOutput.join(' ');
    } else if (typeof processedOutput === 'string' && processedOutput.startsWith('"')) {
        processedOutput = processedOutput.slice(1, -1);
    }

    formattedInput.push(returnClean(input));
    formattedOutput.push(processedOutput);
}
let resultOfExtraction = [ formattedInput , formattedOutput];
console.log( resultOfExtraction ) ;
return resultOfExtraction ;
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

module.exports = extraction;
