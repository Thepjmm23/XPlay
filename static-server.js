const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 5500;
const GITHUB_URL = 'https://thepjmm23.github.io/XPlay/';

// Redirect server
const server = http.createServer((req, res) => {
    // Redirect all requests to the GitHub Pages URL
    const redirectUrl = GITHUB_URL + req.url;
    
    res.writeHead(302, {
        'Location': redirectUrl,
        'Content-Type': 'text/html'
    });
    
    res.end(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Redirecting...</title>
            <meta http-equiv="refresh" content="0; url=${redirectUrl}">
        </head>
        <body>
            <p>Redirecting to <a href="${redirectUrl}">${redirectUrl}</a>...</p>
        </body>
        </html>
    `);
});

server.listen(PORT, () => {
    console.log(`🚀 XPlay Redirect Server running at:`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://127.0.0.1:${PORT}`);
    console.log(`   External: http://185.199.111.153:${PORT}`);
    console.log(`   GitHub:  ${GITHUB_URL}`);
    console.log('');
    console.log(`🔄 All requests redirect to: ${GITHUB_URL}`);
    console.log(`🌐 Open ${GITHUB_URL} in your browser`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n👋 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
    });
});

process.on('SIGINT', () => {
    console.log('\n👋 SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
    });
});
