#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

INSTALL_DIR=$(pwd)

if [[ $EUID -eq 0 ]]; then
    log_error "Please run this script as a regular user, not root."
    exit 1
fi

detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        echo "windows"
    else
        log_error "Unsupported OS: $OSTYPE"
        exit 1
    fi
}

install_bun() {
    if command -v bun &> /dev/null; then
        log_info "Bun already installed: $(bun --version)"
        return 0
    fi
    
    log_info "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    
    export PATH="$HOME/.bun/bin:$PATH"
    
    if command -v bun &> /dev/null; then
        log_info "Bun installed successfully: $(bun --version)"
    else
        log_error "Failed to install Bun"
        exit 1
    fi
}

install_dependencies() {
    log_info "Installing dependencies with Bun..."
    bun install
    
    if [ ! -d "node_modules/bun-pty" ]; then
        log_error "bun-pty not found after installation"
        exit 1
    fi
    log_info "Dependencies installed successfully"
}

generate_config() {
    if [ ! -f ".env" ]; then
        log_info "Generating configuration..."
        PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
        
        cat > .env << EOF
TABMINAL_PASSWORD=$PASSWORD
TABMINAL_HOST=0.0.0.0
TABMINAL_PORT=9846
TABMINAL_ACCEPT=true
EOF
        
        log_info "Configuration saved to .env"
        log_warn "Generated password: $PASSWORD"
        log_warn "Please save this password!"
    else
        log_info "Configuration file already exists"
    fi
}

setup_systemd() {
    if [[ "$1" == "linux" ]]; then
        if [ ! -f "/etc/systemd/system/tabminal.service" ]; then
            log_info "Setting up systemd service..."
            
            CURRENT_USER=$(whoami)
            
            sudo tee /etc/systemd/system/tabminal.service > /dev/null << EOF
[Unit]
Description=Tabminal Web Terminal Service
Documentation=https://github.com/leask/tabminal
After=network.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$INSTALL_DIR
Environment="NODE_ENV=production"
EnvironmentFile=$INSTALL_DIR/.env
ExecStart=$(which bun) src/server.mjs
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
            
            sudo systemctl daemon-reload
            log_info "Systemd service installed. Enable with: sudo systemctl enable --now tabminal"
            log_info "Or start with: sudo systemctl start tabminal"
            log_info "Check status with: sudo systemctl status tabminal"
        else
            log_info "Systemd service already exists"
        fi
    else
        log_info "Systemd service setup is only available on Linux"
    fi
}

main() {
    OS=$(detect_os)
    log_info "Detected OS: $OS"
    log_info "Install directory: $INSTALL_DIR"
    
    install_bun
    install_dependencies
    generate_config
    
    if [[ "$OS" == "linux" ]]; then
        read -p "Install systemd service? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            setup_systemd "$OS"
        fi
    fi
    
    log_info ""
    log_info "Installation complete!"
    log_info "----------------------------------------"
    log_info "Start manually: bun src/server.mjs"
    if [[ "$OS" == "linux" ]]; then
        log_info "Start with systemd: sudo systemctl start tabminal"
    fi
    log_info "----------------------------------------"
}

main "$@"
