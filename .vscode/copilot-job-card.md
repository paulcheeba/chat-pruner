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

### Versioning & Verification

After code, propose the next version bump in v13.1.1.1.0 format and explain which digit changes and why. Add a Verification Checklist for Foundry (SC on/off).

## Task Details

Goal: Separate appv1 from appv2 versions, transition the current build from v1 to v2 including toolbar button callback, remove v1 entirely from the module.

Phase 1: Preparation (Before Removing V1)

1. Extract Shared Code
   Create chat-pruner-shared.js with:

- Message collection/sorting logic
- Delete operations (deleteMessagesByIds)
- Permission utilities
- Shared constants and configurations

2. Update V1 and V2 to Use Shared Code

- Import shared utilities in module.js and module-v2.js
- Ensure V2 is completely independent of V1 code
- Test V1 and V2 thoroughly with shared utilities

3. Pause here and do a test cycle. When testing is concluded to be free of errors proceed with phase 2

Phase 2: Resume working on chat-pruner - Toolbar Transition 4. Update Toolbar Registration
In module.js, change the toolbar button handler eg:

// OLD: Opens V1
ChatPrunerApp.open()

// NEW: Opens V2 (with V1 fallback)
if (game.modules.get('fvtt-chat-pruner')?.api?.openV2) {
game.modules.get('fvtt-chat-pruner').api.openV2();
} else {
ChatPrunerApp.open(); // Fallback to V1
}

4.1. Pause here and do a test cycle. When testing is concluded to be free of errors proceed with phase 3

Phase 3: Clean Removal Strategy 5. File Structure After Cleanup:
chat-pruner/
├── .github/workflows/untouched
├── .vscode/untouched
├── sessions/untouched
├── module.json (keep - update esmodules)
├── chat-pruner-app.js (NEW: V2 becomes primary)
├── chat-pruner-shared.js (NEW: shared utilities)
├── templates/chat-pruner.hbs (V2 template)
├── styles.css (keep - may need updates)
└── README.md, etc. 6. Gradual V1 Removal Steps:
Move V2 to primary position: Rename module-v2.js → chat-pruner-app.js
Update module.json: Change esmodules to load the new files
Remove V1 template: Delete old chat-pruner.hbs
Remove V1 code: Delete old ApplicationV1 class from module.js
Update API: Make V2 the default api.open() method

Benefits After Cleanup
Advantages:
Cleaner codebase: Single application implementation
Better maintenance: No duplicate functionality
Modern patterns: Pure ApplicationV2 architecture
Smaller bundle: Remove legacy code and dependencies
User clarity: One interface, no confusion

Risks to Mitigate:
Foundry version compatibility: Ensure V2 works on target Foundry versions
Feature parity: Verify all V1 functionality exists in V2
User workflow: Maintain familiar UX patterns
Rollback plan: Keep V1 in a branch for emergency restoration

Recommended Timeline:
Next version (13.1.5.1): Phase 1 - Extract shared utilities, strengthen V2
Version 13.1.5.2: Phase 2 - Toolbar points to V2 by default
Version 13.1.5:3: Phase 3 - Complete V1 removal (breaking change)
This approach ensures V2 is rock-solid before removing the safety net of V1!
