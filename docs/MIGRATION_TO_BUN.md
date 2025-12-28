# Migration Guide: Node.js to Bun

This guide explains the migration from Node.js runtime to Bun runtime in Tabminal v2.0.0.

## Overview

Tabminal v2.0.0 and later require **Bun >= 1.0.0** runtime instead of Node.js. This change brings significant performance improvements and better developer experience.

## Breaking Changes

### 1. Runtime Requirement
**Before**: Node.js >= 22.0.0  
**After**: Bun >= 1.0.0

### 2. PTY Library
**Before**: `node-pty` (native C++ addon)  
**After**: `bun-pty` (Rust-based via FFI)

### 3. Installation Commands
**Before**:
```bash
npm install
npm start
node src/server.mjs
```

**After**:
```bash
bun install
bun start
bun src/server.mjs
```

## Migration Steps

### For Existing Installations

If you have Tabminal v1.x installed:

1. **Backup your data**:
```bash
tar -czf tabminal-backup-$(date +%Y%m%d).tar.gz ~/.tabminal/
```

2. **Remove old installation**:
```bash
# Stop service if running
sudo systemctl stop tabminal

# Remove project directory
rm -rf /path/to/tabminal
```

3. **Install new version**:
```bash
# Clone latest version
git clone https://github.com/leask/tabminal.git
cd tabminal

# Run installation script
bash scripts/install.sh
```

4. **Restore data** (optional):
```bash
# If you want to keep your old sessions
tar -xzf tabminal-backup-YYYYMMDD.tar.gz -C ~/
```

## API Changes

### PTY Library

The `bun-pty` library provides an API compatible with `node-pty`:

| Feature | node-pty | bun-pty | Notes |
|---------|-----------|----------|-------|
| Import | `import pty from 'node-pty'` | `import { spawn as pty } from 'bun-pty'` | ✅ Compatible with alias |
| Create | `pty.spawn()` | `pty()` | ✅ Same API |
| Data Event | `pty.onData()` | `pty.onData()` | ✅ Same API |
| Exit Event | `pty.onExit()` | `pty.onExit()` | ✅ Same API |
| Write | `pty.write()` | `pty.write()` | ✅ Same API |
| Resize | `pty.resize()` | `pty.resize()` | ✅ Same API |
| Kill | `pty.kill(signal)` | `pty.kill()` | ⚠️ No signal parameter |
| PID | `pty.pid` | `pty.pid` | ✅ Same property |

### Event Subscription Cleanup

The `bun-pty` library returns disposable objects for event subscriptions:

**Before**:
```javascript
const pty = spawn('bash', [], options);
// Event handlers persist until PTY exits
pty.onData((data) => {
    console.log(data);
});
```

**After**:
```javascript
const pty = spawn('bash', [], options);
// Event handlers return disposable for cleanup
const subscription = pty.onData((data) => {
    console.log(data);
});

// Clean up when done
subscription.dispose();
```

## Performance Improvements

Bun runtime provides significant performance gains:

- **Startup Time**: Up to 10x faster
- **HTTP Requests**: 2-3x faster throughput
- **File I/O**: 2-4x faster
- **Memory Usage**: Reduced by ~30%
- **Package Installation**: 10-20x faster

## Troubleshooting

### bun-pty Not Found

If you encounter errors about `bun-pty`:

1. Reinstall dependencies:
```bash
rm -rf node_modules bun.lock
bun install
```

2. Verify installation:
```bash
ls node_modules/bun-pty
```

### Systemd Service Issues

If the systemd service fails to start:

1. Check logs:
```bash
sudo journalctl -u tabminal -n 50
```

2. Verify Bun is in PATH:
```bash
which bun
# Should output: /home/youruser/.bun/bin/bun or /usr/local/bin/bun
```

3. Reload systemd daemon:
```bash
sudo systemctl daemon-reload
sudo systemctl restart tabminal
```

### Permission Errors

If you see permission errors:

1. Ensure the service runs as the correct user:
```bash
grep "^User=" /etc/systemd/system/tabminal.service
```

2. Check file ownership:
```bash
ls -la ~/.tabminal/
```

## Rollback Plan

If you encounter issues and need to rollback:

1. Checkout previous version:
```bash
git checkout v1.1.21
```

2. Reinstall with Node.js:
```bash
npm install
npm start
```

## Getting Help

- **GitHub Issues**: https://github.com/leask/tabminal/issues
- **Documentation**: https://github.com/leask/tabminal#readme
- **Bun Docs**: https://bun.sh/docs

## Changelog

See the [CHANGELOG.md](./CHANGELOG.md) for detailed changes between versions.
