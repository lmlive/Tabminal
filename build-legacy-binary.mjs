#!/usr/bin/env bun
import { $ } from 'bun';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Buffer } from 'buffer';

async function embedPtyLib() {
  const libFileName = 'librust_pty.so';
  const sourceLibPath = path.join('node_modules', 'bun-pty', 'rust-pty', 'target', 'release', libFileName);

  try {
    await fs.access(sourceLibPath);
    const libBuffer = await fs.readFile(sourceLibPath);
    const libBase64 = libBuffer.toString('base64');

    const ptyWrapperPath = path.join('src', 'utils', 'pty-wrapper.mjs');
    let ptyWrapperContent = await fs.readFile(ptyWrapperPath, 'utf8');

    const startMarker = '// EMBEDDED_PTY_LIB_START';
    const endMarker = '// EMBEDDED_PTY_LIB_END';

    const embeddedLibContent = `${startMarker}
const EMBEDDED_PTY_LIB = {
  name: '${libFileName}',
  content: '${libBase64}',
  platform: 'linux',
  arch: 'x64',
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

    if (ptyWrapperContent.includes(startMarker) && ptyWrapperContent.includes(endMarker)) {
      const startIdx = ptyWrapperContent.indexOf(startMarker);
      const endIdx = ptyWrapperContent.indexOf(endMarker) + endMarker.length;
      ptyWrapperContent = ptyWrapperContent.substring(0, startIdx) + embeddedLibContent + ptyWrapperContent.substring(endIdx);
    } else {
      const importSectionEnd = ptyWrapperContent.indexOf('\n', ptyWrapperContent.indexOf('import { isCompiled } from \'./is-compiled.mjs\';')) + 1;
      ptyWrapperContent = ptyWrapperContent.substring(0, importSectionEnd) + embeddedLibContent + '\n' + ptyWrapperContent.substring(importSectionEnd);
    }

    await fs.writeFile(ptyWrapperPath, ptyWrapperContent);
    console.log(`📦 Embedded ${libFileName} for legacy CPU`);
    return true;
  } catch (error) {
    console.error(`❌ Could not embed ${libFileName}:`, error);
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

async function createLegacyBinary() {
  const outputFile = `dist/tabminal-legacy-cpu`;
  
  console.log(`🔧 Building binary for legacy CPU (Intel Core i5-3320M)...`);
  console.log(`📦 Output: ${outputFile}`);

  try {
    // First, build assets
    await $`bun run build-assets.mjs`;
    
    // Embed the library
    const embedded = await embedPtyLib();

    console.log('🏗️  Using conservative CPU flags for maximum compatibility...');
    
    // Try different build approaches
    const buildOptions = [
      // Option 1: Node target (most compatible)
      `bun build src/server.mjs --compile --outfile ${outputFile} --target node`,
      
      // Option 2: Linux target with minimal optimization
      `bun build src/server.mjs --compile --outfile ${outputFile}-opt --target bun-linux-x64 --define:process.env.NODE_ENV="production" --minify`,
      
      // Option 3: Legacy x64 target
      `bun build src/server.mjs --compile --outfile ${outputFile}-compat --target bun-linux-x64`
    ];

    let success = false;
    
    for (let i = 0; i < buildOptions.length; i++) {
      const option = buildOptions[i];
      const currentOutput = i === 0 ? outputFile : `${outputFile}-${i === 1 ? 'opt' : 'compat'}`;
      
      try {
        console.log(`🔄 Build attempt ${i + 1}: ${option}`);
        const modifiedOption = option.replace(outputFile, currentOutput);
        
        await $`${modifiedOption}`;
        
        const statResult = await $`stat -c%s ${currentOutput}`;
        const sizeBytes = parseInt(statResult.stdout.toString().trim());
        const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
        console.log(`✅ Built: ${currentOutput} (${sizeMB}MB)`);
        
        // Copy to shared directory for immediate testing
        if (i === 0) {
          await $`cp ${currentOutput} /data/lm/project/tm/`;
          await $`chmod +x /data/lm/project/tm/$(basename ${currentOutput})`;
          console.log(`📦 Copied to shared directory for testing`);
        }
        
        success = true;
      } catch (error) {
        console.error(`❌ Build attempt ${i + 1} failed:`, error.message);
      }
    }

    if (success) {
      // Copy the required pty library
      const sourceLibPath = path.join('node_modules', 'bun-pty', 'rust-pty', 'target', 'release', 'librust_pty.so');
      const outputDir = path.dirname(outputFile);
      const destLibPath = path.join(outputDir, 'librust_pty.so');
      
      try {
        await pipeline(createReadStream(sourceLibPath), createWriteStream(destLibPath));
        console.log(`📦 Copied librust_pty.so to ${outputDir}/`);
        
        // Copy to shared directory
        await $`cp ${destLibPath} /data/lm/project/tm/`;
      } catch (error) {
        console.warn(`⚠️  Warning: Could not copy pty library`);
      }

      // Test the binary on legacy system
      console.log(`\n🧪 Testing binary on legacy system...`);
      const testResult = await $`ssh liming@192.168.0.4 'cd /mnt/lm/project/tm && timeout 5 ./tabminal-legacy-cpu --version 2>&1'`.catch(e => e);
      
      if (testResult.exitCode === 0) {
        console.log(`✅ Binary runs successfully on legacy CPU!`);
      } else {
        console.log(`❌ Binary still fails on legacy CPU`);
        console.log(`   Error: ${testResult.stderr.toString().trim()}`);
        console.log(`\n💡 Recommendation: Use Node.js source approach instead`);
      }
    }

    // Restore the placeholder
    await restorePtyLibPlaceholder();

  } catch (error) {
    await restorePtyLibPlaceholder();
    console.error(`❌ Legacy build failed:`, error);
    throw error;
  }
}

createLegacyBinary().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});