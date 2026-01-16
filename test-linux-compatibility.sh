#!/usr/bin/env bash

echo "Tabminal Linux Compatibility Test Script"
echo "======================================="
echo ""
echo "Testing different binary versions for Linux compatibility..."
echo ""

# Test each version
versions=(
    "tabminal-linux-x64:Standard Bun target"
    "tabminal-linux-x64-compatible:Node.js target for compatibility"  
    "tabminal-linux-node-pty:Using node-pty library"
    "tabminal-minimal:No PTY functionality (fallback)"
)

echo "Available versions:"
echo ""
for version in "${versions[@]}"; do
    binary=$(echo $version | cut -d: -f1)
    desc=$(echo $version | cut -d: -f2)
    if [ -f "dist/$binary" ]; then
        size=$(ls -lh dist/$binary | awk '{print $5}')
        echo "✅ $binary ($size) - $desc"
    else
        echo "❌ $binary (missing) - $desc"
    fi
done

echo ""
echo "Usage Instructions:"
echo "=================="
echo ""
echo "1. Try standard version first:"
echo "   ./dist/tabminal-linux-x64 -a password -p 8080"
echo ""
echo "2. If 'Illegal instruction' error, try compatible version:"
echo "   ./dist/start-tabminal-linux-x64-compatible.sh -a password -p 8080"
echo ""
echo "3. If PTY issues persist, try minimal version:"
echo "   ./dist/start-tabminal-minimal.sh -a password -p 8080"
echo ""
echo "Troubleshooting:"
echo "================"
echo "• 'Illegal instruction': Use compatible version"
echo "• 'PTY not found': Use minimal version (no terminal sessions)"
echo "• Permission denied: chmod +x dist/tabminal-*"
echo ""
echo "For Ubuntu 18.04+ with older CPUs, the compatible version should work best."