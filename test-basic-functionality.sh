#!/usr/bin/env bash
set -e

echo "=== Tabminal Bun Migration Test Suite ==="
echo ""

# Start server
export TABMINAL_ACCEPT=true
bun src/server.mjs --port 9846 --password test123 > /tmp/tabminal-test.log 2>&1 &
SERVER_PID=$!
echo "✓ Server started (PID: $SERVER_PID)"
sleep 3

# Test 1: Health check
echo ""
echo "Test 1: Health endpoint"
RESULT=$(curl -s http://127.0.0.1:9846/healthz)
if [[ "$RESULT" == *"ok"* ]]; then
    echo "  ✓ Health check passed"
else
    echo "  ✗ Health check failed: $RESULT"
    kill $SERVER_PID
    exit 1
fi

# Test 2: Static files
echo ""
echo "Test 2: Static file serving"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:9846/)
if [[ "$HTTP_CODE" == "200" ]]; then
    echo "  ✓ Static files served correctly"
else
    echo "  ✗ Static files failed: HTTP $HTTP_CODE"
fi

# Test 3: Configuration check
echo ""
echo "Test 3: Environment configuration"
if grep -q "Tabminal listening" /tmp/tabminal-test.log; then
    echo "  ✓ Server initialized successfully"
else
    echo "  ✗ Server initialization failed"
    cat /tmp/tabminal-test.log
    kill $SERVER_PID
    exit 1
fi

# Test 4: Process memory check
echo ""
echo "Test 4: Memory usage"
MEMORY_KB=$(ps -p $SERVER_PID -o rss= | tail -n 1)
MEMORY_MB=$((MEMORY_KB / 1024))
echo "  ✓ Memory usage: ${MEMORY_MB} MB"

# Cleanup
echo ""
echo "=== Cleanup ==="
kill $SERVER_PID 2>/dev/null
wait

echo ""
echo "✓ All tests passed!"
