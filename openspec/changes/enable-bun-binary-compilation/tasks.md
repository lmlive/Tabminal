# Tasks: Enable Bun Binary Compilation

This document breaks down the work into small, verifiable tasks that deliver user-visible progress.

## Phase 1: Foundation and Validation (Priority: High)

### 1.1 Validate Bun Compile with Current Codebase
- [x] Create minimal test build: `bun build --compile src/server.mjs --outfile dist/test-binary`
- [x] Run binary and verify it starts without errors
- [x] Identify any immediate compilation errors
- [x] Document issues found (e.g., missing dependencies, path issues)
- **Validation**: Binary runs and prints startup logs without crashing

### 1.2 Test bun-pty Compatibility
- [x] Create simple test script that uses bun-pty
- [x] Compile test script with `--compile`
- [x] Run compiled test and verify PTY creation works
- [x] Test PTY data flow (write to PTY, read output)
- [x] Test PTY cleanup (onExit)
- **Validation**: Compiled binary can create and manage PTY sessions

### 1.3 Create Build Script Structure
- [x] Create `build-binary.mjs` script with basic CLI parsing
- [x] Add support for `--target` flag
- [x] Add support for `--all` flag for all platforms
- [x] Add verbose logging for build process
- [x] Test build script locally
- **Validation**: `bun run build:binary` produces working binary for current platform

### 1.4 Update package.json Scripts
- [x] Add `"build:binary": "bun run build-binary.mjs"`
- [x] Add `"build:binary:linux": "bun run build-binary.mjs --target linux-x64"`
- [x] Add `"build:binary:macos": "bun run build-binary.mjs --target darwin-arm64"`
- [x] Add `"build:binary:windows": "bun run build-binary.mjs --target windows-x64"`
- [x] Add `"build:binary:all": "bun run build-binary.mjs --all"`
- [x] Test all scripts work correctly
- **Validation**: All npm scripts execute successfully

## Phase 2: Static Asset Bundling (Priority: High)

### 2.1 Create Asset Embedding Script
- [x] Create `build-assets.mjs` script
- [x] Read all files from `public/` directory
- [x] Convert files to JavaScript export object (Base64 strings or UTF-8)
- [x] Write generated file to `src/assets/generated.mjs`
- [x] Test generation produces valid JavaScript
- **Validation**: Generated file compiles and exports all assets correctly

### 2.2 Update Server to Use Embedded Assets
- [x] Modify `src/server.mjs` to import generated assets
- [x] Create middleware to serve assets from memory
- [x] Set correct Content-Type headers for different file types
- [x] Fall back to filesystem for dev mode
- [x] Test serving each file type (HTML, CSS, JS, SVG, fonts)
- **Validation**: All static files accessible from running binary

### 2.3 Handle Shell Tools Directory
- [x] Create `src/assets/shell-scripts.mjs` to embed shell tools
- [x] Copy all files from `shell/` directory into generated assets
- [x] Create function to extract shell tools to temp directory on first run
- [x] Modify `TerminalManager.createSession()` to use extracted shell tools
- [x] Test shell integration works with extracted tools
- **Validation**: Terminal sessions use shell tools correctly from embedded assets

### 2.4 Update Build Process
- [x] Modify `build-binary.mjs` to call `build-assets.mjs` first
- [x] Ensure generated assets are compiled into binary
- [x] Clean up generated files after build (optional)
- [x] Test full build process produces working binary
- **Validation**: Binary includes all static assets and shell tools

## Phase 3: Path Resolution and Configuration (Priority: High)

### 3.1 Implement Runtime Detection
- [x] Create `src/utils/is-compiled.mjs` helper
- [x] Detect if running from compiled binary
- [x] Export boolean flag for use in other modules
- [x] Test detection works for both source and binary
- **Validation**: Detection accurately identifies binary vs source execution

### 3.2 Fix Path Resolution
- [x] Update `src/server.mjs` to use correct public directory path
- [x] Update `src/terminal-manager.mjs` to resolve shell tools correctly
- [x] Update `src/config.mjs` to resolve config file location
- [x] Test all path resolutions work in both modes
- **Validation**: All file paths resolve correctly in binary mode

### 3.3 Test Configuration Loading
- [x] Verify binary can read/write `~/.tabminal/config.json`
- [x] Test environment variables are still respected
- [x] Test config file overrides defaults correctly
- [x] Test config migrations work in binary
- **Validation**: Configuration works identically between source and binary

### 3.4 Test Session Persistence
- [x] Verify binary can write to `~/.tabminal/sessions/`
- [x] Test session creation and saving
- [x] Test session restoration on restart
- [x] Test session log files are written correctly
- **Validation**: Session persistence works in binary mode

## Phase 4: Multi-Platform Support (Priority: Medium)

### 4.1 Add Platform-Specific Build Targets
- [ ] Define all target platforms (linux-x64, linux-arm64, darwin-x64, darwin-arm64, windows-x64)
- [ ] Add platform detection logic to build script
- [ ] Test building for current platform (different from development platform)
- [ ] Document cross-compilation limitations
- **Validation**: Build script handles all platform targets

### 4.2 Create Cross-Platform Build Testing
- [ ] Set up GitHub Actions workflow (draft)
- [ ] Add job matrix for all platforms
- [ ] Add steps to install Bun and dependencies
- [ ] Add build step for each platform
- [ ] Add artifact upload step
- **Validation**: CI workflow runs successfully (may need actual runners for some platforms)

### 4.3 Add Platform-Specific Tweaks (If Needed)
- [ ] Research platform-specific Bun compile issues
- [ ] Add any necessary workarounds for each platform
- [ ] Test binaries on available platforms (Linux, macOS)
- [ ] Document any platform limitations
- **Validation**: Binaries work correctly on all supported platforms

## Phase 5: Documentation (Priority: Medium)

### 5.1 Update README
- [ ] Add section on binary distribution
- [ ] Add download instructions for each platform
- [ ] Add "Running the Binary" subsection
- [ ] Add "Troubleshooting" subsection for binary issues
- [ ] Update prerequisites section (remove Bun requirement for binary users)
- **Validation**: README clearly explains how to use pre-built binaries

### 5.2 Create Binary Usage Guide
- [ ] Create `docs/BINARY_USAGE.md`
- [ ] Document installation (download, make executable, run)
- [ ] Document configuration (still uses ~/.tabminal)
- [ ] Document common issues and solutions
- [ ] Add comparison table: Source vs Binary
- **Validation**: Guide provides complete information for binary users

### 5.3 Update Installation Script
- [ ] Update `scripts/install.sh` to optionally download binary
- [ ] Add flag `--binary` to use pre-built binary
- [ ] Fall back to source installation if binary download fails
- [ ] Test installation script with binary flag
- **Validation**: Installation script can set up binary distribution

### 5.4 Document Build Process for Contributors
- [ ] Create `docs/BUILDING_BINARIES.md`
- [ ] Document prerequisites (Bun, platform tools)
- [ ] Document build commands
- [ ] Document cross-compilation setup
- [ ] Document CI/CD process
- **Validation**: Contributors can build binaries from source

## Phase 6: Testing and Validation (Priority: High)

### 6.1 Create Automated Test Suite
- [ ] Create `test/binary-integration.mjs`
- [ ] Test binary startup and health check
- [ ] Test WebSocket connection
- [ ] Test terminal session creation
- [ ] Test static file serving
- [ ] Test configuration and persistence
- **Validation**: All integration tests pass for binary

### 6.2 Manual Testing Checklist
- [ ] Test on Linux x64 (if available)
- [ ] Test on macOS ARM64 (if available)
- [ ] Test terminal functionality (type commands, see output)
- [ ] Test system monitoring
- [ ] Test file browser
- [ ] Test AI assistant (if configured)
- [ ] Test session persistence across restarts
- [ ] Test configuration changes
- **Validation**: All features work correctly in binary

### 6.3 Performance Benchmarking
- [ ] Measure binary startup time
- [ ] Compare with source startup time
- [ ] Measure binary file size for each platform
- [ ] Measure memory usage
- [ ] Document performance characteristics
- **Validation**: Performance meets acceptance criteria (< 1s startup, < 100MB size)

## Phase 7: Release Preparation (Priority: Medium)

### 7.1 Create GitHub Actions Workflow
- [ ] Finalize `.github/workflows/release.yml`
- [ ] Add triggers (tag push, manual)
- [ ] Configure job matrix for all platforms
- [ ] Add automated testing step after build
- [ ] Add release artifact generation
- **Validation**: Workflow builds and uploads all binaries

### 7.2 Configure Release Automation
- [ ] Set up automatic GitHub release on tag push
- [ ] Add release notes generation
- [ ] Attach binaries to release
- [ ] Test release workflow with draft release
- **Validation**: Release creates properly formatted GitHub release

### 7.3 Prepare for First Release
- [ ] Determine version number (v2.1.0 or similar)
- [ ] Write release notes (new features, changes, known issues)
- [ ] Verify all binaries build successfully
- [ ] Test at least one platform binary end-to-end
- **Validation**: Ready to publish first binary release

## Phase 8: Post-Release Support (Priority: Low)

### 8.1 Monitor Issues
- [ ] Watch for binary-specific issues on GitHub
- [ ] Categorize issues by platform
- [ ] Respond to user reports promptly
- [ ] Create tracking label for binary issues
- **Validation**: Issue tracking established

### 8.2 Iterate and Improve
- [ ] Collect user feedback on binary distribution
- [ ] Identify common pain points
- [ ] Plan improvements for next version
- [ ] Update documentation based on feedback
- **Validation**: Continuous improvement process in place

### 8.3 Explore Enhancements (Future)
- [ ] Investigate UPX compression for smaller binaries
- [ ] Research code signing options
- [ ] Explore auto-updater implementation
- [ ] Consider package manager distribution (brew, apt, etc.)
- **Validation**: Enhancement backlog maintained

## Task Dependencies

```
Phase 1 (Foundation)
  ├─ 1.1 → 1.2
  ├─ 1.2 → 1.3
  └─ 1.3 → 1.4

Phase 2 (Asset Bundling)
  ├─ 1.4 → 2.1
  ├─ 2.1 → 2.2
  ├─ 2.1 → 2.3
  ├─ 2.2 → 2.4
  └─ 2.3 → 2.4

Phase 3 (Path Resolution)
  ├─ 2.4 → 3.1
  ├─ 3.1 → 3.2
  ├─ 3.2 → 3.3
  └─ 3.2 → 3.4

Phase 4 (Multi-Platform)
  ├─ 1.4 → 4.1
  ├─ 4.1 → 4.2
  └─ 4.2 → 4.3

Phase 5 (Documentation)
  ├─ 3.4 → 5.1
  ├─ 5.1 → 5.2
  ├─ 5.2 → 5.3
  └─ 4.3 → 5.4

Phase 6 (Testing)
  ├─ 3.4 → 6.1
  ├─ 4.3 → 6.2
  └─ 6.2 → 6.3

Phase 7 (Release)
  ├─ 4.3 → 7.1
  ├─ 6.1 → 7.2
  └─ 7.1 → 7.3

Phase 8 (Post-Release)
  └─ 7.3 → 8.1
```

## Parallelizable Tasks

These tasks can be worked on in parallel by different contributors:

- **Can run in parallel**:
  - 2.2 (Server update) and 2.3 (Shell tools)
  - 3.3 (Config testing) and 3.4 (Session testing)
  - 5.1 (README) and 5.2 (Usage guide) and 5.3 (Install script)
  - 6.2 (Manual testing) and 6.3 (Benchmarking)

- **Sequential dependencies**:
  - All Phase 1 tasks (in order)
  - Asset generation (2.1) must complete before asset usage (2.2, 2.3)
  - Build process (2.4) must complete before path resolution (3.x)
  - Multi-platform builds (4.x) before CI/CD (7.x)

## Estimated Timeline

| Phase | Tasks | Estimated Time | Priority |
|-------|-------|----------------|----------|
| Phase 1 | 1.1-1.4 | 0.5 days | High |
| Phase 2 | 2.1-2.4 | 1.5 days | High |
| Phase 3 | 3.1-3.4 | 0.5 days | High |
| Phase 4 | 4.1-4.3 | 1 day | Medium |
| Phase 5 | 5.1-5.4 | 0.5 days | Medium |
| Phase 6 | 6.1-6.3 | 0.5 days | High |
| Phase 7 | 7.1-7.3 | 0.5 days | Medium |
| Phase 8 | 8.1-8.3 | Ongoing | Low |

**Total**: 5-6 days for core implementation, with ongoing post-release support
