---
name: test-and-push
description: Run the bound project's test suite, fix failures, then push to a feature branch with the Workora CLI. Use for any code change before reporting it as done.
---

# Test and Push

Before you report a code change as complete, verify it and ship it through the
standard Workora flow. This keeps the repo green and gives reviewers evidence.

## For a Laravel/Composer project (e.g. Bookoraa)

1. Ensure dependencies (best-effort; skip if already installed):
   ```bash
   composer install --no-interaction --prefer-dist 2>/dev/null || true
   ```
2. Syntax-check changed PHP files:
   ```bash
   git diff --name-only -- "*.php" | xargs -I{} php -l {} 2>&1 || true
   ```
3. Run the suite if it can run (no DB/vendor may block it):
   ```bash
   php artisan test --stop-on-failure 2>&1 | tail -30 || true
   ```

## For a Node/NestJS project (e.g. Waora)

1. Run lint + tests:
   ```bash
   npm install --no-audit --no-fund 2>/dev/null || true
   npm test 2>&1 | tail -40 || true
   npm run lint 2>&1 | tail -20 || true
   ```
2. Fix any failures your change introduced.

## Gate — do NOT push if

- A test you broke is failing (fix it first, or say explicitly why you cannot).
- `php -l` / lint reports a syntax error in a file you changed.
- You have NOT actually run anything (never claim "tested" without running).

## Push

Once green (or you've documented an unavoidable skip with a reason):
```bash
Workora project push --branch <your-branch> --message "<what+why>" --create-channel
Workora checkpoint save  # after feeding session JSON on stdin
```

## Report

Post the branch, commit, what you changed, which tests/linters you ran and their
result, and any skips + why. Honest evidence > "looks fine".