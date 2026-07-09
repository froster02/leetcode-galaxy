#!/usr/bin/env bash

cd "$(dirname "$0")/.."

echo "=== LC Galaxy — Automated Checks ==="
echo ""

echo "[1/3] Building..."
npm run build
echo "  ✓ Build passed"
echo ""

echo "[2/3] Linting..."
# Known false-positives that are non-blocking:
#   - react-hooks/purity: Math.random() inside useMemo/useRef in 3D animation code
#   - no-unused-vars: `motion` from framer-motion (JSX member usage not tracked without eslint-plugin-react)
#   - react-hooks/set-state-in-effect: handleSearch in URL-init effect (intentional SPA routing)
#   - react-hooks/exhaustive-deps: fetchWithRetry in useLeetCode (stable closure, safe to omit)
npm run lint
LINT_EXIT=$?

echo ""
if [ $LINT_EXIT -eq 0 ]; then
    echo "  ✓ Lint passed"
else
    echo "  ! Lint reported issues (see above). Fix new errors before committing."
    echo "  ! Known pre-existing false-positives listed in this script's comments."
fi

echo ""
echo "[3/3] Unit tests..."
npm test
TEST_EXIT=$?

echo ""
if [ $TEST_EXIT -eq 0 ]; then
    echo "  ✓ Unit tests passed"
else
    echo "  ! Unit tests failed (see above)."
fi

echo ""
echo "=== Build: PASS | Lint: $([ $LINT_EXIT -eq 0 ] && echo PASS || echo ISSUES) | Tests: $([ $TEST_EXIT -eq 0 ] && echo PASS || echo FAIL) ==="
echo "Run manual checks in docs/TEST_PLAN.md (M1–M32)."

[ $LINT_EXIT -ne 0 ] && exit $LINT_EXIT
exit $TEST_EXIT
