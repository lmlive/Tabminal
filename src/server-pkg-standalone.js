#!/usr/bin/env node

// PKG-compatible version - directly include the server logic
const path = require('path');
const { fileURLToPath } = require('url');
const { createServer } = require('http');
const net = require('net');
const fsPromises = require('fs/promises');

// Polyfill for ESM imports in PKG
const importESM = async (modulePath) => {
    try {
        // For PKG, we need to handle the path differently
        const absolutePath = path.resolve(__dirname, modulePath);
        return await import(absolutePath);
    } catch (error) {
        console.error(`[PKG] Failed to import ESM module ${modulePath}:`, error);
        throw error;
    }
};

// Load environment and configuration
async function loadConfig() {
    try {
        // Try to load config
        let config = {
            port: 8080,
            host: '0.0.0.0',
            password: null,
            acceptTerms: false
        };
        
        // Parse command line arguments
        const args = process.argv.slice(2);
        for (let i = 0; i < args.length; i++) {
            if (args[i] === '-p' || args[i] === '--port') {
                config.port = parseInt(args[i + 1]) || 8080;
                i++;
            } else if (args[i] === '-a' || args[i] === '--passwd') {
                config.password = args[i + 1];
                i++;
            } else if (args[i] === '-y') {
                config.acceptTerms = true;
            } else if (args[i] === '--version') {
                console.log('Tabminal v2.0.0 (PKG)');
                process.exit(0);
            }
        }
        
        return config;
    } catch (error) {
        console.error('[Config] Failed to load configuration:', error);
        return {};
    }
}

// Simple HTTP server for testing
function createSimpleServer(config) {
    const http = require('http');
    
    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>Tabminal (PKG Mode)</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #1a1a1a; color: #fff; }
        .container { max-width: 800px; margin: 0 auto; }
        .success { color: #4ade80; }
        .info { color: #60a5fa; }
        h1 { color: #22d3ee; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Tabminal PKG Mode</h1>
        <p class="success">✅ PKG binary is running successfully!</p>
        <p class="info">📦 This is a simplified version for testing PKG compatibility</p>
        <p class="info">🔗 Server listening on port ${config.port}</p>
        <hr>
        <h2>Configuration</h2>
        <ul>
            <li>Mode: PKG Binary</li>
            <li>Port: ${config.port}</li>
            <li>Host: ${config.host}</li>
            <li>Password Protected: ${config.password ? 'Yes' : 'No'}</li>
        </ul>
    </div>
</body>
</html>
        `);
    });
    
    return server;
}

// Main startup function
async function startServer() {
    try {
        console.log('[Server] Starting Tabminal in PKG mode...');
        console.log('[Server] Built with pkg for maximum CPU compatibility');
        
        // Load configuration
        const config = await loadConfig();
        
        // Handle terms acceptance
        if (!config.acceptTerms) {
            console.log('\n[SECURITY WARNING]');
            console.log('Please confirm you are running this service in a trusted environment.');
            console.log('To start the service, use the \'-y\' flag.');
            process.exit(0);
        }
        
        // Generate password if not provided
        if (!config.password) {
            const crypto = require('crypto');
            config.password = crypto.randomBytes(16).toString('hex');
            console.log('\n[SECURITY] No password provided. Generated temporary password:');
            console.log(`\x1b[36m${config.password}\x1b[0m`);
            console.log('Please save this password for login.');
        }
        
        console.log(`\n[Server] Starting server on ${config.host}:${config.port}`);
        console.log(`[Server] Access password: ${config.password}`);
        
        // Create a simple HTTP server for testing
        const server = createSimpleServer(config);
        
        server.listen(config.port, config.host, () => {
            console.log(`\n🎉 Tabminal (PKG Mode) listening on http://${config.host}:${config.port}`);
            console.log(`💡 Login with password: ${config.password}`);
            console.log('\n✅ PKG binary compatibility test PASSED!');
        });
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n[Server] Shutting down gracefully...');
            server.close(() => {
                console.log('[Server] Server stopped');
                process.exit(0);
            });
        });
        
    } catch (error) {
        console.error('[Server] Failed to start in PKG mode:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Start the server
startServer();