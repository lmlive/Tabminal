#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

if [[ $EUID -ne 0 ]]; then
    log_error "This script requires root privileges for systemd operations."
    log_info "Please run with: sudo $0"
    exit 1
fi

if systemctl is-active --quiet tabminal 2>/dev/null; then
    log_info "Stopping tabminal service..."
    sudo systemctl stop tabminal
fi

if systemctl is-enabled --quiet tabminal 2>/dev/null; then
    log_info "Disabling tabminal service..."
    sudo systemctl disable tabminal
fi

if [ -f "/etc/systemd/system/tabminal.service" ]; then
    log_info "Removing systemd service..."
    sudo rm /etc/systemd/system/tabminal.service
    sudo systemctl daemon-reload
fi

log_info "Uninstallation complete"
log_info ""
log_info "Note: The following are NOT removed:"
log_info "  - Project directory ($(pwd))"
log_info "  - User data directory (~/.tabminal/)"
log_info "  - Bun installation (~/.bun/)"
log_info ""
log_info "To remove everything, run:"
log_info "  rm -rf $(pwd)"
log_info "  rm -rf ~/.tabminal"
