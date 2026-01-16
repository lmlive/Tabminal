#!/usr/bin/env bun
import { $ } from 'bun';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Buffer } from 'buffer';

const TARGETS = {
  'linux-x64-compatible': 'bun-linux-x64',
};

// Import the necessary functions from build-binary.mjs
async function embedPtyLib(target) {
  const platform = 'linux'; // Force to linux for compatibility build
  const arch = 'x64'; // Force to x64 for compatibility build

  let libFileName = 'librust_pty.so';

  const sourceLibPath = path.join('node_modules', 'bun-pty', 'rust-pty', 'target', 'release', libFileName);

  try {
    await fs.access(sourceLibPath);

    // Read the library file
    const libBuffer = await fs.readFile(sourceLibPath);
    const libBase64 = libBuffer.toString('base64');

    // Instead of creating a separate file, we'll modify the pty-wrapper.mjs file directly
    const ptyWrapperPath = path.join('src', 'utils', 'pty-wrapper.mjs');
    let ptyWrapperContent = await fs.readFile(ptyWrapperPath, 'utf8');

    // Define placeholder markers for the embedded library
    const startMarker = '// EMBEDDED_PTY_LIB_START';
    const endMarker = '// EMBEDDED_PTY_LIB_END';

    // Create the embedded library content
    const embeddedLibContent = `${startMarker}
const EMBEDDED_PTY_LIB = {
  name: '${libFileName}',
  content: '${libBase64}',
  platform: '${platform}',
  arch: '${arch}',
  isBinary: true
};

function getEmbeddedPtyLib() {
  const buffer = Buffer.from(EMBEDDED_PTY_LIB.content, 'base64');
  return {
    ...EMBEDDED_PTY_LIB,
    buffer
  };
}
${endMarker}`;

    // Check if the markers already exist in the file
    if (ptyWrapperContent.includes(startMarker) && ptyWrapperContent.includes(endMarker)) {
      // Replace the existing embedded content
      const startIdx = ptyWrapperContent.indexOf(startMarker);
      const endIdx = ptyWrapperContent.indexOf(endMarker) + endMarker.length;
      ptyWrapperContent = ptyWrapperContent.substring(0, startIdx) + embeddedLibContent + ptyWrapperContent.substring(endIdx);
    } else {
      // Add the embedded content after the imports
      const importSectionEnd = ptyWrapperContent.indexOf('\n', ptyWrapperContent.indexOf('import { isCompiled } from \'./is-compiled.mjs\';')) + 1;
      ptyWrapperContent = ptyWrapperContent.substring(0, importSectionEnd) + embeddedLibContent + '\n' + ptyWrapperContent.substring(importSectionEnd);
    }

    await fs.writeFile(ptyWrapperPath, ptyWrapperContent);

    console.log(`📦 Embedded ${libFileName} for ${target} directly into pty-wrapper.mjs`);
    return true;
  } catch (error) {
    console.error(`❌ Could not embed ${libFileName} for ${target}:`, error);
    return false;
  }
}

async function restorePtyLibPlaceholder() {
  const ptyWrapperPath = path.join('src', 'utils', 'pty-wrapper.mjs');
  try {
    let ptyWrapperContent = await fs.readFile(ptyWrapperPath, 'utf8');

    const startMarker = '// EMBEDDED_PTY_LIB_START';
    const endMarker = '// EMBEDDED_PTY_LIB_END';

    if (ptyWrapperContent.includes(startMarker) && ptyWrapperContent.includes(endMarker)) {
      const startIdx = ptyWrapperContent.indexOf(startMarker);
      const endIdx = ptyWrapperContent.indexOf(endMarker) + endMarker.length;
      const restoredContent = ptyWrapperContent.substring(0, startIdx) +
                             startMarker + '\n// This section will be replaced with actual embedded library content during build\n' + endMarker +
                             ptyWrapperContent.substring(endIdx);

      await fs.writeFile(ptyWrapperPath, restoredContent);
      console.log('🗑️  Restored original pty-wrapper.mjs file');
    }
  } catch (error) {
    console.error('❌ Could not restore original pty-wrapper.mjs file:', error);
  }
}

async function copyPtyLib(target, outputFile) {
  const platform = 'linux';
  const arch = 'x64';

  let libFileName = 'librust_pty.so';

  const sourceLibPath = path.join('node_modules', 'bun-pty', 'rust-pty', 'target', 'release', libFileName);
  const outputDir = path.dirname(outputFile);
  const destLibPath = path.join(outputDir, libFileName);

  try {
    await fs.access(sourceLibPath);
    await pipeline(createReadStream(sourceLibPath), createWriteStream(destLibPath));
    console.log(`📦 Copied ${libFileName} to ${outputDir}/`);
    return destLibPath;
  } catch (error) {
    console.warn(`⚠️  Warning: Could not copy ${libFileName}. This may cause runtime errors.`);
    console.warn(`   Expected path: ${sourceLibPath}`);
    console.warn(`   Make sure you have built the bun-pty native library first.`);
    return null;
  }
}

async function createCompatibilityBinary() {
  const outputFile = `dist/tabminal-linux-x64-compatible`;
  const target = 'linux-x64-compatible';
  
  console.log(`🔧 Building compatibility binary for older Linux systems...`);
  console.log(`📦 Output: ${outputFile}`);

  try {
    // Embed the library into the wrapper before building
    const embedded = await embedPtyLib(target);

    console.log('🌍 Using Node.js target for maximum CPU compatibility...');
    if (embedded) {
      await $`bun build src/server.mjs --compile --outfile ${outputFile} --target node`;
    } else {
      await $`bun build src/server.mjs --compile --outfile ${outputFile} --target node`;
    }

    const statResult = await $`stat -c%s ${outputFile}`;
    const sizeBytes = parseInt(statResult.stdout.toString().trim());
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
    console.log(`✅ Built compatibility binary: ${outputFile} (${sizeMB}MB)`);

    // Copy the required pty library for the target platform alongside the binary
    const copiedLibPath = await copyPtyLib(target, outputFile);

    // Create startup script
    const outputDir = path.dirname(outputFile);
    const binaryName = path.basename(outputFile);
    const scriptName = `start-${path.basename(outputFile, path.extname(outputFile))}.sh`;
    const scriptPath = path.join(outputDir, scriptName);

    const scriptContent = `#!/bin/bash

# Tabminal compatibility startup script for older Linux systems
# This script ensures the required librust_pty library is found when running the binary

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${'$'}{BASH_SOURCE[0]}")" && pwd)"

# Set the library path to the directory containing the binary
export BUN_PTY_LIB="$${'SCRIPT_DIR'}/librust_pty.so"

# Run the main application with all passed arguments
"$${'SCRIPT_DIR'}/${binaryName}" "$${'@'}"
`;

    try {
      await fs.writeFile(scriptPath, scriptContent);
      await $`chmod +x ${scriptPath}`;
      console.log(`📄 Created startup script: ${scriptPath}`);
    } catch (error) {
      console.warn(`⚠️  Warning: Could not create startup script:`, error);
    }

    // Restore the placeholder in the wrapper file after build
    await restorePtyLibPlaceholder();

    console.log(`\n💡 Usage:`);
    console.log(`   ./${scriptName} -a your_password -p 8080`);
    console.log(`   or directly: ./${binaryName} -a your_password -p 8080`);
    console.log(`\n🔄 If this version still fails, try rebuilding PTY library with:`);
    console.log(`   cd node_modules/bun-pty && cargo build --release --target x86_64-unknown-linux-gnu`);

  } catch (error) {
    // Restore the placeholder even if build fails
    await restorePtyLibPlaceholder();
    console.error(`❌ Compatibility build failed:`, error);
    throw error;
  }
}

createCompatibilityBinary().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});