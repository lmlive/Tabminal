# Binary Usage Guide

## Overview

Tabminal can be distributed as standalone binary executables using Bun's `--compile` feature. This allows users to run Tabminal without requiring Bun runtime pre-installed.

## Building Binaries

### Build for Current Platform

```bash
npm run build:binary
```

### Build for Specific Platforms

```bash
npm run build:binary:linux       # Linux x64
npm run build:binary:macos       # macOS ARM64
npm run build:binary:windows     # Windows x64
```

### Build for All Platforms

```bash
npm run build:binary:all
```

## Built Binaries

Binaries are placed in the `dist/` directory:

- `dist/tabminal-linux-x64` - Linux 64-bit
- `dist/tabminal-linux-arm64` - Linux ARM64
- `dist/tabminal-darwin-x64` - macOS Intel
- `dist/tabminal-darwin-arm64` - macOS Apple Silicon
- `dist/tabminal-windows-x64.exe` - Windows 64-bit

## Running the Binary

### Linux/macOS

```bash
# Make executable
chmod +x dist/tabminal-linux-x64

# Run with default settings
./dist/tabminal-linux-x64 -y

# Run with custom host
./dist/tabminal-linux-x64 -y --host 0.0.0.0
```

### Windows

```powershell
# Run directly
.\tabminal-windows-x64.exe -y

# Run with custom host
.\tabminal-windows-x64.exe -y --host 0.0.0.0
```

## Command Line Options

All CLI options work with the binary just like source version:

- `-y, --accept-terms` - Accept security warning
- `-p, --port <port>` - Set port (default: 9848)
- `-a, --passwd <password>` - Set password
- `-h, --host <host>` - Bind host (default: 127.0.0.1)

## Configuration

The binary uses the same configuration as the source version:

- Config file: `~/.tabminal/config.json`
- Sessions: `~/.tabminal/sessions/`
- Environment variables: `TABMINAL_*` prefix

## Embedded Assets

The binary includes:

- **Static Files**: All files from `public/` directory (HTML, CSS, JS, fonts, icons)
- **Shell Tools**: Terminal scripts from `shell/` directory (extracted to temp directory at runtime)

### How Assets Are Handled

1. **Development Mode** (running from source):
   - Assets are served from `public/` directory on filesystem
   - Shell tools are used from `shell/` directory

2. **Binary Mode** (running from compiled binary):
   - Assets are embedded in binary and served from memory
   - Shell tools are extracted to temp directory on first use

## Performance

- **Binary Size**: ~103MB (includes Bun runtime)
- **Startup Time**: ~0.3-0.5 seconds
- **Memory Usage**: ~170-200MB (similar to source version)
- **Runtime Performance**: Identical to source version

## Security Notes

- Binary includes full Bun runtime (~30MB)
- No Bun installation required on target system
- Keep binary updated for security patches
- Do not expose to public internet without secure tunnel

## Troubleshooting

### Binary Won't Start

1. **Check Permissions**: Ensure executable bit is set (Linux/macOS)
   ```bash
   chmod +x tabminal-linux-x64
   ```

2. **Check Dependencies**: Binary has no external dependencies
   - Only requires system to support PTY (pseudo-terminal)
   - Works on most Linux/macOS systems

3. **Check Logs**: Binary outputs detailed logs
   - PTY creation logs
   - Shell tool extraction logs
   - Server startup logs

### Assets Not Loading

- Check browser console for errors
- Verify binary was built with `npm run build:binary`
- Look for "[Server] Using embedded assets" message in logs

### Shell Integration Issues

- Check for "[ShellTools] Extracted to:" message in logs
- Verify temp directory has write permissions
- Shell tools are extracted to `/tmp/tabminal-shell-<pid>/`

## Source vs Binary

| Feature | Source | Binary |
|---------|--------|--------|
| Runtime | Bun required | Bun embedded |
| Distribution | Git clone/npm | Single file download |
| Installation | `bun install && bun start` | Download and run |
| Configuration | Same (`~/.tabminal/`) | Same (`~/.tabminal/`) |
| Updates | Git pull | Download new binary |
| Size | ~5-10MB | ~103MB |
| Portability | Needs Bun | Standalone |

## Developer Notes

### Rebuilding Assets

Assets are automatically generated during binary build:

```bash
# Generate assets only (for testing)
npm run build:assets

# Build with assets
npm run build:binary
```

### Checking Embedded Assets

```javascript
import { ASSETS } from './src/assets/generated.mjs';
console.log('Embedded files:', Object.keys(ASSETS));
```

### Runtime Detection

```javascript
import { isCompiled } from './src/utils/is-compiled.mjs';

if (isCompiled) {
    console.log('Running from binary');
} else {
    console.log('Running from source');
}
```

## Migration from Source to Binary

No migration needed! Binary uses:

- Same configuration file location
- Same session storage location
- Same data format

Simply:

1. Stop source version
2. Run binary version
3. Existing data is automatically used
