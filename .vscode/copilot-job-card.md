### Impact Analysis First (no code yet)

@workspace
Before writing code, produce an Impact Analysis:

- Files to touch and why
- FVTT v13 APIs used/added
- Risks and rollback notes
  Do NOT write code yet.

### Proceed with Code (full files + diff)

Proceed. For only the files identified above:

- Show a unified diff.
- Then print the full updated file content (complete file, no ellipses).
- Keep all changes additive. No refactors or unrelated edits.

### FVTT API Guardrail

Use only the FVTT v13 APIs we already use in this repo. If unsure, add a TODO and a runtime guard instead of guessing.

### Simple Calendar Optionality

Detect SC v13 safely. If not present, no-op without errors.

### Versioning & Verification

After code, propose the next version bump in v13.1.1.1.0 format and explain which digit changes and why. Add a Verification Checklist for Foundry (SC on/off).
