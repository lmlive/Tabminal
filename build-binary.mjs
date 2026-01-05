#!/usr/bin/env bun
import { $ } from 'bun';
import path from 'node:path';

const TARGETS = {
  'linux-x64': 'bun-linux-x64',
  'linux-arm64': 'bun-linux-arm64',
  'darwin-x64': 'bun-darwin-x64',
  'darwin-arm64': 'bun-darwin-arm64',
  'windows-x64': 'bun-windows-x64',
};

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
    await $`bun build src/server.mjs --compile --outfile ${outputFile} --target ${bunTarget}`;

    const statResult = await $`stat -c%s ${outputFile}`;
    const sizeBytes = parseInt(statResult.stdout.toString().trim());
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
    console.log(`✅ Built: ${outputFile} (${sizeMB}MB)`);
  } catch (error) {
    console.error(`❌ Build failed for ${target}:`, error);
    throw error;
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
