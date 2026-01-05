<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# AGENTS.md

This file contains conventions and commands for AI agents working on this repository.

## Essential Commands

### Development
```bash
npm start                    # Start the server
npm run dev                  # Start with --watch for hot reload
```

### Testing
```bash
npm test                     # Run all tests (using node --test)
npm run test:watch           # Run tests in watch mode
```

To run a single test file:
```bash
node --test test/terminal-session.mjs
```

To run a specific test:
```bash
node --test --test-name-pattern="replays buffered output"
```

### Build & Quality
```bash
npm run build                # Download icons and copy fonts
npm run lint                 # Run eslint
```

## Code Style Guidelines

### Project Overview
- Node.js ES modules (.mjs) with vanilla JavaScript
- No TypeScript - use runtime type checking where needed
- Backend: Koa + WebSocket + node-pty for terminal emulation
- Frontend: Vanilla JS with xterm.js and Monaco Editor

### Imports
- Always use `node:` prefix for built-in Node.js modules: `import path from 'node:path'`
- Use named imports for external modules: `import { TerminalManager } from './terminal-manager.mjs'`
- Place all imports at the top of the file
- Organize imports: built-ins → external dependencies → local modules

### Formatting & Structure
- 4-space indentation
- Use semicolons consistently
- Line length: try to stay under 120 characters
- No trailing whitespace
- Use 2 spaces for JSON indentation

### Naming Conventions
- Classes: PascalCase (`TerminalSession`, `SystemMonitor`)
- Functions/Methods: camelCase (`createSession`, `handleInput`)
- Constants: UPPER_SNAKE_CASE (`DEFAULT_CONFIG`, `MAX_ATTEMPTS`, `WS_STATE_OPEN`)
- Private methods: prefix with underscore (`_handleData`, `_broadcast`)
- File names: kebab-case for utilities, PascalCase for class files (`terminal-session.mjs`)

### Classes & Objects
- Use classes for stateful components (sessions, managers, monitors)
- Private methods prefixed with underscore
- Constructor initializes all instance properties
- Use optional chaining and nullish coalescing where appropriate

### Error Handling
- Use try-catch for async operations
- Log errors with `console.error('[ModuleName]', error)`
- Don't crash on non-critical errors (e.g., cleanup, optional features)
- Check for specific error codes when appropriate (e.g., `e.code === 'ENOENT'`)
- Silent failures acceptable with `/* ignore */` comment for expected edge cases

### Async/Await
- Prefer async/await over Promise chains
- Handle rejections appropriately
- Use `fs/promises` for file operations

### Testing
- Use Node.js built-in test runner (`node:test`)
- Tests located in `test/` directory
- Mock external dependencies (pty, WebSocket, etc.)
- Use `assert` from `node:assert`
- Arrange tests with `beforeEach`/`afterEach` for setup/teardown

### Logging
- Prefix logs with module name in brackets: `[Server]`, `[Manager]`, `[Auth]`
- Use `console.log` for info, `console.warn` for warnings, `console.error` for errors
- Debug logs only when `config.debug` is true

### Configuration
- Configuration loaded from `src/config.mjs`
- Priority: Defaults → ~/.tabminal/config.json → ./config.json → CLI args → ENV vars
- Environment variables prefixed with `TABMINAL_`

### Regex & Patterns
- Store regex patterns in UPPER_SNAKE_CASE constants at module level
- Use global flag when repeatedly matching
- Reset `lastIndex` on regex patterns when reusing

### WebSocket Protocol
- Messages are JSON objects with `type` field
- Types include: `output`, `input`, `resize`, `snapshot`, `meta`, `status`, `ping`, `pong`
- Broadcast to all clients, send to specific client

### File Organization
- `src/` - Server-side code (modules with .mjs)
- `public/` - Static files served to clients
- `shell/` - Shell integration scripts
- `test/` - Test files

### Session Management
- Sessions persist to `~/.tabminal/sessions/`
- Each session has a `.json` metadata file and `.log` for output
- Manager auto-creates session when last one closes
- Session data includes: id, title, cwd, env, editorState, executions

### Security Notes
- Password protected with SHA256 hashing
- Failed auth attempts lock service after 30 tries
- DO NOT expose to public internet without VPN/proxy
- Full file system access to underlying system

### When Making Changes
1. Run tests: `npm test`
2. Run lint: `npm run lint`
3. If adding new functionality, add corresponding tests
4. Keep changes minimal and focused
5. Follow existing patterns in similar files
