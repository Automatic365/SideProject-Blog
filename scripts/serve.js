const http = require('http');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const PORT = 3000;

// Server status information
const serverInfo = {
    startTime: new Date(),
    requestCount: 0,
    errors: 0
};

const server = http.createServer((req, res) => {
    serverInfo.requestCount++;
    const requestStart = Date.now();

    // Log each request
    console.log(chalk.blue('📝 Request:'), chalk.yellow(req.method), req.url);

    // Try different file paths
    let filePath = path.join(__dirname, '../dist', req.url === '/' ? 'index.html' : req.url);
    
    // If the path doesn't have an extension
    if (!path.extname(filePath)) {
        // First try adding .html
        if (fs.existsSync(filePath + '.html')) {
            filePath = filePath + '.html';
        } else {
            // Then try looking for index.html in the directory
            if (fs.existsSync(path.join(filePath, 'index.html'))) {
                filePath = path.join(filePath, 'index.html');
            }
        }
    }

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
        const responseTime = Date.now() - requestStart;

        if (err) {
            if (err.code === 'ENOENT') {
                serverInfo.errors++;
                res.writeHead(404);
                res.end('404 - File Not Found');
                console.log(
                    chalk.red('❌ 404:'),
                    chalk.gray(`${filePath}`),
                    chalk.blue(`(${responseTime}ms)`)
                );
            } else {
                serverInfo.errors++;
                res.writeHead(500);
                res.end('500 - Internal Server Error');
                console.log(
                    chalk.red('🚨 500:'),
                    chalk.gray(err.message),
                    chalk.blue(`(${responseTime}ms)`)
                );
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType[ext] || 'text/plain' });
            res.end(content);
            console.log(
                chalk.green('✅ 200:'),
                chalk.gray(filePath),
                chalk.blue(`(${responseTime}ms)`)
            );
        }
    });
});

server.listen(PORT, () => {
    console.log('\n' + chalk.bgBlue.white(' SERVER STARTED ') + '\n');
    console.log(chalk.cyan('📡 Local:'), chalk.green(`http://localhost:${PORT}`));
    console.log(chalk.cyan('🕒 Time:'), chalk.green(serverInfo.startTime.toLocaleString()));
    console.log(chalk.cyan('📂 Serving:'), chalk.green(path.join(__dirname, '../dist')));
    console.log('\n' + chalk.gray('Waiting for requests...') + '\n');

    // Print server stats every 30 seconds
    setInterval(() => {
        const uptime = Math.round((Date.now() - serverInfo.startTime) / 1000);
        console.log('\n' + chalk.bgBlue.white(' SERVER STATS '));
        console.log(chalk.cyan('⏱️  Uptime:'), chalk.green(`${uptime} seconds`));
        console.log(chalk.cyan('📊 Requests:'), chalk.green(serverInfo.requestCount));
        console.log(chalk.cyan('❌ Errors:'), chalk.red(serverInfo.errors));
        console.log();
    }, 30000);
});

// Handle server shutdown
process.on('SIGINT', () => {
    console.log('\n' + chalk.bgRed.white(' SERVER STOPPED '));
    console.log(chalk.cyan('🕒 Stop time:'), chalk.green(new Date().toLocaleString()));
    console.log(chalk.cyan('⏱️  Uptime:'), chalk.green(`${Math.round((Date.now() - serverInfo.startTime) / 1000)} seconds`));
    console.log(chalk.cyan('📊 Total requests:'), chalk.green(serverInfo.requestCount));
    console.log(chalk.cyan('❌ Total errors:'), chalk.red(serverInfo.errors));
    console.log('\n' + chalk.gray('Server shut down successfully') + '\n');
    process.exit();
}); 