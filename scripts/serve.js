const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
    // Remove leading slash and create file path
    let filePath = path.join(__dirname, '../dist', req.url === '/' ? 'index.html' : req.url);
    
    const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
    };

    const ext = path.extname(filePath);
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 - File Not Found');
                console.log('404: ' + filePath); // Help with debugging
            } else {
                res.writeHead(500);
                res.end('500 - Internal Server Error');
                console.error(err); // Help with debugging
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType[ext] || 'text/plain' });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
}); 