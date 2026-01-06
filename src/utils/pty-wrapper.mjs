import { dlopen, FFIType, ptr } from "bun:ffi";
import { Buffer } from "buffer";
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { writeFileSync, existsSync, unlinkSync, mkdirSync } from 'node:fs';
import process from 'node:process';

class EventEmitter {
  listeners = [];
  event = (listener) => {
    this.listeners.push(listener);
    return {
      dispose: () => {
        const i = this.listeners.indexOf(listener);
        if (i !== -1) {
          this.listeners.splice(i, 1);
        }
      }
    };
  };
  fire(data) {
    for (const listener of this.listeners) {
      listener(data);
    }
  }
}

const DEFAULT_COLS = 80;
const DEFAULT_ROWS = 24;
const DEFAULT_FILE = "sh";
const DEFAULT_NAME = "xterm";

function shQuote(s) {
  if (s.length === 0)
    return "''";
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

// Function to get the embedded library path
function getEmbeddedLibPath() {
  // Determine the library filename based on platform
  let libFileName;
  const { platform, arch } = process;
  
  if (platform === 'darwin') {
    libFileName = arch === 'arm64' ? 'librust_pty_arm64.dylib' : 'librust_pty.dylib';
  } else if (platform === 'win32') {
    libFileName = 'rust_pty.dll';
  } else { // linux
    libFileName = arch === 'arm64' ? 'librust_pty_arm64.so' : 'librust_pty.so';
  }
  
  // Look for the embedded library in the same directory as the executable
  const execDir = dirname(process.execPath);
  const embeddedLibPath = join(execDir, libFileName);
  
  return embeddedLibPath;
}

// Try to load the embedded library first, then fall back to the original bun-pty behavior
function resolveLibPath() {
  // First, try to use the embedded library (in the same directory as the executable)
  const embeddedLibPath = getEmbeddedLibPath();
  if (existsSync(embeddedLibPath)) {
    console.log(`[PTY Wrapper] Using embedded library: ${embeddedLibPath}`);
    return embeddedLibPath;
  }
  
  // If no embedded library, fall back to original bun-pty behavior
  const env = process.env.BUN_PTY_LIB;
  if (env && existsSync(env))
    return env;
    
  const platform = process.platform;
  const arch = process.arch;
  const filenames = platform === "darwin" ? arch === "arm64" ? ["librust_pty_arm64.dylib", "librust_pty.dylib"] : ["librust_pty.dylib"] : platform === "win32" ? ["rust_pty.dll"] : arch === "arm64" ? ["librust_pty_arm64.so", "librust_pty.so"] : ["librust_pty.so"];
  const base = import.meta.url;
  const fileDir = dirname(new URL(base).pathname);
  const dirName = fileDir.split('/').pop();
  const here = dirName === "src" || dirName === "dist" ? dirname(fileDir) : fileDir;
  const basePaths = [
    join(here, "rust-pty", "target", "release"),
    join(here, "..", "bun-pty", "rust-pty", "target", "release"),
    join(process.cwd(), "node_modules", "bun-pty", "rust-pty", "target", "release")
  ];
  const fallbackPaths = [];
  for (const basePath of basePaths) {
    for (const filename of filenames) {
      fallbackPaths.push(join(basePath, filename));
    }
  }
  for (const path of fallbackPaths) {
    if (existsSync(path))
      return path;
  }
  throw new Error(`librust_pty shared library not found.
Checked:
  - BUN_PTY_LIB=${env ?? "<unset>"}
  - Embedded path: ${embeddedLibPath}
  - ${fallbackPaths.join(`
  - `)}

Set BUN_PTY_LIB or ensure one of these paths contains the file.`);
}

class Terminal {
  handle = -1;
  _pid = -1;
  _cols = DEFAULT_COLS;
  _rows = DEFAULT_ROWS;
  _name = DEFAULT_NAME;
  _readLoop = false;
  _closing = false;
  _onData = new EventEmitter;
  _onExit = new EventEmitter;
  constructor(file = DEFAULT_FILE, args = [], opts = { name: DEFAULT_NAME }) {
    const libPath = resolveLibPath();
    let lib;
    
    try {
      lib = dlopen(libPath, {
        bun_pty_spawn: {
          args: [FFIType.cstring, FFIType.cstring, FFIType.cstring, FFIType.i32, FFIType.i32],
          returns: FFIType.i32
        },
        bun_pty_write: {
          args: [FFIType.i32, FFIType.pointer, FFIType.i32],
          returns: FFIType.i32
        },
        bun_pty_read: {
          args: [FFIType.i32, FFIType.pointer, FFIType.i32],
          returns: FFIType.i32
        },
        bun_pty_resize: {
          args: [FFIType.i32, FFIType.i32, FFIType.i32],
          returns: FFIType.i32
        },
        bun_pty_kill: { args: [FFIType.i32], returns: FFIType.i32 },
        bun_pty_get_pid: { args: [FFIType.i32], returns: FFIType.i32 },
        bun_pty_get_exit_code: { args: [FFIType.i32], returns: FFIType.i32 },
        bun_pty_close: { args: [FFIType.i32], returns: FFIType.void }
      });
    } catch (error) {
      console.error("Failed to load lib", error);
      throw error;
    }

    this._cols = opts.cols ?? DEFAULT_COLS;
    this._rows = opts.rows ?? DEFAULT_ROWS;
    const cwd = opts.cwd ?? process.cwd();
    const cmdline = [file, ...args.map(shQuote)].join(" ");
    let envStr = "";
    if (opts.env) {
      const envPairs = Object.entries(opts.env).map(([k, v]) => `${k}=${v}`);
      envStr = envPairs.join("\x00") + "\x00";
    }
    this.handle = lib.symbols.bun_pty_spawn(Buffer.from(`${cmdline}\x00`, "utf8"), Buffer.from(`${cwd}\x00`, "utf8"), Buffer.from(`${envStr}\x00`, "utf8"), this._cols, this._rows);
    if (this.handle < 0)
      throw new Error("PTY spawn failed");
    this._pid = lib.symbols.bun_pty_get_pid(this.handle);
    this._startReadLoop();
  }
  get pid() {
    return this._pid;
  }
  get cols() {
    return this._cols;
  }
  get rows() {
    return this._rows;
  }
  get process() {
    return "shell";
  }
  get onData() {
    return this._onData.event;
  }
  get onExit() {
    return this._onExit.event;
  }
  write(data) {
    if (this._closing)
      return;
    const buf = Buffer.from(data, "utf8");
    lib.symbols.bun_pty_write(this.handle, ptr(buf), buf.length);
  }
  resize(cols, rows) {
    if (this._closing)
      return;
    this._cols = cols;
    this._rows = rows;
    lib.symbols.bun_pty_resize(this.handle, cols, rows);
  }
  kill(signal = "SIGTERM") {
    if (this._closing)
      return;
    this._closing = true;
    lib.symbols.bun_pty_kill(this.handle);
    lib.symbols.bun_pty_close(this.handle);
    this._onExit.fire({ exitCode: 0, signal });
  }
  async _startReadLoop() {
    if (this._readLoop)
      return;
    this._readLoop = true;
    const buf = Buffer.allocUnsafe(4096);
    while (this._readLoop && !this._closing) {
      const n = lib.symbols.bun_pty_read(this.handle, ptr(buf), buf.length);
      if (n > 0) {
        this._onData.fire(buf.subarray(0, n).toString("utf8"));
      } else if (n === -2) {
        const exitCode = lib.symbols.bun_pty_get_exit_code(this.handle);
        this._onExit.fire({ exitCode });
        break;
      } else if (n < 0) {
        break;
      } else {
        await new Promise((r) => setTimeout(r, 8));
      }
    }
  }
}

function spawn(file, args, options) {
  return new Terminal(file, args, options);
}

export {
  spawn,
  Terminal
};