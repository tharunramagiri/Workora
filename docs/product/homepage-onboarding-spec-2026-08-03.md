# Workora product spec — homepage positioning and first-run onboarding

Date: 2026-08-03
Status: proposed
Owner: Ramagiri Tharun

## 1. Goal

Make Workora easier to understand, easier to start, and easier to trust.

This spec turns the audit into two build-ready artifacts:
1. a new homepage messaging and structure plan
2. a first-run onboarding flow that gets a fresh user from install to first completed repo task

The product wedge this spec optimizes for is:

> **Paste a repo, get an autonomous coding team that ships work under your control.**

This does not remove Workora's broader "virtual company" vision. It gives the product a sharper entry point that is easier to explain, demo, and sell.

---

## 2. Target user and why they care

### Primary ICP
- solo technical founders
- indie hackers
- small startup teams with 1 to 10 people
- dev agencies running multiple client repos
- technical operators who want self-hosted AI execution

### Secondary ICP
- engineering leads who want an async agent workspace
- product-minded CTOs who want a persistent coding team, not one-shot copilots

### Not the first ICP
- non-technical SMBs
- heavy-compliance enterprise buyers
- teams expecting zero setup or fully managed infra from day one

### Core user job to be done
"I want to hand a repo and a task to AI teammates, let them do the work in a structured workspace, and stay in control of branches, tests, approvals, and memory."

---

## 3. Product promise

### One-sentence promise
**Workora is a self-hosted workspace where autonomous coding agents work on your repos in channels, branches, and tasks, with memory and approval controls.**

### Stronger marketing promise
**Paste a repo. Get an AI team that ships work on your machines.**

### Supporting proof points
These are all grounded in Workora's existing shipped capabilities and should be reflected in copy:
- import a git repo into Projects
- bind agents to real working directories
- agents work on branches and push code upstream
- branch-specific review channels are auto-created on push
- checkpoints persist agent session context into git-backed memory
- multiple coding engines are supported
- tasks, mentions, threads, and activity streams already exist
- agents are self-hosted through the daemon on user-controlled machines
- skills can be assigned to agents

---

## 4. Homepage strategy

### Current problem
The current homepage explains Workora as a general agent workspace. That is true, but too broad. A new visitor may not quickly understand:
- what outcome they get
- who it is for
- what to do first
- why it is better than a chatbot, IDE plugin, or Slack bot

### New strategic angle
Lead with the repo-first execution loop.

Position Workora as:
- an autonomous coding team for repos
- self-hosted and controllable
- persistent, multi-agent, and branch-aware

Do not lead with abstract collaboration language. Lead with concrete shipped outcomes.

---

## 5. Homepage messaging spec

### 5.1 Hero

#### Hero eyebrow
- Self-hosted autonomous coding teams

#### Hero title options
Preferred:
- **Paste a repo. Get an AI team that ships work.**

Alternates:
- **Autonomous coding teams for your repos**
- **Your self-hosted AI software company**

#### Hero subtitle
Use copy close to:

> Workora gives you persistent AI teammates that work inside a shared workspace, clone real repos, create branches, run tests, and report back in channels and threads. Everything runs on machines you control.

#### Primary CTA
- **Start with a repo**

#### Secondary CTA
- **See how Workora works**

#### Tertiary proof CTA
- **View on GitHub**

#### Hero proof strip
Short proof chips below the CTA row:
- Repo import
- Branch-aware agents
- Test evidence
- Git checkpoints
- Self-hosted daemon
- Human approvals

### 5.2 Hero visual
Use the existing product mock, but frame it as a repo execution story rather than a generic workspace mock.

The visual should visibly communicate:
- a repo-bound agent team
- a task being claimed
- a branch name
- test output or task status
- a review/report thread

If needed, adjust the mock content before redesigning the layout.

---

## 6. Homepage structure

### Section 1: Hero
Objective: answer "what is this" and "why should I care" in 10 seconds.

### Section 2: How it works
Three-step explanation:
1. **Import your repo**
   - connect a machine
   - paste a git URL
   - Workora clones it into a managed project
2. **Create your team**
   - choose a template or individual agents
   - bind agents to the repo
   - assign runtime and skills
3. **Give the first task**
   - agents create branches, edit code, run tests, push work, and report in a review channel

### Section 3: What Workora actually ships
Translate capabilities into outcomes:
- agents claim tasks and execute
- agents mention and delegate to each other
- pushes create branch review channels
- checkpoints save the reasoning trail into git
- live activity shows what the agent is doing
- everything runs on user-owned machines

### Section 4: Why teams use it instead of chatbots
Comparison framing:
- not one-shot prompting
- not isolated IDE agents
- not hidden execution
- not memory loss every session

Proposed bullets:
- persistent teammates, not disposable chats
- shared workspace, not siloed terminals
- branch and task workflows, not loose prompts
- self-hosted compute, not black-box cloud lock-in

### Section 5: Use-case templates
Show 3 opinionated starting points:
- **Bug-fix squad**
  - triage, reproduce, implement, verify
- **Feature pod**
  - product engineer, reviewer, QA agent
- **Agency client team**
  - one workspace, one repo, one delivery loop per client

### Section 6: Trust and control
This section is critical for adoption.

Explain visible control points:
- agents work in channels and threads you can inspect
- activity and tool calls stream live
- pushes, tests, and branch work are visible
- self-hosted daemon keeps execution on your infrastructure
- risky actions can require human approval

This section should foreshadow the approval-gate roadmap even if all controls are not fully implemented yet. Avoid overstating.

### Section 7: Self-hosted architecture
Keep this simpler and more outcome-oriented than the current copy.

Suggested frame:
- browser for people
- server as control plane
- daemon on your machine
- agent processes beside your code

### Section 8: Final CTA
Headline:
- **Start with one repo. Let Workora ship the first task.**

Buttons:
- Start with a repo
- Read the docs

---

## 7. Homepage copy rules

### Do
- talk in outcomes, not abstract concepts
- anchor claims in shipped product behavior
- mention repos, branches, tests, channels, and self-hosting early
- optimize for founders and small technical teams
- make the first action obvious

### Do not
- lead with "Claude Tag alternative"
- over-explain runtime internals in the hero
- sound like a generic multi-agent platform
- promise full autonomy without control
- promise enterprise-grade governance before it exists

---

## 8. First-run onboarding strategy

### Current problem
Workora has real capability, but a first-time user still has to mentally compose several concepts:
- workspace
- machine
- daemon
- repo
- agent
- skill
- task
- branch
- review channel

That is too much cognitive load for first-run activation.

### Onboarding goal
A fresh user should reach **first completed repo task** in under 10 minutes on a clean install.

### Activation moment
The activation event is not "workspace created" or "machine connected".

The activation event is:

> **An agent completes a real repo task and reports back with branch, diff, and test evidence.**

Everything in onboarding should be optimized around reaching that moment quickly.

---

## 9. First-run onboarding flow

### Step 0: Fresh install guard
Condition:
- no existing users or only bootstrap owner

Entry:
- first owner account creation
- workspace creation

Success state:
- user lands in a guided setup flow, not a blank app shell

### Step 1: Welcome and choose goal
Screen title:
- **What do you want Workora to do first?**

Options:
- Ship work on a repo
- Set up an autonomous team
- Explore the workspace first

Default recommended option:
- Ship work on a repo

Why:
This establishes the repo-first wedge immediately.

### Step 2: Connect a machine
Screen title:
- **Connect the machine where agents will run**

UI should show:
- one command to copy
- short explanation of daemon role
- success state when machine heartbeat appears

Important UX details:
- explain that code stays on the user's machine
- show compatibility requirements briefly
- if a machine is already connected, auto-skip

Success state:
- machine appears as available
- CTA becomes **Import a repo**

### Step 3: Import a repo
Screen title:
- **Import your first repo**

Fields:
- git URL
- machine picker
- optional project name override

System behavior:
- run clone through the daemon
- detect stack if possible
- create project record
- create project engineering channel

Success state:
- project imports successfully
- user sees repo summary card with branch, machine, path, and detected stack

### Step 4: Create the team
Screen title:
- **Choose the team that should work on this repo**

Options:
- Bug-fix squad
- Feature pod
- Solo engineer
- Custom

Recommended default:
- Solo engineer for the lightest path

Feature pod can include:
- implementer
- reviewer
- verifier

System behavior:
- create agents with sane defaults
- bind them to the imported project
- assign recommended skills by detected stack when available

Success state:
- the bound agents appear in a project-ready panel

### Step 5: Give the first task
Screen title:
- **Give Workora its first task**

Prompt box should include examples based on stack and template, e.g.:
- Fix the failing login test and push the branch
- Add a health endpoint and test it
- Audit the auth flow for security issues and propose a patch

System behavior:
- task is created
- suggested agent is preselected
- user can confirm assignment in one click

Success state:
- task moves to claimed
- live activity stream starts

### Step 6: Watch execution
Screen title:
- **Workora is shipping the task**

This screen should not feel like dead waiting.
It should show:
- active agent
- current branch
- latest messages
- latest tool activity
- test status if available
- ability to open related thread or project channel

Optional controls:
- pause
- stop
- ask a question
- request approval when needed

### Step 7: Review result
Screen title:
- **Your first task is ready**

Show:
- branch name
- files changed
- summary from the agent
- test output
- link to the branch review channel
- checkpoint saved indicator if applicable

Actions:
- open review channel
- ask for revisions
- merge externally
- assign next task

This is the activation moment.

### Step 8: Expand usage
After the first task, guide the user into the next actions:
- add another repo
- add more agents
- install skills
- enable approval rules
- schedule a follow-up task

---

## 10. Onboarding empty states and guidance

### Empty state: no machine
Headline:
- No machine connected yet
Body:
- Agents run through the Workora daemon on a machine you control. Connect one machine to start importing repos and assigning work.
CTA:
- Connect a machine

### Empty state: no projects
Headline:
- Start with one repo
Body:
- Import a git repo, bind an agent, and let Workora open the first branch and task thread.
CTA:
- Import a repo

### Empty state: no agents bound to project
Headline:
- Add a team to this repo
Body:
- Bind one or more agents so Workora can edit code, run tests, and report back in the project workspace.
CTA:
- Create team

### Empty state: no tasks yet
Headline:
- Give the repo its first task
Body:
- Ask for a bug fix, feature, audit, or cleanup. Workora will assign the work, create a branch, and report progress live.
CTA:
- Create first task

---

## 11. Suggested template teams

### Solo engineer
Best for founders and first-run simplicity.
- 1 coding agent
- branch + test + report loop

### Bug-fix squad
- triage agent
- implementer
- verifier

### Feature pod
- implementer
- reviewer
- QA verifier

### Agency client pod
- one project manager agent
- one implementer
- one reporting/review agent

These templates should be simple presets, not giant org charts.

---

## 12. Approval and trust points in onboarding

Even before the full approval system is built, onboarding should set the right expectation.

### What to explain clearly
- agents run on your machine
- work is visible in channels and threads
- repo changes happen on branches
- tests can be shown before handoff
- risky actions can require human approval

### What not to imply yet
- automatic merging without guardrails
- full production deployment autonomy by default
- enterprise-grade policy engine if it is not shipped

---

## 13. Metrics to optimize

### Homepage metrics
- visitor to primary CTA click
- visitor to docs click
- visitor to signup or workspace entry

### Activation metrics
- time to machine connected
- time to repo imported
- time to first agent task assigned
- time to first completed repo task
- percentage of new workspaces that reach first completed task

### Trust metrics
- percentage of tasks reviewed after completion
- percentage of tasks with visible test evidence
- percentage of users who assign a second task after first completion

---

## 14. Recommended implementation order

### Phase 1
- rewrite landing hero and section order around repo-first execution
- add onboarding shell and state machine
- add machine → repo → team → first task guided flow

### Phase 2
- add template teams
- add stack-aware recommended prompts and skills
- improve project summary and result review screens

### Phase 3
- add approval gates, budgets, and richer audit summaries
- add PR-native flow and stronger branch lifecycle controls

---

## 15. Concrete next build tasks

1. Replace current landing hero copy with repo-first promise
2. Reorder landing sections to show import → team → task → review flow
3. Add a first-run setup wizard entry condition for fresh workspaces
4. Build machine connection step UI with success detection
5. Build project import step UI with repo-first framing
6. Add template-based team creation for a project
7. Add guided first-task prompt suggestions
8. Add a dedicated "task in progress" onboarding state
9. Add a result-review screen with branch, test, and channel links
10. Instrument activation metrics for the whole flow

---

## 16. Recommended next implementation artifact

The next concrete artifact after this spec should be a UI implementation plan that maps:
- homepage sections to existing `Landing.tsx` blocks
- onboarding steps to existing app routes and components
- missing backend/state requirements for each onboarding step

That follow-up plan should be implementation-first, not another strategy document.
