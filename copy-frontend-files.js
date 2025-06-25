const fs = require('fs');
const path = require('path');

function copyFile(source, target) {
    fs.copyFileSync(source, target);
    console.log(`Copied ${source} to ${target}`);
}

function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

// Copy the performance-rating.js file
const performanceRatingSource = path.join(__dirname, 'src', 'public', 'pages', 'report', 'scripts', 'performance-rating.js');
const performanceRatingTarget = path.join(__dirname, 'dist', 'public', 'pages', 'report', 'scripts', 'performance-rating.js');
ensureDirectoryExistence(performanceRatingTarget);
copyFile(performanceRatingSource, performanceRatingTarget);

// Create a modified version of analysis.js with window.reportResults properly set
const analysisJsPath = path.join(__dirname, 'dist', 'public', 'pages', 'report', 'scripts', 'analysis.js');
if (fs.existsSync(analysisJsPath)) {
    let content = fs.readFileSync(analysisJsPath, 'utf8');
    
    // Find where the reportResults are set
    const setReportResultsRegex = /reportResults = (.*?);/;
    const match = content.match(setReportResultsRegex);
    
    if (match) {
        // Add the window.reportResults = reportResults; line after it
        const newContent = content.replace(
            match[0],
            `${match[0]}\n    window.reportResults = reportResults;\n    console.log('[DEBUG] window.reportResults set:', window.reportResults);\n    try {\n        $("body").append('<div id="analysis-debug" style="position:fixed;bottom:20px;left:0;background:#c22;color:#fff;z-index:9999;padding:4px;font-size:12px;">window.reportResults set</div>');\n        setTimeout(() => {\n            $("#analysis-debug").text('window.reportResults set: ' + (window.reportResults ? 'OK' : 'MISSING'));\n        }, 1000);\n    } catch (e) {\n        console.error('[DEBUG] Error updating debug display:', e);\n    }`
        );
        
        fs.writeFileSync(analysisJsPath, newContent, 'utf8');
        console.log(`Modified ${analysisJsPath} to include window.reportResults`);
    } else {
        console.log(`Could not find where reportResults is set in ${analysisJsPath}`);
    }
} else {
    console.log(`File not found: ${analysisJsPath}`);
}

console.log('Done copying and modifying frontend files.');
