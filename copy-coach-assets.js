// Simple script to copy the source HTML and CSS to the dist directory
const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
function ensureDirectoryExistence(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Copy HTML files
const srcHtmlPath = path.join(__dirname, 'src', 'public', 'pages', 'report', 'index.html');
const distHtmlDir = path.join(__dirname, 'dist', 'public', 'pages', 'report');
ensureDirectoryExistence(distHtmlDir);
fs.copyFileSync(srcHtmlPath, path.join(distHtmlDir, 'index.html'));
console.log('HTML file copied to dist directory');

// Copy CSS files
const srcCssPath = path.join(__dirname, 'src', 'public', 'pages', 'report', 'styles', 'coach.css');
const distCssDir = path.join(__dirname, 'dist', 'public', 'pages', 'report', 'styles');
ensureDirectoryExistence(distCssDir);
fs.copyFileSync(srcCssPath, path.join(distCssDir, 'coach.css'));
console.log('CSS file copied to dist directory');

// Copy avatar placeholder
const srcPlaceholderPath = path.join(__dirname, 'src', 'public', 'media', 'coach-avatar-placeholder.js');
const distMediaDir = path.join(__dirname, 'dist', 'public', 'media');
ensureDirectoryExistence(distMediaDir);
fs.copyFileSync(srcPlaceholderPath, path.join(distMediaDir, 'coach-avatar-placeholder.js'));
console.log('Avatar placeholder copied to dist directory');

console.log('✅ All files copied successfully');
