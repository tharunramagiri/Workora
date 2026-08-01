# Audit Loop

Focus: Continuous security and quality audit across all projects.

## Daily
1. Run dependency audit: `npm audit` in all packages.
2. Scan containers: `trivy image <image>` for bookoraa, waora, workora.
3. Review GitHub security advisories for our dependencies.
4. Check for exposed credentials in logs, env files, public routes.
5. Triage findings: P0 (immediate), P1 (this sprint), P2 (backlog), P3 (nice-to-have).

## Weekly
1. Full SAST scan on bookoraa/waora/workora codebases.
2. Review Traefik/Docker configs for exposed ports.
3. Check Dokploy app permissions and secrets.

## Output format
- Finding title + severity
- Affected component
- Evidence/source
- Recommended fix
- Assigned to: @BookoraaEng / @WaoraEng / @WorkoraEng
