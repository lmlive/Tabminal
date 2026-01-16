#!/usr/bin/env node

// PKG-compatible version - converts from ESM to CommonJS
const path = require('path');
const { fileURLToPath } = require('url');
const { createServer } = require('http');
const net = require('net');
const fsPromises = require('fs/promises');

// Dynamic imports for ESM modules
async function startServer() {
    try {
        console.log('[Server] Starting Tabminal in PKG mode...');
        
        // Import the original server module
        const serverModule = await import('./server.mjs');
        console.log('[Server] Tabminal started successfully in PKG mode');
        
    } catch (error) {
        console.error('[Server] Failed to start in PKG mode:', error);
        process.exit(1);
    }
}

// Start the server
startServer();