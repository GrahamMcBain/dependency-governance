# Build your own Claude Code plugin

Here is how to build your own plugin for a different workflow in your org. You have seen `dependency-governance`. The recipe is the same for any job your team keeps repeatedly dealing with, whether that is a compliance check, a code standard, or a release gate.

## Think of a plugin as a single-purpose teammate

Hand it one repetitive job and tool it up to do it well. A plugin is built from four parts, and the whole skill is knowing which one does what.

| Part | What it is | When to use it |
|---|---|---|
| **Agent** | A focused sub-assistant with its own instructions and tools | To own a whole workflow: inspect, decide, explain |
| **Skill** | Reusable knowledge the model applies, like a playbook | When you have domain logic the agent should follow every time |
| **Hook** | Deterministic code that fires on an event and can block it | For enforcement, when "the model should check" is not enough |
| **MCP** | A connection to an external system | When you need live data from outside the repo, like an API |

## Start with the bare minimum, then add only what you need

The smallest useful plugin is just **one agent and one skill.** The agent runs the workflow, the skill gives it the knowledge to do it well. That is a complete, working plugin. Ship that first.

From there, add a piece only if your use case actually needs it:

- Add a **hook** if you want **enforcement**: something that blocks an action no matter what the model decides. Our commit block is a hook.
- Add an **MCP** if you need to **connect to an external source**, like Artifactory or an internal API, instead of a local file.

One architecture rule, because it is the mistake everyone makes: **only `plugin.json` goes inside `.claude-plugin/`. Your `agents/`, `skills/`, and `hooks/` folders all go at the plugin root.** Do not nest them inside `.claude-plugin/`.

And keep it tiny. If you cannot say what the plugin does in a couple of sentences, it is too big. Split it.

## A prompt to build your first plugin

Run this inside Claude Code, in the codebase you want the plugin to work on. Fill in the bracketed parts at the top. Leave the bottom half exactly as written, because that is what makes Claude Code scaffold it correctly.

```
I want to build a Claude Code plugin. Here is my use case:

- What it should do, in one or two sentences: [your answer]
- The workflow in one sentence: [when X happens, do Y]
- Language or ecosystem: [e.g. Python, Go, Terraform]
- Pieces I think I need: one agent and one skill
    [add: plus a hook, if I need to block or enforce something]
    [add: plus an MCP, if I need to connect to an external system like ____]
- My codebase: you are running inside it. Look at the existing structure first.

Build it using these rules:
- Put ONLY plugin.json inside .claude-plugin/. Put agents/, skills/, and
  hooks/ at the plugin root.
- The agent (agents/<name>.md) owns the workflow: it inspects, decides, and
  explains. Give it a name, a description, and a tools: allowlist limited to
  what it actually needs.
- The skill (skills/<name>/SKILL.md) holds the reusable knowledge the agent
  applies. Start it with a description line so the model knows when to use it.
- If there is a hook, put it in hooks/hooks.json with a matcher and a command.
  The command reads the tool call as JSON on stdin, and exit code 2 blocks the
  action. Make any script it runs self-locating so it works from any directory.
- If there is an MCP, add a single .mcp.json at the plugin root using the
  standard MCP schema.
- Keep the scope small. When you are done, run `claude plugin validate`, then
  tell me exactly how to test it in a fresh session.
```

Once it builds, validate it and try it from a fresh clone. If it works cold, it will work for your whole team.
