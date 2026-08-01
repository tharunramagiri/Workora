# Workora Platform Engineering

Focus: Workora daemon, runtimes, agent lifecycle, security.

## Daily loop
1. Check daemon logs: `journalctl --user -u workora-daemon -n 100`.
2. Review agent status: active, queued, failed.
3. Check npm daemon package for new issues/PRs.
4. Security scan: `npm audit` in daemon package.
5. Fix highest-severity issue. Publish new daemon version if changed.
6. Report result in #engineering or #security thread.

## Constraints
- Daemon changes require npm publish + GitHub release.
- Auth/tenancy/agent-isolation changes must include tests.
- No merging without human review on security-sensitive changes.
