# Proposal: Enable Bun Binary Compilation

## Summary

Enable Tabminal to be compiled into standalone binary executables using Bun's `--compile` feature. This allows users to run Tabminal without requiring Bun runtime pre-installed, simplifying distribution and deployment.

## Motivation

### Current State
- Tabminal requires Bun runtime >= 1.0.0 to be installed
- Users must install Bun before using Tabminal
- Distribution requires providing source code and installation instructions
- Deployment to production requires setting up Bun environment

### Problems
1. **User Friction**: Users need to install Bun runtime before using Tabminal
2. **Distribution Complexity**: Cannot provide simple "download and run" binaries
3. **Deployment Overhead**: Each deployment target requires Bun installation
4. **Version Conflicts**: Bun versions may vary across environments

### Goals
1. **Zero Runtime Dependency**: Users run a single binary without installing Bun
2. **Simplified Distribution**: Provide pre-built binaries for common platforms
3. **Consistent Environment**: Binary includes exact Bun runtime version
4. **Faster Deployment**: Single file deployment instead of environment setup

## Proposed Solution

Leverage Bun's `--compile` flag to bundle Tabminal into standalone executables that include:
- The Bun runtime
- All application code (JavaScript/TypeScript)
- All dependencies (including bun-pty)
- Static assets (public/ directory)
- Configuration templates

### Key Changes

1. **Build System Enhancement**
   - Add `bun build --compile` commands to package.json scripts
   - Create multi-platform build scripts (Linux, macOS, Windows)
   - Implement static asset bundling for public/ directory

2. **Asset Management**
   - Embed static assets into binary during build
   - Update server code to serve assets from embedded bundle
   - Ensure public/ files are included in compiled binary

3. **Configuration Handling**
   - Include default config in binary
   - Support external config file overrides
   - Maintain ~/.tabminal directory for runtime data

4. **Distribution**
   - Add GitHub Actions workflow for automated builds
   - Generate binaries for common platforms (linux-amd64, darwin-arm64, windows-x64)
   - Upload binaries to GitHub Releases

## Scope

### In Scope
- Bun binary compilation configuration
- Static asset bundling (public/ directory)
- Multi-platform build scripts
- GitHub Actions CI/CD for automated builds
- Documentation for binary usage

### Out of Scope
- Package manager distribution (npm, brew, apt, etc.)
- Code signing and security features
- Docker image optimization
- Auto-update mechanisms

## Alternatives Considered

### Alternative 1: Node.js pkg (Rejected)
- **Pros**: Well-established, works with Node.js
- **Cons**: Doesn't support Bun, incompatible with bun-pty, larger binaries
- **Decision**: Not compatible with Bun runtime

### Alternative 2: Docker Image (Not Primary)
- **Pros**: Consistent environment, easy deployment
- **Cons**: Requires Docker runtime, larger than binary, not "download and run"
- **Decision**: Complementary but not primary distribution method

### Alternative 3: Bun Bundle Only (Rejected)
- **Pros**: Simpler than full binary
- **Cons**: Still requires Bun runtime, doesn't solve main problem
- **Decision**: Doesn't meet zero-runtime-dependency goal

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| bun-pty compatibility with compile | Medium | High | Test early, may need patches |
| Large binary size (50-90MB) | High | Low | Document expected size, provide download links |
| Static asset serving issues | Medium | Medium | Thorough testing of asset loading |
| Platform-specific bugs | Medium | Medium | Test on all target platforms |
| Slower startup than source | Low | Low | Benchmark and document performance |

## Success Criteria

1. ✅ Binary runs without Bun installed on target system
2. ✅ All static assets (public/) accessible from binary
3. ✅ Terminal functionality works identically to source version
4. ✅ Configuration and persistence work correctly
5. ✅ Binaries built for Linux, macOS, Windows
6. ✅ Binary size < 100MB per platform
7. ✅ No code changes required for users switching from source to binary

## Related Work

- Already using bun-pty instead of node-pty
- Bun migration completed (v2.0.0)
- Static files currently served from public/ directory
- Systemd service scripts exist for source-based installation

## Open Questions

1. Should we include shell/ directory scripts in the binary? (Probably yes for functionality)
2. How to handle external config file path resolution when running as binary? (Use process.execPath or similar)
3. Should we provide both source and binary distribution channels? (Yes, maintain both)

## Timeline Estimate

- Phase 1: Basic compile setup and testing (2-3 days)
- Phase 2: Asset bundling and validation (1-2 days)
- Phase 3: Multi-platform build scripts (1 day)
- Phase 4: CI/CD automation (1 day)
- Phase 5: Documentation and release (1 day)

**Total**: 6-8 days
