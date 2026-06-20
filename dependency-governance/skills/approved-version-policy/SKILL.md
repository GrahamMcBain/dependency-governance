---
description: Interpret the org's approved-version dependency policy. Use when auditing dependencies, explaining a blocked commit, or deciding whether a package version is allowed.
---

# Approved-version policy

Classify each dependency into one of:

- approved: declared version >= required version. No action.
- required_update: declared version < required version. Must be bumped.
- unknown: no policy entry exists for this package.

When reporting required_update, always give: package name, current version,
required version, and the policy reason if present. State whether the bump is
major, minor, or patch so the developer can gauge risk.

Fallback for unknown dependencies (no policy entry): warn and continue. Name the
unknown packages so the security owner can decide whether to add a policy, but do
not block on them.

Keep guidance concise and actionable. Never invent a required version that is not
in the policy.
