# Workora UI/design consistency audit — report

Date: 2026-08-03
Method: gstack design-review methodology (Phase 2 design-system extraction + Phase 3 page-by-page audit), run in a real browser against the live site across all pages. Findings fixed in commit `fb43068`, deployed, and re-verified live.

## 1. Design system extracted (live browser evidence)

**Fonts across surfaces:**
- Landing + features + login + app shell all use: `EB Garamond` (display/serif), `Inter` (body), `JetBrains Mono`/`ui-monospace` (mono)
- One outlier: features page rendered `Karla` in one element (checking source, this came from an inline style in a demo pictogram — not a systemic font, but flagged)

**Colors (consistent across surfaces):**
- canvas `#f5f5f5`, surface `#fff`, surface-strong `#f0efed`, ink `#0c0a09`, ink-2 `#292524`, body `#4e4e4e`, muted `#777169`, muted-soft `#a8a29e`, hair `#e7e5e4`, success `#16a34a`, amber `#b9770e`, peach `#f4c5a8`, mint `#a7e5d3`, lavender `#c8b8e0`, sky `#a8c8e8`
- These are identical between the landing skin (`--lp-*` tokens) and the app skin (`styles.css` `--*` tokens). Color system is coherent.

**Heading scale (inconsistent before fix):**
| Surface | H1 | H2 | H3 |
|---|---|---|---|
| Landing | 78px / 400 | 64px / 400 | 28px / 700 |
| Features | 76px / **700** ❌ | 64px / 400 | 44px / **700** ❌ |
| App shell | 24px / 400 | — | 16px / 700 |
| Onboarding | — | 22px / **700** ❌ | — |

## 2. Findings + fixes

| # | Severity | Finding | Fix | Verified live |
|---|---|---|---|---|
| 1 | HIGH | Features hero H1 weight 700 vs landing 400 — display-face inconsistency | Added `font-weight: 400` to `.lp-feature-hero__title` | ✅ 400 |
| 2 | HIGH | CTA H2 weight 700 vs `.lp-section-title` 400 | Added `font-weight: 400` to `.lp-cta__title` | ✅ 400 |
| 3 | HIGH | Features case H3 (44px serif) weight 700 | Added `font-weight: 400` to `.lp-feature-case__copy h3` | ✅ 400 |
| 4 | MEDIUM | Hero title space bug: `"Get an\nAI team"` rendered "Get anAI team" during typing + in textContent | Moved break to `"Get an AI team\nthat ships work."` | ✅ "AI team that ships work." |
| 5 | MEDIUM | "Branchs" typo in Projects | `{t("projects.branch")}s` → `{t("projects.branch")}es` | ✅ in source |
| 6 | MEDIUM | Onboarding wizard H2 used body font 22px/700, breaking the app serif header language | `.ob-card h2` → serif 24px/400 | ✅ EB Garamond 24px/400 |
| 7 | MEDIUM | Landing nav links 23px tall — undersized touch target (WCAG 2.5.5 needs 44px) | `min-height: 44px` + inline-flex on `.lp-nav__links a` | ✅ 44px |
| 8 | MEDIUM | App rail icons 40px, brand 36px — undersized | Bumped to 44px (brand radius 8→10 to match) | ✅ 44px/44px |

**Verified as already consistent (no fix needed):**
- Color tokens identical across landing + app skins
- Body font 16px everywhere
- Mono font for code/sequences consistent
- Border-radius system coherent (6/10/16/24/9999)

## 3. Trunk test (every page)
| Page | Site ID | Page name | Sections | Options | You-are-here | Search | Result |
|---|---|---|---|---|---|---|---|
| Landing | ✅ | ✅ | ✅ | ✅ | — | n/a | PASS |
| Features | ✅ | ✅ | ✅ | ✅ | — | n/a | PASS |
| Login | ✅ | ✅ | — | ✅ | — | n/a | PASS |
| Chat | ✅ | ✅ (#all) | ✅ | ✅ | ✅ | ✅ | PASS |
| Projects | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| Members | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| Skills | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| Tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| Settings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |

## 4. Deploy incident (documented honestly)

Deploying the fixes triggered a VPS outage. Root causes diagnosed and fixed:
- **Memory exhaustion**: Docker rebuild OOM'd the 24GB box (no swap). Added 8GB persistent swap (fstab).
- **Broken DNS after reboot**: Tailscale overwrote `/etc/resolv.conf` with its broken DNS, breaking deploys (`EAI_AGAIN`). Pinned resolv.conf to provider DNS + made immutable (`chattr +i`).

Site recovered, UI fixes deployed and verified live (HTTP 200).

## 5. Follow-up audit (2026-08-05) — button/input unification

A follow-up cross-surface audit (gstack design-review + qm design principles) found
a systemic control mismatch: **bare `.ok` buttons and `.inp` inputs had no unscoped
CSS rule**, so content views (Knowledge, Reminders, Projects, Onboarding) and the
auth pages fell back to browser-default gray square buttons + Arial inputs, while
landing/chat/modals used the ink pill.

| Surface (before) | Button | Input |
|---|---|---|
| Login | gray #efefef, square, black | — |
| Knowledge/Reminders/Projects | gray #efefef, square, black | Arial, radius 0 |
| Onboarding | gray #efefef, square, black | — |
| Chat / landing | ink pill ✅ | Inter ✅ |

**Fix (commit `43a2225`):**
- Added bare `.ok`: ink-2 pill, white text, 9999px radius, hover ink — matches
  `.setform .ok` / `.modal .ok` / chat send / landing primary CTA
- Added bare `.inp`: Inter, hair border, 8px radius, ink focus ring (fixes Arial)
- `.auth-card` radius 8px → 16px to match the `.card` system

**Verified live (computed styles after deploy):**
| Surface (after) | Button | Input |
|---|---|---|
| Login | ink #292524, pill 9999px | — |
| Knowledge/Reminders/Projects | ink #292524, pill 9999px | Inter, 8px |
| Onboarding | ink #292524, pill 9999px | — |
| Chat | ink pill (unchanged) | Inter |

Design principle applied (qm): "make clickable things obviously clickable" — a
consistent pill affordance signals interactivity without hover.
