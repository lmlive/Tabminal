# `t>` Tabminal

> **Tab(ter)minal, the Cloud-Native, Proactive AI Integrated Terminal works in modern browsers.**
> Seamlessly code from your desktop, tablet, or phone with an intelligent, persistent, and rich experience.
> This project was built using Gemini and Codex wich 80% vibe-coding, means `built for the vibe, with the vibe`.
>
> **🚀 Now powered by Bun runtime for blazing fast performance!**

![Tabminal Banner](public/favicon.svg)

## 🌟 Why Tabminal?

Tabminal bridges the gap between traditional CLI tools and modern AI capabilities, all while solving the UX challenges of coding on desktop and mobile devices.

![IMG_0918](https://github.com/user-attachments/assets/a0cb7d8d-924c-4ba0-852e-bd0b1f2928ae)

As a long-time terminal user who frequently needs to step away from my computer while maintaining my workflow, and considering the various scalability issues of traditional terminals alongside the irreversible trend of vibe-coding, I reconsidered a solution that would first serve my own needs. Then, it would serve others whose workflows happen to be similar to mine. So, while waiting for AI to write code for the company, I tried to vibe a terminal from scratch that could meet my daily work needs and that I would enjoy using. As a result, I intermittently wrote this project. I believe this project is not for everyone. However, it is especially suitable for CLI and AI enthusiasts, which is the core motivation behind this project's creation.

## ✨ Innovative Designs

- `Server-side session persistence` ensures your sessions with the AI agent are maintained, allowing you to pick up where you left off at any time.
- `Fast and stable connection management` delivers a seamless, agile experience across platforms and devices, with native support for network roaming.
- Enjoy a comprehensive `Progressive Web App (PWA) experience` anytime, anywhere; all you need is a modern browser to start working.
- `Proactive AI integration` means your terminal becomes your work context. You can ask questions about your current session at any time, and the AI will automatically retrieve the context to accurately solve problems, even proactively offering assistance when commands fail.
- `Cloud-native design` enables access via Zero Trust or VPN, providing unprecedented convenience for managing cloud servers. 

<img width="1632" height="1317" alt="Screenshot 2025-11-24 at 10 15 28 PM" src="https://github.com/user-attachments/assets/ad864233-7b22-4b29-8b90-dc81993dd623" />

<details>

<summary>📷 More screenshots</summary>

<img width="2016" height="1170" alt="Screenshot 2025-11-24 at 3 03 03 PM" src="https://github.com/user-attachments/assets/a74490be-fe97-41c6-9026-44bbf3be79f9" />

<img width="2012" height="1439" alt="Screenshot 2025-11-24 at 3 02 12 PM" src="https://github.com/user-attachments/assets/80fed651-48ce-482a-80a3-03d9dd2767b0" />

<img width="1816" height="1186" alt="Screenshot 2025-11-24 at 3 01 46 PM" src="https://github.com/user-attachments/assets/509f7e99-1d70-46be-bc18-a202c0fe11a4" />

<img width="1815" height="826" alt="Screenshot 2025-11-24 at 2 57 39 PM" src="https://github.com/user-attachments/assets/c503c236-dc38-470e-9a0d-6b824e0dd624" />

</details>

### 🧠 AI-Native Intelligence
Powered by **modern AI models** (via OpenRouter), Tabminal understands your context.
*(Defaults to **Gemini 2.5 Flash** for optimal speed/performance balance if not configured)*
*   **Context-Aware Chat**: Type `# how do I...` to ask questions. The AI knows your **CWD**, **Environment**, and **Recent History**.
*   **Auto-Fix**: Command failed? Tabminal automatically analyzes the exit code and error output to suggest fixes. No copy-pasting required.
*   **Web Search**: Enable Google Search integration to let the AI fetch real-time answers from the web.

### 📱 Ultimate Mobile Experience
Built from the ground up for **iPadOS** and **iOS**.
*   **HHKB Virtual Keyboard**: You can perform nearly all terminal operations on any device, without being frustrated by os limitations.
*   **Responsive Layout**: Auto-adapts to landscape/portrait modes, respecting Safe Areas and Notches.
*   **PWA Ready**: Install to Home Screen for a full-screen, native app feel.

### 💻 Powerful Desktop Features
*   **Persistent Sessions**: Your terminal state lives on the server. Refresh or switch devices without losing your work.
*   **Built-in Editor**: Integrated **Monaco Editor** (VS Code core) allows you to edit files directly on the server.
*   **Visual File Manager**: Sidebar file tree for easy navigation.
*   **Network Heartbeat**: Real-time latency visualization.

## 🚀 Getting Started

### Prerequisites
*   Bun >= 1.0.0
*   (Optional) An [OpenRouter](https://openrouter.ai/) API Key if you want AI features.
*   (Optional) A pair of Google API Key and Search Engine ID (CX) for web search capabilities.

### ⚠️ Security Warning
Tabminal provides **full read/write access** to the underlying file system.
*   **Do NOT expose this to the public internet** without proper protection (VPN, etc).
*   The `--accept-terms` flag is required to acknowledge that you understand these risks.

## 🚀 Installation

### Quick Install (Recommended)

```bash
# Clone the repository
git clone https://github.com/leask/tabminal.git
cd tabminal

# Run the automated installation script
bash scripts/install.sh
```

The install script will:
- Install/verify Bun runtime
- Install all dependencies (including bun-pty)
- Generate a secure password
- Optionally set up systemd service on Linux

### Manual Install

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Clone the repository
git clone https://github.com/leask/tabminal.git
cd tabminal

# Install dependencies
bun install

# Copy and edit configuration
cp .env.example .env
nano .env

# Start the server
bun src/server.mjs --accept-terms
```

### Configuration

You can configure Tabminal via command-line arguments, environment variables, or a `config.json` file.

| Argument | Env Variable | Description | Default |
| :--- | :--- | :--- | :--- |
| `-p`, `--port` | `PORT` | Server port | `9846` |
| `-h`, `--host` | `HOST` | Bind address | `127.0.0.1` |
| `-a`, `--password` | `TABMINAL_PASSWORD` | Access password | (Randomly Generated) |
| `-k`, `--openrouter-key` | `TABMINAL_OPENROUTER_KEY` | AI Provider API Key | `null` |
| `-m`, `--model` | `TABMINAL_MODEL` | AI Model ID | `gemini-2.5-flash-preview-09-2025` |
| `-g`, `--google-key` | `TABMINAL_GOOGLE_KEY` | Google Search API Key | `null` |
| `-c`, `--google-cx` | `TABMINAL_GOOGLE_CX` | Google Search Engine ID (CX) | `null` |
| `-d`, `--debug` | `TABMINAL_DEBUG` | Enable debug logs | `false` |
| `-y`, `--accept-terms` | `TABMINAL_ACCEPT` | **Required**: Accept security risks (Full FS Access) | `false` |

## ⌨️ Shortcuts & Gestures

*   **`Ctrl + Shift + T`**: New Terminal
*   **`Ctrl + Shift + W`**: Close Terminal
*   **`Ctrl + Shift + E`**: Toggle Editor Pane
*   **`Ctrl + Up` / `Down`**: Focus Editor / Terminal
*   **`Ctrl + Shift + [` / `]`**: Switch Terminal
*   **`Ctrl + Alt + [` / `]`**: Switch Open File in Editor
*   **`Ctrl + Shift + ?`**: Show Shortcuts Help
*   **`Ctrl` / `Cmd` + `F`**: Find in Terminal

### Touch Actions
*   **Virtual `SYM`**: Toggle HHKB keyboard overlay.

## 🛠 Tech Stack
*   **Backend**: [Bun](https://bun.sh) (JavaScript Runtime), [Koa](https://github.com/koajs/koa), [bun-pty](https://npmjs.com/package/bun-pty), [WebSocket](https://github.com/websockets/ws).
*   **Frontend**: [Vanilla JS](http://vanilla-js.com/) 😝, [xterm.js](https://github.com/xtermjs/xterm.js), [Monaco Editor](https://github.com/microsoft/monaco-editor).
*   **AI**: Integration via [utilitas](https://github.com/leask/utilitas).

### Why Bun?

Tabminal now runs on Bun runtime for:
- **Blazing fast startup**: Up to 10x faster than Node.js
- **Superior performance**: Better HTTP throughput and I/O operations
- **Native TypeScript**: Built-in TypeScript support without compilation
- **Modern ecosystem**: First-class support for modern JavaScript features

## 📄 License
[MIT](LICENSE)

## 📦 Binary Distribution

Tabminal can be built as standalone binary executables using Bun's `--compile` feature. This allows running Tabminal without installing Bun runtime.

### Building Binaries

```bash
# Build for current platform (Linux/macOS/Windows)
npm run build:binary

# Build for specific platforms
npm run build:binary:linux       # Linux x64 (103MB)
npm run build:binary:macos       # macOS ARM64
npm run build:binary:windows     # Windows x64
npm run build:binary:all         # All platforms
```

### Binary Size

- **Current size**: ~103MB per platform
- **Size breakdown**:
  - Bun runtime: ~90MB (cannot be reduced)
  - Application: ~10MB
  - Embedded assets: ~260KB (negligible)
- **Why 103MB?** Bun embeds entire runtime, similar to Go binaries (80-120MB)

For detailed size optimization analysis, see [SIZE_OPTIMIZATION_SUMMARY.md](docs/SIZE_OPTIMIZATION_SUMMARY.md).

### Running the Binary

```bash
# Make executable (Linux/macOS)
chmod +x dist/tabminal-linux-x64

# Run (Note: requires librust_pty shared library)
./dist/tabminal-linux-x64 -y

# Or with custom password
./dist/tabminal-linux-x64 -y -a your-password
```

### Important: librust_pty Library

In previous versions, you may have encountered this error:
```
error: librust_pty shared library not found
```

This happened because the binary depended on the `librust_pty` shared library. The build process has been enhanced to copy the required library to the same directory as the binary, so this error should no longer occur.

You can now run the binary directly:
```bash
# Run directly (recommended)
./tabminal-linux-x64 -y

# Or use the generated startup script (still works)
./start-tabminal-linux-x64.sh -y
```

The build process creates:
- `tabminal-linux-x64` - Main binary
- `librust_pty.so` - Required shared library (copied to same directory)
- `start-tabminal-linux-x64.sh` - Startup script (Linux/macOS)

All CLI options work with binaries:
- `-y, --accept-terms` - Accept security warning
- `-p, --port <port>` - Set port
- `-a, --passwd <password>` - Set password
- `-h, --host <address>` - Bind address

### Binary vs Source

| Feature | Source | Binary |
|---------|--------|--------|
| **Size** | ~5MB (source) | ~103MB (binary) |
| **Runtime** | Requires Bun | Bun embedded |
| **Setup** | `bun install` | Download & run |
| **Updates** | Git pull | Download binary |
| **Portability** | Needs Bun | Standalone |

### Configuration

Binary uses same configuration as source:
- Config: `~/.tabminal/config.json`
- Sessions: `~/.tabminal/sessions/`
- Environment: `TABMINAL_*` prefix

### Performance

Binary performance is **identical** to source version:
- **Startup**: ~0.3s (same as source)
- **Memory**: ~180MB (same as source)
- **Runtime**: Identical (Bun runtime embedded)

### Distribution

Binaries are ideal for:
- **Production deployment**: Single file, no dependencies
- **Cloud servers**: No Bun installation needed
- **End users**: Download and run

For complete usage guide, see [BINARY_USAGE.md](docs/BINARY_USAGE.md).

