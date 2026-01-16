#!/usr/bin/env bun
import { $ } from 'bun';
import path from 'node:path';
import fs from 'node:fs/promises';

async function buildNodePtyBinary() {
  const outputFile = `dist/tabminal-linux-node-pty`;
  const target = 'linux-x64-node-pty';
  
  console.log(`🔧 Building binary with node-pty for maximum Linux compatibility...`);
  console.log(`📦 Output: ${outputFile}`);

  try {
    // Create a wrapper that uses node-pty instead of bun-pty
    const nodePtyWrapper = await createNodePtyWrapper();

    // Embed the new PTY wrapper
    await embedNodePtyWrapper(nodePtyWrapper);

    console.log('🌍 Using Node.js target with node-pty...');
    await $`bun build src/server.mjs --compile --outfile ${outputFile} --target node`;

    const statResult = await $`stat -c%s ${outputFile}`;
    const sizeBytes = parseInt(statResult.stdout.toString().trim());
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
    console.log(`✅ Built node-pty binary: ${outputFile} (${sizeMB}MB)`);

    // Create startup script
    const outputDir = path.dirname(outputFile);
    const binaryName = path.basename(outputFile);
    const scriptName = `start-${binaryName}.sh`;
    const scriptPath = path.join(outputDir, scriptName);

    const scriptContent = `#!/bin/bash

# Tabminal startup script with node-pty for maximum Linux compatibility
# This version uses node-pty instead of bun-pty for broader system support

SCRIPT_DIR="$(cd "$(dirname "${'$'}{BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting Tabminal with node-pty compatibility layer..."

# Set environment for better PTY compatibility
export NODE_OPTIONS="--max-optimize-for-size"

# Run the main application
"$${'SCRIPT_DIR'}/${binaryName}" "$${'@'}"
`;

    try {
      await fs.writeFile(scriptPath, scriptContent);
      await $`chmod +x ${scriptPath}`;
      console.log(`📄 Created startup script: ${scriptPath}`);
    } catch (error) {
      console.warn(`⚠️  Warning: Could not create startup script:`, error);
    }

    // Clean up temporary files
    await fs.unlink(nodePtyWrapper);
    await restoreOriginalPtyWrapper();

    console.log(`\n💡 Usage:`);
    console.log(`   ./${scriptName} -a your_password -p 8080`);
    console.log(`   or directly: ./${binaryName} -a your_password -p 8080`);
    console.log(`\n🔄 This version should work on most Linux systems, including older kernels.`);

  } catch (error) {
    console.error(`❌ node-pty build failed:`, error);
    throw error;
  }
}

async function createNodePtyWrapper() {
  const wrapperContent = `
import * as nodePtyModule from 'node-pty';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

class EventEmitter {
  listeners = [];
  event = (listener) => {
    this.listeners.push(listener);
    return {
      dispose: () => {
        const i = this.listeners.indexOf(listener);
        if (i !== -1) {
          this.listeners.splice(i, 1);
        }
      }
    };
  };
  fire(data) {
    for (const listener of this.listeners) {
      listener(data);
    }
  }
}

const DEFAULT_COLS = 80;
const DEFAULT_ROWS = 24;
const DEFAULT_FILE = "sh";
const DEFAULT_NAME = "xterm";

class Terminal {
  handle = null;
  _pid = -1;
  _cols = DEFAULT_COLS;
  _rows = DEFAULT_ROWS;
  _name = DEFAULT_NAME;
  _readLoop = false;
  _closing = false;
  _onData = new EventEmitter();
  _onExit = new EventEmitter();

  constructor(file = DEFAULT_FILE, args = [], opts = { name: DEFAULT_NAME }) {
    try {
      this._cols = opts.cols ?? DEFAULT_COLS;
      this._rows = opts.rows ?? DEFAULT_ROWS;
      const cwd = opts.cwd ?? process.cwd();
      const env = opts.env ?? process.env;

      // Use node-pty instead of bun-pty
      this.handle = nodePtyModule.spawn(file, args, {
        name: DEFAULT_NAME,
        cols: this._cols,
        rows: this._rows,
        cwd: cwd,
        env: env
      });

      this._pid = this.handle.pid;

      // Forward node-pty events to our EventEmitter
      this.handle.onData((data) => {
        this._onData.fire(data);
      });

      this.handle.onExit(({ exitCode, signal }) => {
        this._onExit.fire({ exitCode, signal });
        this._closing = true;
      });

      this._startReadLoop();
    } catch (error) {
      console.error('[node-pty] Failed to spawn terminal:', error);
      throw error;
    }
  }

  get pid() {
    return this._pid;
  }

  get cols() {
    return this._cols;
  }

  get rows() {
    return this._rows;
  }

  get process() {
    return "shell";
  }

  get onData() {
    return this._onData.event;
  }

  get onExit() {
    return this._onExit.event;
  }

  write(data) {
    if (this._closing || !this.handle) return;
    this.handle.write(data);
  }

  resize(cols, rows) {
    if (this._closing || !this.handle) return;
    this._cols = cols;
    this._rows = rows;
    this.handle.resize(cols, rows);
  }

  kill(signal = "SIGTERM") {
    if (this._closing || !this.handle) return;
    this._closing = true;
    this.handle.kill(signal);
    this._onExit.fire({ exitCode: 0, signal });
  }

  async _startReadLoop() {
    // node-pty handles data events automatically, so this is just for compatibility
    this._readLoop = true;
  }
}

function spawn(file, args, options) {
  return new Terminal(file, args, options);
}

export {
  spawn,
  Terminal
};
`;

  const tempWrapper = path.join(process.cwd(), 'temp-node-pty-wrapper.mjs');
  await fs.writeFile(tempWrapper, wrapperContent);
  return tempWrapper;
}

async function embedNodePtyWrapper(tempWrapper) {
  const ptyWrapperPath = path.join('src', 'utils', 'pty-wrapper.mjs');
  
  // Backup original
  const backupPath = path.join(process.cwd(), 'pty-wrapper.mjs.backup');
  if (!await fs.access(backupPath).catch(() => false)) {
    await fs.copyFile(ptyWrapperPath, backupPath);
  }

  // Replace with node-pty version
  const wrapperContent = await fs.readFile(tempWrapper, 'utf8');
  await fs.writeFile(ptyWrapperPath, wrapperContent);
  
  console.log('📦 Replaced PTY wrapper with node-pty version');
}

async function restoreOriginalPtyWrapper() {
  const backupPath = path.join(process.cwd(), 'pty-wrapper.mjs.backup');
  const ptyWrapperPath = path.join('src', 'utils', 'pty-wrapper.mjs');
  
  try {
    if (await fs.access(backupPath).catch(() => false)) {
      await fs.copyFile(backupPath, ptyWrapperPath);
      await fs.unlink(backupPath);
      console.log('🗑️  Restored original PTY wrapper');
    }
  } catch (error) {
    console.warn('⚠️  Could not restore original PTY wrapper:', error);
  }
}

buildNodePtyBinary().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});