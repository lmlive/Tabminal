#!/usr/bin/env bash
set -e

echo "Running tests with Bun..."
bun test --cwd=$(pwd) test/
