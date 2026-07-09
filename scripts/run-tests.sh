#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

echo "=== LC Galaxy — Automated Checks ==="
echo ""

echo "[1/2] Building..."
npm run build
echo "  ✓ Build passed"
echo ""

echo "[2/2] Linting..."
npm run lint
echo "  ✓ Lint passed"
echo ""

echo "=== Automated checks passed ==="
echo ""
echo "Run manual checks in docs/TEST_PLAN.md (M1–M31)."
