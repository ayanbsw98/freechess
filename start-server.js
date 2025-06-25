// Simple script to start the server
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting the server...');

// Start the server process
const server = spawn('node', ['dist/index.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
});

console.log('Server should be running. Open http://localhost:3000/ in your browser');
