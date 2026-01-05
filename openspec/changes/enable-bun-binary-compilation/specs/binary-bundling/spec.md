# Spec: Binary Bundling

## ADDED Requirements

### Requirement: Binary Distribution

The system SHALL provide standalone binary executables that can run Tabminal without requiring Bun runtime to be pre-installed on the target system.

#### Scenario: User downloads and runs binary on Linux
Given a Linux user who does not have Bun installed
When the user downloads tabminal-linux-x64 binary
And the user makes it executable (chmod +x)
And the user runs ./tabminal
Then the server starts successfully
And the server responds to HTTP requests
And the terminal functionality works normally
And no Bun installation is required

#### Scenario: User downloads and runs binary on macOS
Given a macOS user who does not have Bun installed
When the user downloads tabminal-darwin-arm64 binary
And the user makes it executable
And the user runs ./tabminal
Then the server starts successfully
And all features work as expected
And no runtime installation is required

#### Scenario: User downloads and runs binary on Windows
Given a Windows user who does not have Bun installed
When the user downloads tabminal-windows-x64.exe
When the user runs tabminal-windows-x64.exe
Then the server starts successfully
And terminal functionality works
And no Bun installation is required

### Requirement: Static Asset Embedding

The system SHALL embed all static assets from the `public/` directory into the compiled binary, making them accessible without external files.

#### Scenario: Binary serves HTML file
Given a compiled binary is running
When a client requests GET /
Then the server responds with index.html from embedded assets
And the response includes correct Content-Type: text/html header
And the HTML is complete and functional

#### Scenario: Binary serves CSS file
Given a compiled binary is running
When a client requests GET /styles.css
Then the server responds with styles.css from embedded assets
And the response includes correct Content-Type: text/css header

#### Scenario: Binary serves JavaScript file
Given a compiled binary is running
When a client requests GET /app.js
Then the server responds with app.js from embedded assets
And the response includes correct Content-Type: application/javascript header

#### Scenario: Binary serves SVG icon
Given a compiled binary is running
When a client requests GET /icons/python.svg
Then the server responds with the SVG file from embedded assets
And the response includes correct Content-Type: image/svg+xml header

#### Scenario: Binary serves font file
Given a compiled binary is running
When a client requests GET /fonts/MonaspaceNeon-Regular.woff2
Then the server responds with the font file from embedded assets
And the response includes correct Content-Type: font/woff2 header

### Requirement: Shell Tools Integration

The system SHALL embed shell integration scripts from the `shell/` directory and extract them to a temporary location at runtime for use by terminal sessions.

#### Scenario: Binary extracts shell tools on first run
Given a compiled binary is running for the first time
When the first terminal session is created
Then the shell tools are extracted to a temporary directory
And the directory has correct permissions
And the tools are accessible to the terminal session

#### Scenario: Binary uses extracted shell tools
Given a compiled binary has extracted shell tools
When a terminal session starts a bash shell
Then the session uses the extracted bash integration scripts
And command exit codes are captured correctly
And command output is logged correctly

#### Scenario: Binary reuses extracted shell tools
Given a compiled binary has already extracted shell tools
When subsequent terminal sessions are created
Then the existing shell tools directory is reused
And no redundant extraction occurs

### Requirement: Configuration and Persistence

The system SHALL maintain the same configuration and persistence behavior when running as a binary as when running from source, using `~/.tabminal/` for runtime data.

#### Scenario: Binary creates config file
Given a user runs the binary for the first time
And ~/.tabminal/ does not exist
When the server starts
Then ~/.tabminal/ directory is created
And config.json is created with default values
And the server uses this configuration

#### Scenario: Binary reads existing config
Given a user has an existing ~/.tabminal/config.json
When the user runs the binary
Then the binary reads and respects the existing configuration
And all configuration options work correctly

#### Scenario: Binary saves session data
Given a user creates a terminal session
When the session executes commands
Then session data is saved to ~/.tabminal/sessions/<id>.json
And session logs are saved to ~/.tabminal/sessions/<id>.log
And the files are identical to source version format

#### Scenario: Binary restores session on restart
Given a user has existing session data
When the user restarts the binary
Then previous sessions are restored
And session history is available
And session state matches previous run

### Requirement: Multi-Platform Builds

The system SHALL provide build scripts and CI/CD pipelines to generate binaries for multiple platforms from a single source codebase.

#### Scenario: Build for Linux x64
Given a developer runs `bun run build:binary:linux-x64`
When the build completes
Then dist/tabminal-linux-x64 binary is created
And the binary runs on Linux x64 systems
And the binary size is < 100MB

#### Scenario: Build for macOS ARM64
Given a developer runs `bun run build:binary:darwin-arm64`
When the build completes
Then dist/tabminal-darwin-arm64 binary is created
And the binary runs on macOS Apple Silicon systems
And the binary size is < 100MB

#### Scenario: Build for Windows x64
Given a developer runs `bun run build:binary:windows-x64`
When the build completes
Then dist/tabminal-windows-x64.exe is created
And the binary runs on Windows x64 systems
And the binary size is < 100MB

#### Scenario: Build all platforms
Given a developer runs `bun run build:binary:all`
When the build completes
Then binaries for all target platforms are created
And all binaries are functional

### Requirement: Bun PTY Compatibility

The system SHALL maintain full PTY functionality using bun-pty when compiled as a binary.

#### Scenario: Binary creates PTY session
Given a compiled binary is running
When a client connects via WebSocket
And creates a new terminal session
Then a PTY session is created successfully
And the PTY process starts
And the session ID is returned

#### Scenario: Binary handles PTY data
Given a binary has an active PTY session
When the user types in the terminal
Then input is sent to the PTY
And output from the PTY is received
And output is broadcast to connected clients

#### Scenario: Binary handles PTY resize
Given a binary has an active PTY session
When the client sends a resize message
Then the PTY dimensions are updated
And the resize is acknowledged

#### Scenario: Binary handles PTY exit
Given a binary has an active PTY session
When the PTY process exits
Then the exit event is handled
And the session is marked as terminated
And the exit code is reported

#### Scenario: Binary restarts PTY
Given a binary has a terminated PTY session
When the user interacts with the terminal
Then the PTY is automatically restarted
And the session continues to function
And the CWD and state are preserved

### Requirement: Performance

The system SHALL maintain acceptable performance characteristics when running as a compiled binary.

#### Scenario: Binary startup time
Given a compiled binary on a typical system
When the user runs the binary
Then the server starts within 1 second on cold start
And the server responds to health checks within 1.5 seconds

#### Scenario: Binary memory usage
Given a compiled binary with one active session
When the server has been running for 5 minutes
Then memory usage is < 200MB
And memory usage is stable (no significant leaks)

#### Scenario: Binary HTTP performance
Given a compiled binary is running
When multiple clients make HTTP requests
Then requests are handled within 50ms for static files
And response times are comparable to source version

#### Scenario: Binary WebSocket performance
Given a compiled binary has active WebSocket connections
When terminal data is transmitted
Then data latency is < 10ms for local connections
And performance is comparable to source version

### Requirement: Documentation

The system SHALL provide comprehensive documentation for using, building, and distributing binary versions.

#### Scenario: User reads binary installation instructions
Given a user wants to install the binary
When the user reads the README
Then the user finds clear download instructions for each platform
And the user finds steps to make the binary executable
And the user finds information about expected system requirements

#### Scenario: Developer reads build documentation
Given a developer wants to build binaries
When the developer reads BUILDING_BINARIES.md
Then the developer finds prerequisites
And the developer finds build commands for each platform
And the developer finds information about cross-compilation
And the developer finds CI/CD workflow documentation

#### Scenario: User finds troubleshooting guide
Given a user encounters an issue with the binary
When the user looks for help
Then the documentation covers common issues
And the documentation provides solutions
And the documentation includes when to use source version instead

### Requirement: CI/CD Automation

The system SHALL provide automated build pipelines to generate and distribute binaries on release.

#### Scenario: Automated build on tag push
Given a developer pushes a version tag (e.g., v2.1.0)
When the GitHub Actions workflow runs
Then binaries are built for all target platforms
And binaries are tested
And artifacts are uploaded

#### Scenario: Automated release creation
Given binaries have been built successfully
When the release workflow runs
Then a GitHub release is created
And binaries are attached to the release
And release notes are included

#### Scenario: Manual build trigger
Given a developer wants to test a build without creating a release
When the developer triggers the workflow manually
Then binaries are built and uploaded as artifacts
And no release is created
And the developer can download and test binaries

### Requirement: Backward Compatibility

The system SHALL maintain full compatibility with source-based installation, allowing users to choose either distribution method.

#### Scenario: User switches from binary to source
Given a user was running the binary version
When the user switches to source version
Then configuration in ~/.tabminal/ is preserved
And session data is accessible
And the source version works with existing data
And no migration is required

#### Scenario: User switches from source to binary
Given a user was running the source version
When the user switches to binary version
Then configuration in ~/.tabminal/ is preserved
And session data is accessible
And the binary version works with existing data
And no migration is required

#### Scenario: Both versions can coexist
Given a developer has source version installed
When the developer builds and runs the binary
Then both versions use the same ~/.tabminal/ directory
And configuration is shared
And session data is shared
And running one version does not break the other

## MODIFIED Requirements

No existing requirements are modified. This change adds new capabilities without altering existing behavior.

## REMOVED Requirements

No existing requirements are removed.
