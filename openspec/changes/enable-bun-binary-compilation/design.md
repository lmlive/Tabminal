# Design: Bun Binary Compilation

## Overview

This design details how Tabminal will be compiled into standalone binaries using Bun's `--compile` feature, including static asset bundling, multi-platform builds, and distribution strategy.

## Architecture

### Current Architecture

```
User's System
  └─ bun install
     └─ bun src/server.mjs
        ├─ src/*.mjs (application code)
        ├─ node_modules/ (dependencies)
        └─ public/ (static assets, served from filesystem)
```

### Target Architecture

```
Binary Distribution (tabminal-linux-amd64)
  └─ Embedded Bun Runtime
     ├─ Compiled Application Code
     ├─ Embedded Dependencies (bun-pty, koa, etc.)
     └─ Embedded Static Assets (public/*)
        └─ Runtime Data: ~/.tabminal/
```

## Technical Implementation

### 1. Build Configuration

#### Basic Compile Command
```bash
bun build --compile src/server.mjs \
  --outfile dist/tabminal \
  --target bun-linux-x64 \
  --external bun-pty
```

**Note**: We need to investigate if `--external` is needed for bun-pty or if it works seamlessly with `--compile`.

#### Multi-Platform Targets
- Linux: `bun-linux-x64`, `bun-linux-arm64`
- macOS: `bun-darwin-x64`, `bun-darwin-arm64` (Apple Silicon)
- Windows: `bun-windows-x64`

#### NPM Scripts
```json
{
  "scripts": {
    "build:binary": "bun run build-binary.mjs",
    "build:binary:linux": "bun run build-binary.mjs --target linux-x64",
    "build:binary:macos": "bun run build-binary.mjs --target darwin-arm64",
    "build:binary:windows": "bun run build-binary.mjs --target windows-x64",
    "build:binary:all": "bun run build-binary.mjs --all"
  }
}
```

### 2. Static Asset Bundling

#### Strategy Options

**Option A: Embed Assets as Base64 Strings (RECOMMENDED)**
```javascript
// build-assets.mjs - Generate embedded assets
const assets = {
  'index.html': readFileSync('public/index.html', 'utf-8'),
  'styles.css': readFileSync('public/styles.css', 'utf-8'),
  'app.js': readFileSync('public/app.js', 'utf-8'),
  // ... other assets
};

// Write to src/assets/generated.mjs
writeFileSync('src/assets/generated.mjs', `export const ASSETS = ${JSON.stringify(assets)};`);
```

**Server Code Modification**:
```javascript
import { ASSETS } from './assets/generated.mjs';

app.use(async (ctx, next) => {
  const filePath = ctx.path.slice(1); // Remove leading /
  if (ASSETS[filePath]) {
    const ext = path.extname(filePath);
    ctx.type = ext;
    ctx.body = ASSETS[filePath];
  } else {
    await next();
  }
});
```

**Pros**:
- Simple implementation
- All assets in single file
- Fast access at runtime
- Works seamlessly with `--compile`

**Cons**:
- Increases binary size (but still < 100MB)
- Need to generate file before compilation

**Option B: Bun File Loader Plugin**
```javascript
// build-binary.mjs
const plugin = {
  name: 'file-loader',
  setup(build) {
    build.onLoad({ filter: /public\/.*/ }, (args) => {
      return {
        contents: `export default ${JSON.stringify(readFileSync(args.path))}`,
        loader: 'js',
      };
    });
  },
};

await Bun.build({
  entrypoints: ['src/server.mjs'],
  plugins: [plugin],
  target: 'bun',
  compile: true,
});
```

**Pros**:
- More flexible
- Can load any file type

**Cons**:
- More complex
- Plugin API may not work with `--compile`

**Decision**: Start with Option A (Base64 embedding) for simplicity and reliability.

### 3. Directory Structure After Build

```
dist/
├── tabminal-linux-x64         # Linux binary
├── tabminal-linux-arm64       # Linux ARM binary
├── tabminal-darwin-x64        # macOS Intel binary
├── tabminal-darwin-arm64      # macOS Apple Silicon binary
└── tabminal-windows-x64.exe   # Windows binary
```

### 4. Runtime Path Resolution

#### Challenge: When running from binary, `__dirname` points to binary location, not source

#### Solution:
```javascript
// src/paths.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Determine if running from compiled binary
const isCompiled = process.argv[1].endsWith('tabminal') ||
                   !process.argv[1].endsWith('.mjs');

// Resolve paths correctly
export const getAssetPath = (assetName) => {
  if (isCompiled) {
    // Assets are embedded, handled differently
    return null;
  } else {
    // Running from source
    return path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', assetName);
  }
};

export const getShellToolsPath = () => {
  if (isCompiled) {
    // Extract shell tools to temp directory
    // or embed them as assets
  } else {
    return path.join(process.cwd(), 'shell');
  }
};
```

### 5. Configuration and Data

#### Directory Layout (unchanged for binary)
```
~/.tabminal/
├── config.json          # User configuration
├── sessions/            # Session data
│   ├── <session-id>.json
│   └── <session-id>.log
└── ...                  # Other runtime data
```

#### Config Resolution
```javascript
// src/config.mjs (enhanced)
const DEFAULT_CONFIG = {
  // ... default values
};

let configPath = path.join(os.homedir(), '.tabminal', 'config.json');
if (process.env.TABMINAL_CONFIG) {
  configPath = process.env.TABMINAL_CONFIG;
}

// Load or create config
let userConfig = {};
if (fs.existsSync(configPath)) {
  userConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

// Merge with defaults
export const config = { ...DEFAULT_CONFIG, ...userConfig };
```

### 6. CI/CD Pipeline

#### GitHub Actions Workflow

```yaml
name: Build Binaries

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build:
    strategy:
      matrix:
        platform: [linux-x64, linux-arm64, darwin-x64, darwin-arm64, windows-x64]
        include:
          - platform: linux-x64
            runner: ubuntu-latest
            target: bun-linux-x64
          - platform: darwin-arm64
            runner: macos-latest
            target: bun-darwin-arm64
          # ... other platforms

    runs-on: ${{ matrix.runner }}
    steps:
      - uses: actions/checkout@v4

      - name: Install Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Generate embedded assets
        run: bun run build:assets

      - name: Build binary
        run: bun run build:binary:${{ matrix.platform }}

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: tabminal-${{ matrix.platform }}
          path: dist/tabminal*

  release:
    needs: build
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/')
    steps:
      - uses: actions/download-artifact@v4
        with:
          path: artifacts/

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: artifacts/**/*
```

### 7. Shell Tools Handling

#### Current Issue: shell/ directory contains shell integration scripts

#### Solutions:

**Option 1: Embed as Assets**
- Add shell scripts to embedded assets
- Extract to temp directory on first run
- Cache extracted location

**Option 2: Inline in JavaScript**
- Convert shell scripts to JavaScript equivalents
- Remove dependency on shell scripts entirely

**Option 3: Require shell/ directory even for binary**
- Document that binary must be run with shell/ in same directory
- Simple but less "single binary" feel

**Decision**: Option 1 (Embed and Extract) - maintains single-file experience while preserving shell functionality.

```javascript
// src/shell-tools.mjs (new)
import { SHELL_SCRIPTS } from './assets/shell-scripts.mjs'; // Embedded
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

let extractedPath = null;

export function ensureShellTools() {
  if (extractedPath && fs.existsSync(extractedPath)) {
    return extractedPath;
  }

  // Extract to temp directory
  extractedPath = path.join(os.tmpdir(), `tabminal-shell-${process.pid}`);
  fs.mkdirSync(extractedPath, { recursive: true });

  for (const [name, content] of Object.entries(SHELL_SCRIPTS)) {
    fs.writeFileSync(path.join(extractedPath, name), content, { mode: 0o755 });
  }

  return extractedPath;
}
```

### 8. bun-pty Compatibility

#### Current Implementation
```javascript
import { spawn as pty } from 'bun-pty';
const ptyProcess = pty(shell, args, options);
```

#### Expected Behavior with `--compile`
- bun-pty uses FFI to call native PTY functions
- Bun's `--compile` should handle FFI correctly
- May need to ensure bun-pty is not marked as external

#### Testing Strategy
1. Compile simple test program using bun-pty
2. Run on target platforms
3. Verify PTY creation, data flow, and cleanup
4. Test shell integration (bash, zsh)

### 9. Development Workflow

#### Local Testing
```bash
# Run from source (dev)
bun run dev

# Build and test local binary
bun run build:binary
./dist/tabminal --version
./dist/tabminal start

# Clean up
rm -rf dist/
```

#### Build Scripts
```javascript
// build-binary.mjs
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
  const outputFile = `dist/tabminal-${target}`;

  console.log(`Building for ${target} (${bunTarget})...`);

  await $`bun build src/server.mjs --compile --outfile ${outputFile} --target ${bunTarget}`;

  console.log(`✅ Built: ${outputFile}`);
}

// CLI parsing
const args = process.argv.slice(2);
if (args.includes('--all')) {
  for (const target of Object.keys(TARGETS)) {
    await build(target);
  }
} else if (args.includes('--target')) {
  const targetIdx = args.indexOf('--target');
  await build(args[targetIdx + 1]);
} else {
  // Build for current platform
  const platform = `${process.platform}-${process.arch}`;
  const normalizedTarget = platform.replace('x86_64', 'x64').replace('arm64', 'arm64');
  await build(normalizedTarget);
}
```

## Migration Path

### Phase 1: Basic Compilation (Days 1-2)
- [ ] Test simple Bun compile with current codebase
- [ ] Identify issues (assets, paths, etc.)
- [ ] Create basic build script
- [ ] Verify binary runs on development machine

### Phase 2: Asset Bundling (Days 3-4)
- [ ] Implement asset embedding script
- [ ] Modify server to use embedded assets
- [ ] Test all static file serving
- [ ] Handle shell tools embedding

### Phase 3: Multi-Platform (Days 5-6)
- [ ] Add cross-compile support
- [ ] Test on multiple platforms (or use CI)
- [ ] Refine build scripts
- [ ] Add platform-specific tweaks if needed

### Phase 4: CI/CD (Day 7)
- [ ] Create GitHub Actions workflow
- [ ] Test automated builds
- [ ] Set up artifact generation
- [ ] Configure release automation

### Phase 5: Documentation & Release (Day 8)
- [ ] Update README with binary instructions
- [ ] Add troubleshooting guide
- [ ] Document build process for contributors
- [ ] Create first release with binaries

## Rollback Plan

If compilation fails or has critical issues:
1. Continue source distribution alongside binaries
2. Document known limitations of binary version
3. Provide clear migration instructions back to source
4. Revert package.json scripts to source-based

## Testing Strategy

### Unit Tests
- Asset embedding and serving
- Path resolution logic
- Shell tools extraction

### Integration Tests
- Full binary startup sequence
- Terminal session creation
- Static file serving
- Configuration loading
- Session persistence

### Platform Tests
- Test on Linux x64
- Test on macOS Apple Silicon
- Test on Windows (if possible)
- Verify size < 100MB

## Performance Considerations

### Binary Size
- Expected: 50-90MB per platform
- Bun runtime: ~30MB
- Application code: ~5-10MB
- Dependencies: ~10-20MB
- Embedded assets: ~5-10MB

### Startup Time
- Slightly slower than source (due to extraction)
- Target: < 1 second cold start
- Warm start should be comparable

### Runtime Performance
- Should be identical to source version
- Bun runtime performance unchanged
- No JIT impact from compilation

## Future Enhancements (Out of Scope for This Proposal)

1. **Auto-updater**: Check for new versions and download
2. **Code signing**: Reduce security warnings
3. **UPX compression**: Further reduce binary size
4. **Installation scripts**: Add to system PATH automatically
5. **Package manager distribution**: Homebrew, npm, apt, etc.
