#!/usr/bin/env bun
import { $ } from 'bun';
import path from 'node:path';
import fs from 'node:fs/promises';

async function buildMinimalBinary() {
  const outputFile = `dist/tabminal-minimal`;
  
  console.log(`🔧 Building minimal binary without PTY library...`);
  console.log(`📦 Output: ${outputFile}`);

  try {
    // Create a minimal version that uses fallback terminal handling
    const minimalEntry = await createMinimalEntry();
    
    console.log('🌍 Using Node.js target for maximum compatibility...');
    await $`bun build ${minimalEntry} --compile --outfile ${outputFile} --target node`;

    const statResult = await $`stat -c%s ${outputFile}`;
    const sizeBytes = parseInt(statResult.stdout.toString().trim());
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
    console.log(`✅ Built minimal binary: ${outputFile} (${sizeMB}MB)`);

    // Create startup script
    const outputDir = path.dirname(outputFile);
    const binaryName = path.basename(outputFile);
    const scriptName = `start-${binaryName}.sh`;
    const scriptPath = path.join(outputDir, scriptName);

    const scriptContent = `#!/bin/bash

# Tabminal minimal startup script - no PTY library required
# This version uses basic terminal handling for maximum compatibility

SCRIPT_DIR="$(cd "$(dirname "${'$'}{BASH_SOURCE[0]}")" && pwd)"

echo "⚠️  Running Tabminal in minimal mode (no PTY)"
echo "📋 Features available:"
echo "   ✅ Web interface and dashboard"
echo "   ✅ File browser and editor"
echo "   ✅ System monitoring"
echo "   ❌ Interactive terminal sessions (PTY requires native library)"
echo ""
echo "💡 To enable full terminal functionality:"
echo "   1. Install required system packages"
echo "   2. Use the standard version if available on your system"
echo ""

# Run the minimal application
"$${'SCRIPT_DIR'}/${binaryName}" "$${'@'}"
`;

    try {
      await fs.writeFile(scriptPath, scriptContent);
      await $`chmod +x ${scriptPath}`;
      console.log(`📄 Created startup script: ${scriptPath}`);
    } catch (error) {
      console.warn(`⚠️  Warning: Could not create startup script:`, error);
    }

    // Clean up temporary entry file
    await fs.unlink(minimalEntry);

    console.log(`\n💡 Usage:`);
    console.log(`   ./${scriptName} -a your_password -p 8080`);
    console.log(`   or directly: ./${binaryName} -a your_password -p 8080`);

  } catch (error) {
    console.error(`❌ Minimal build failed:`, error);
    throw error;
  }
}

async function createMinimalEntry() {
  const minimalContent = `#!/usr/bin/env node

// Tabminal Minimal Server - Fallback for systems without PTY support
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock PTY functionality for basic compatibility
const mockPTY = {
  spawn: () => {
    console.log('⚠️  PTY functionality not available in minimal mode');
    return {
      pid: -1,
      cols: 80,
      rows: 24,
      process: 'shell',
      onData: { event: () => ({ dispose: () => {} }) },
      onExit: { event: () => ({ dispose: () => {} }) },
      write: () => {},
      resize: () => {},
      kill: () => {}
    };
  }
};

// Override the PTY import to use our mock
const originalModuleLoad = globalThis.__import;
globalThis.__import = async function(specifier) {
  if (specifier.includes('pty-wrapper') || specifier.includes('bun-pty')) {
    return mockPTY;
  }
  return originalModuleLoad ? originalModuleLoad(specifier) : import(specifier);
};

// Import the main server
try {
  await import('./src/server.mjs');
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}
`;

  const tempEntry = path.join(process.cwd(), 'temp-minimal-entry.mjs');
  await fs.writeFile(tempEntry, minimalContent);
  return tempEntry;
}

buildMinimalBinary().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});