# dependency-governance

A Claude Code plugin that keeps a project's dependencies compliant with your organization's **approved-version policy**, caught in the dev loop instead of at build or deploy time.

## Who it's for

The **platform engineer who manages dependency governance across an entire organization**. They own which dependency versions every team is allowed to ship.

## What it does

When a big vulnerability is published, there is usually a good way to make the *main* fix. At Sourcegraph, for example, you can sweep and upgrade every affected repo at once. But that one-time fix does not stay fixed: nothing stops a developer from reintroducing the old, vulnerable version the next day, heads-down and not thinking about it. It then slips through until build, deploy, or never.

This plugin enforces the policy *in the dev loop* so that cannot happen quietly:

- **`dependency-governor` agent**: audits the project's `package.json` against the approved-version policy and explains exactly what is out of date and why. It flags packages with no policy entry instead of guessing, and it *suggests* fixes rather than silently applying them.
- **commit hook** (`PreToolUse`): the backstop. If you try to commit while a dependency violates policy, the commit is **blocked** with the reason, even if you ignored the agent's advice. This is deterministic. The model does not get a vote.
- **`approved-version-policy` skill**: the reusable knowledge for interpreting the policy (approved, required-update, or unknown) and communicating it.
- **policy file** (`policy/approved-versions.json`): the source of truth. In production you would swap the file read in `check-policy.mjs` for a call to Artifactory, Nexus, or an internal policy API.

The agent and the hook share a single engine, `check-policy.mjs`: the agent runs it in `--report` mode to advise, the hook runs it to block.

## Requirements

- [Claude Code](https://code.claude.com) (latest)
- Node.js 18+ (the policy engine is a dependency-free Node script)

## Repository layout

```
.
├── dependency-governance/          # the plugin
│   ├── .claude-plugin/plugin.json
│   ├── agents/dependency-governor.md
│   ├── skills/approved-version-policy/SKILL.md
│   ├── hooks/hooks.json
│   ├── hooks/check-policy.mjs       # shared policy engine
│   └── policy/approved-versions.json
├── sample-app/                     # a tiny npm project to try it against
│   └── package.json                # declares express ^4.18.2 (a deliberate violation)
├── BUILD-YOUR-OWN-PLUGIN.md        # one-page guide to building your own
└── README.md
```

## Install and try it in under 5 minutes

```bash
# 1. Clone
git clone https://github.com/<your-username>/dependency-governance.git
cd dependency-governance

# 2. Turn the bundled demo app into a git repo with a deliberate violation
cd sample-app
git init
git add package.json     # package.json declares express ^4.18.2, below the approved 5.1.0

# 3. Launch Claude Code with the plugin loaded.
#    Use a FRESH session. Plugin hooks activate on session start, not on /reload-plugins.
claude --plugin-dir ../dependency-governance
```

Then, inside the Claude Code session:

1. **`/hooks`**: confirm the `PreToolUse` (Bash) hook is listed. If it is not, quit and relaunch, because a cold session is what registers plugin hooks.
2. **`Use the dependency-governor agent to audit my dependencies.`** You will get a report: `express 4.18.2` must be `>= 5.1.0`, plus a warning that `lodash` has no policy entry.
3. **`Commit package.json with the message "test".`** The hook blocks the commit and tells you why.
4. **`Fix the violation and commit with the message "chore: bump express".`** The agent bumps express to `^5.1.0`, and the same commit now goes through.

That is the whole loop: audit, ignore, blocked, fix, allowed.

## Validate

```bash
claude plugin validate ./dependency-governance
```

## Limitations and scope

This enforces commits made **inside a Claude Code session**. To also cover commits made directly in a terminal, pair it with a real git `pre-commit` hook or a CI check that runs the same `check-policy.mjs`. That is a deliberate scope choice for a small, demonstrable plugin (see below).

## What I'd do with more time

I would replace the local policy file with a live **MCP connection** to the real source of truth (Artifactory or an internal policy service) so security can update approved versions centrally without anyone reinstalling the plugin. I would add **configurable enforcement modes** (force-update, developer-updates, or allow-with-a-flag-and-defer) so teams adopt at their own risk tolerance. And I would generate a companion **git `pre-commit` hook** from the same policy engine so enforcement also covers commits made outside a Claude Code session.
