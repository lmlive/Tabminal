// CommonJS wrapper for pkg compatibility
const path = require('path');
console.log('[Wrapper] Starting Tabminal in CommonJS mode for pkg compatibility...');

// Set up module resolution for ESM imports
async function startApp() {
  try {
    // Dynamic import the ESM module
    const { createServer } = await import('./server.mjs');
    console.log('[Wrapper] Tabminal started successfully');
  } catch (error) {
    console.error('[Wrapper] Failed to start Tabminal:', error);
    process.exit(1);
  }
}

// Start the application
startApp();