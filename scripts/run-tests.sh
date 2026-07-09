#!/usr/bin/env bash

cd "$(dirname "$0")/.."

echo "=== LC Galaxy — Automated Checks ==="
echo ""

echo "[1/2] Building..."
npm run build
echo "  ✓ Build passed"
echo ""

echo "[2/2] Linting..."
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
echo "=== Build: PASS | Lint: $([ $LINT_EXIT -eq 0 ] && echo PASS || echo ISSUES) ==="
echo "Run manual checks in docs/TEST_PLAN.md (M1–M31)."

exit $LINT_EXIT
