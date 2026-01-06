#!/usr/bin/env bun
import { $ } from 'bun';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Buffer } from 'buffer';

const TARGETS = {
  'linux-x64': 'bun-linux-x64',
  'linux-arm64': 'bun-linux-arm64',
  'darwin-x64': 'bun-darwin-x64',
  'darwin-arm64': 'bun-darwin-arm64',
  'windows-x64': 'bun-windows-x64',
};

// We no longer embed the library in the JS code, instead we copy it to the output directory
// The pty-wrapper.mjs now looks for the library in the same directory as the executable
async function embedPtyLib(target) {
  // This function is kept for compatibility but doesn't need to do anything
  // The library will be copied by the copyPtyLib function
  console.log('📦 Library embedding handled by copyPtyLib function');
  return true;
}

async function restorePtyLibPlaceholder() {
  // This function is kept for compatibility but doesn't need to do anything
  console.log('📦 No placeholder to restore');
}

async function copyPtyLib(target, outputFile) {
  const platform = target.split('-')[0];
  const arch = target.split('-')[1];

  let libFileName;
  if (platform === 'darwin') {
    libFileName = arch === 'arm64' ? 'librust_pty_arm64.dylib' : 'librust_pty.dylib';
  } else if (platform === 'win32') {
    libFileName = 'rust_pty.dll';
  } else { // linux
    libFileName = arch === 'arm64' ? 'librust_pty_arm64.so' : 'librust_pty.so';
  }

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
    return null;
  }
}

async function build(target) {
  const bunTarget = TARGETS[target];
  if (!bunTarget) {
    console.error(`❌ Unknown target: ${target}`);
    console.log(`Available targets: ${Object.keys(TARGETS).join(', ')}`);
    process.exit(1);
  }

  let outputFile = `dist/tabminal-${target}`;
  if (target.includes('windows')) {
    outputFile += '.exe';
  }

  console.log(`🏗️  Building for ${target} (${bunTarget})...`);
  console.log(`📦 Output: ${outputFile}`);

  try {
    // Embed the library into the wrapper before building
    const embedded = await embedPtyLib(target);

    if (embedded) {
      // Build with the embedded library
      await $`bun build src/server.mjs --compile --outfile ${outputFile} --target ${bunTarget}`;
    } else {
      // Fallback to original build if embedding failed
      await $`bun build src/server.mjs --compile --outfile ${outputFile} --target ${bunTarget}`;
    }

    const statResult = await $`stat -c%s ${outputFile}`;
    const sizeBytes = parseInt(statResult.stdout.toString().trim());
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
    console.log(`✅ Built: ${outputFile} (${sizeMB}MB)`);

    // Copy the required pty library for the target platform (for fallback)
    const libPath = await copyPtyLib(target, outputFile);

    // Create a startup script for non-Windows platforms
    if (!target.includes('windows') && libPath) {
      await createStartupScript(target, outputFile);
    }

    // Restore the placeholder in the wrapper file after build
    await restorePtyLibPlaceholder();

  } catch (error) {
    // Restore the placeholder even if build fails
    await restorePtyLibPlaceholder();
    console.error(`❌ Build failed for ${target}:`, error);
    throw error;
  }
}

async function createStartupScript(target, outputFile) {
  const outputDir = path.dirname(outputFile);
  const binaryName = path.basename(outputFile);
  const scriptName = `start-${path.basename(outputFile, path.extname(outputFile))}.sh`;
  const scriptPath = path.join(outputDir, scriptName);

  const scriptContent = `#!/bin/bash

# Tabminal startup script for ${target}
# This script ensures the required librust_pty library is found when running the binary

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${'$'}{BASH_SOURCE[0]}")" && pwd)"

# Set the library path to the directory containing the binary
export BUN_PTY_LIB="$${'SCRIPT_DIR'}/${'librust_pty.so'}"

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
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    const platform = process.platform;
    const arch = process.arch.replace('x86_64', 'x64').replace('arm64', 'arm64');
    const target = `${platform}-${arch}`;

    console.log(`🎯 No target specified, building for current platform: ${target}`);
    await build(target);
    return;
  }

  if (args.includes('--all')) {
    console.log(`🌍 Building for all platforms...`);
    for (const target of Object.keys(TARGETS)) {
      await build(target);
    }
    console.log('✅ All builds complete!');
    return;
  }

  const targetIdx = args.indexOf('--target');
  if (targetIdx !== -1 && args[targetIdx + 1]) {
    const target = args[targetIdx + 1];
    await build(target);
    return;
  }

  console.error('❌ Invalid arguments');
  console.log('Usage:');
  console.log('  bun run build:binary                    # Build for current platform');
  console.log('  bun run build:binary --target <target>   # Build for specific target');
  console.log('  bun run build:binary --all               # Build for all platforms');
  console.log(`\nAvailable targets: ${Object.keys(TARGETS).join(', ')}`);
  process.exit(1);
}

main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
