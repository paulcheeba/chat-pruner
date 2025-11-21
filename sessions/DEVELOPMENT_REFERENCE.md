# Chat Pruner - Development Reference

**Version: 13.2.0.0 - STABLE BASELINE**

## 🏗️ Project Overview

**Module ID**: `fvtt-chat-pruner`
**Repository**: `paulcheeba/chat-pruner`
**Compatibility**: Foundry VTT v11-v13 (Smart version detection)
**Current Stable**: v13.2.0.0 ⭐ **(STABLE BASELINE - Native Form Controls)**
**Previous Baseline**: v13.1.5.0
**Last Development**: v13.1.6.0 _(Promoted to v13.2.0.0)_

## 📚 Essential References

### 🔗 **ApplicationV2 Conversion Guide**

**URL**: https://foundryvtt.wiki/en/development/guides/applicationV2-conversion-guide
**Critical for**: Understanding ApplicationV2 template parts, lifecycle methods, and HandlebarsApplicationMixin usage

### 🎯 **Key ApplicationV2 Insights**

- **Template Parts**: ApplicationV2 uses `PARTS` configuration instead of single template
- **Lifecycle Methods**: `getData()` becomes `_prepareContext()`
- **HandlebarsApplicationMixin**: Required for template rendering (`_renderHTML`, `_replaceHTML`)
- **Constructor Pattern**: All parameters go in single options object
- **Event System**: `activateListeners()` becomes `actions` configuration

## 📋 Paul's Development Rules & Workflow

### 🌿 Branch Management

- **ALWAYS create new branch BEFORE making any changes**
- Use version-based branch naming: `v13.1.4.x`
- Each feature/fix gets its own branch
- Clean git history is important

### 🚀 Release Workflow

1. **Pre-Release Testing**: Use `pre-release.yml` workflow for testing
2. **Full Releases**: Use `release.yml` workflow for production
3. **Foundry Submission**: Use `foundry-release.yml` for official package registry

### 📊 Paul's Versioning Scheme

**Module Version Format**: `v13.w.x.y.z`

- **v13** → Compatible FVTT version
- **w** → ATN major version (locked, stable, "everything perfect")
- **x** → ATN test version, building on the current major
- **y** → ATN test sub-version, building on the current test version
- **z** → ATN test sub-version hotfix

**Examples**:

- `v13.1.4.10` = FVTT v13, ATN major v1, test v4, sub-version 10
- `v13.2.0.0` = FVTT v13, ATN major v2 (stable milestone)
- `v13.1.4.10.1` = FVTT v13, ATN major v1, test v4, sub-version 10, hotfix 1

**Legacy Versioning**:

- **Stable releases**: `v1.x.x` series (current: v1.3.2)
- **V13 development**: `v13.1.x.x` series for Foundry v13 features

## Recent Issues & Fixes

### **v13.2.0.0: Root Cause Resolution - Foundry V13 FontAwesome Pseudo-Elements**

**THE BREAKTHROUGH:**

After extensive investigation and research into the Foundry VTT wiki, we discovered the root cause of the recurring form rendering issues that had been creating a symptom-chasing loop.

**Root Cause Identified:**

Foundry VTT V13 uses FontAwesome icons rendered via CSS `::before` and `::after` pseudo-elements on form inputs (checkboxes and radio buttons). The system:
1. Hides the native browser form controls
2. Creates pseudo-elements positioned over the inputs
3. Styles those pseudo-elements with FontAwesome icons

**Why It Failed in Chat Pruner:**

- ApplicationV2 with `tag: "section"` doesn't provide the HTML structure Foundry's CSS expects
- Without proper parent context, pseudo-elements don't render on initial load
- Clicking triggers CSS recalculation, making pseudo-elements appear
- The `:checked` state creates NEW pseudo-elements, causing visual artifacts/overlays

**The Symptom Loop We Were Stuck In:**
1. Without CSS overrides → Buttons invisible (pseudo-elements don't render)
2. Add JavaScript inline styles → Buttons appear but get weird overlays when checked
3. Try to fix overlays → Buttons disappear again
4. Repeat...

**The Solution:**

Stop fighting Foundry's FontAwesome system and force native browser controls instead:

```css
/* Force native browser controls */
.fvtt-chat-pruner .cell.cb input[type="checkbox"],
.fvtt-chat-pruner .cell.anchor input[type="radio"] {
  appearance: auto !important;
  accent-color: #EE9B3A;  /* Custom orange color */
}

/* Remove Foundry's pseudo-elements for BOTH states */
input[type="checkbox"]::before,
input[type="checkbox"]::after,
input[type="radio"]::before,
input[type="radio"]::after,
input[type="checkbox"]:checked::before,
input[type="checkbox"]:checked::after,
input[type="radio"]:checked::before,
input[type="radio"]:checked::after {
  content: none !important;
  display: none !important;
}
```

**Results:**
- Clean native browser controls from initial render
- No JavaScript manipulation needed in `_onRender`
- Custom orange accent color (#EE9B3A)
- Zero visual artifacts in any state
- Works perfectly across all interactions

**Key Documentation Source:**
Foundry VTT Wiki ApplicationV2 Conversion Guide explicitly states:
> "Checkboxes are now using FontAwesome icons instead of checkboxes, and styling them is now very tricky. You must style the 'before' and 'after' pseudo-elements of the checkbox, not the checkbox itself. You will also have to style the 'active' state of the checkbox for before and after pseudo-elements."

### **v13.1.4.10 → v13.1.4.11: Form Interaction Issues**

**Problems Identified:**

- ❌ Radio buttons not rendering until clicked multiple times
- ❌ Entire rows showing pointer cursor (acting like buttons)
- ❌ "No deletable messages" error when using anchor operations
- ❌ Leftover `canDelete` permission checks causing failures

**Root Causes:**

- CSS `cursor: pointer` on `.pruner-row` making entire rows appear clickable
- Missing CSS overrides for radio button visibility in Foundry environment
- Anchor deletion methods still filtering by `r.canDelete` (removed property)

**Solutions Applied:**

- ✅ Remove `cursor: pointer` from `.pruner-row` CSS
- ✅ Add explicit CSS to ensure radio/checkbox visibility and interaction
- ✅ Remove all `canDelete` filtering from anchor deletion methods
- ✅ Simplified permission model (GM-only access = all messages deletable)

**Testing Results (v13.1.4.10):**

- ✅ Checkboxes working properly
- ✅ Delete Selected functional
- ✅ Refresh, About, Select All working
- ✅ Message hover tooltips working
- ⚠️ Radio buttons still problematic (fixed in v13.1.4.11)

### **v13.1.4.11 → v13.1.4.12: V13 Compatibility & DialogV2 Migration**

**Problems Identified:**

- ❌ Radio buttons still not rendering (V13 CSS changes)
- ❌ V1 Application deprecation warnings from `Dialog.confirm()` usage
- ❌ V13 changed form elements to use FontAwesome icons, affecting visibility

**Root Causes:**

- V13 changed checkbox/radio button styling to FontAwesome icons
- Old `Dialog.confirm()` uses deprecated V1 Application framework
- Need `appearance: auto` to override V13's custom form styling
- Missing specific CSS overrides for V13 form element changes

**Solutions Applied:**

- ✅ Replace all `Dialog.confirm()` with `foundry.applications.api.DialogV2.confirm()`
- ✅ Replace `new Dialog()` with `foundry.applications.api.DialogV2.prompt()`
- ✅ Add explicit CSS overrides for radio buttons with `appearance: auto`
- ✅ Force native form element appearance with `!important` rules
- ✅ Ensure proper z-index and dimensions for form elements

**V13 Compatibility Notes:**

- DialogV2.confirm() uses `window: { title }` instead of `title` property
- DialogV2.prompt() uses `ok: { label }` instead of `buttons: { ok: { label } }`
- Form elements require explicit `appearance: auto` in V13 to show native controls

### **v13.1.4.12 → v13.1.5.0: STABLE BASELINE ESTABLISHED** ⭐

**Achievement Summary:**

- ✅ Complete ApplicationV2 implementation with full V1 feature parity
- ✅ All form interaction issues resolved (radio buttons, checkboxes working perfectly)
- ✅ V13 compatibility fully achieved with DialogV2 migration
- ✅ All deprecation warnings eliminated
- ✅ User testing confirms "working as expected"
- ✅ Production-ready stable implementation

**Baseline Status:**

- **v13.1.5.0** established as new stable baseline for all future development
- All ApplicationV2 lifecycle methods properly implemented (`_onRender`, `_prepareContext`)
- Complete DialogV2 migration for V13 compatibility
- Comprehensive CSS fixes for V13 form element styling
- Ready for production deployment and future feature development

**Key Accomplishments:**

- Successfully migrated from V1 Application to ApplicationV2 framework
- Resolved complex form interaction issues through proper lifecycle management
- Achieved complete V13 compatibility with modern Foundry APIs
- Established solid foundation for future Chat Pruner development

## 🏛️ Technical Architecture

### File Structure

```
chat-pruner/
├── chat-pruner-shared.js   # Shared utilities for V1 and V2
├── chat-pruner-v1.js        # V1 Application (v11 compatibility)
├── chat-pruner-v2.js        # V2 Application (v12+ ApplicationV2)
├── module.json              # Manifest
├── styles.css               # Styling with native form control overrides
└── templates/
    ├── chat-pruner-v1.hbs   # V1 template
    └── chat-pruner-v2.hbs   # V2 template
```

### Module APIs

#### V1 API (Foundry v11)

```javascript
// Access: game.modules.get('fvtt-chat-pruner')?.api?.open()
// Class: ChatPrunerApp extends Application
// Features: Full functionality, delete operations, anchors
// Used automatically on Foundry v11
```

#### V2 API (Foundry v12+)

```javascript
// Access: game.modules.get('fvtt-chat-pruner')?.api?.openV2()
// Class: ChatPrunerAppV2 extends ApplicationV2
// Features: Full functionality with modern ApplicationV2 framework
// Used automatically on Foundry v12+
```

#### Smart Version Detection

The toolbar button automatically detects Foundry version and opens the appropriate interface:
- **v11**: Uses V1 Application (maximum compatibility)
- **v12+**: Uses V2 ApplicationV2 (modern framework)

## 🧩 Foundry VTT API References

### ApplicationV2 Availability

- **Global**: `ApplicationV2` (not available in v13.350)
- **Namespace**: `foundry.applications.api.ApplicationV2` ✅ (available in v13.350)
- **HandlebarsApplicationMixin**: `foundry.applications.api.HandlebarsApplicationMixin` ✅
- **Detection**: Check both namespaces for compatibility

### ApplicationV2 Implementation Patterns

```javascript
// Correct V2 Pattern
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class MyApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "my-app",
    classes: ["my-app"],
    tag: "section",
    position: { width: 640, height: 480 },
  };

  static PARTS = {
    main: {
      template: "path/to/template.hbs",
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    // Add data here
    return context;
  }
}
```

### Key FVTT APIs Used

```javascript
// Core APIs
game.messages; // ChatMessage collection
game.user.isGM; // GM permission check
game.modules.get(moduleId); // Module access
ui.notifications.warn(); // User notifications

// V13 Specific
foundry.applications.api.ApplicationV2; // V2 base class
game.messages.contents; // Preferred over .values()
```

### Cross-Version Compatibility Patterns

```javascript
// Defensive programming examples
const collection = game.messages;
const all = Array.from(collection.contents ?? collection.values?.() ?? []);

// Permission checking
function canDeleteMessage(msg, user) {
  if (user?.isGM) return true;
  if (typeof msg?.canUserModify === "function")
    return msg.canUserModify(user, "delete");
  return !!msg.isOwner;
}
```

## 🚨 Known Issues & Solutions

### ApplicationV2 Empty Content Issue

**Problem**: ApplicationV2 window opens but shows no content
**Root Cause**: Missing `PARTS` configuration - ApplicationV2 requires template parts, not single template
**Solution**: Define `PARTS` static property with template configuration

```javascript
static PARTS = {
  main: {
    template: "modules/fvtt-chat-pruner/templates/chat-pruner-v2.hbs"
  }
};
```

### ApplicationV2 Not Defined Error

**Problem**: `ApplicationV2 is not defined` in some Foundry versions
**Root Cause**: ApplicationV2 available as `foundry.applications.api.ApplicationV2`
**Solution**: Check both global and namespaced versions

```javascript
const ApplicationV2Class =
  globalThis.ApplicationV2 || foundry?.applications?.api?.ApplicationV2;
```

### Module Loading Order

**Pattern**: Wrap ApplicationV2 class in availability check
**Fallback**: Provide no-op class with helpful error messages

## 📦 GitHub Actions Workflows

### Pre-Release Workflow (`pre-release.yml`)

- **Trigger**: Manual dispatch
- **Purpose**: Testing versions
- **URL**: `https://github.com/paulcheeba/chat-pruner/actions/workflows/pre-release.yml`
- **Assets**: Creates pre-release with test manifest URL

### Full Release Workflow (`release.yml`)

- **Trigger**: Manual dispatch
- **Purpose**: Production releases
- **Features**: Updates main branch, creates stable release

### Foundry Package Workflow (`foundry-release.yml`)

- **Trigger**: Manual dispatch
- **Purpose**: Submit to Foundry's official package registry
- **Features**: API-based submission with dry-run support

## 🧪 Testing & Debugging

### Diagnostic Macro Template

```javascript
// Chat Pruner Diagnostic Template
try {
  console.log("=== Chat Pruner Diagnostic ===");
  console.log("Foundry Version:", game?.version);
  console.log("Global ApplicationV2:", typeof ApplicationV2 !== "undefined");
  console.log(
    "foundry.applications.api.ApplicationV2:",
    typeof foundry?.applications?.api?.ApplicationV2 !== "undefined"
  );

  const module = game.modules.get("fvtt-chat-pruner");
  console.log("Module loaded:", !!module);
  console.log("V1 API:", !!module?.api?.open);
  console.log("V2 API:", !!module?.api?.openV2);

  // Test specific functionality here
} catch (error) {
  console.error("Diagnostic Error:", error);
}
```

### Common Test Cases

1. **V1 Functionality**: Basic chat pruning operations
2. **V2 Interface**: ApplicationV2 loading and display
3. **Permission Checks**: GM-only access enforcement
4. **Cross-Version**: Test in multiple Foundry versions

## 📝 Development Notes

### Current Development Focus

- ApplicationV2 implementation for future compatibility
- Maintaining V1 stability while adding V2 features
- Cross-version compatibility (v11-v13)

### Architecture Decisions

- **Additive approach**: V2 doesn't replace V1, extends alongside
- **Defensive programming**: Extensive null checks and fallbacks
- **Namespace flexibility**: Support both global and scoped API access

### Code Standards

- Use optional chaining (`?.`) for safety
- Provide meaningful error messages to users
- Log diagnostic information for debugging
- Maintain backward compatibility

## Recent Changes Log

### v13.2.0.0 - NEW STABLE BASELINE: Native Form Controls & Root Cause Resolution

**MAJOR MILESTONE**: Broke the symptom-chasing loop by discovering and properly handling Foundry V13's FontAwesome pseudo-element system.

**Key Achievements:**
- Identified root cause: Foundry V13 uses `::before` and `::after` pseudo-elements with FontAwesome icons on form inputs
- Implemented minimal CSS solution: `appearance: auto` + pseudo-element removal for both unchecked and `:checked` states
- Removed all JavaScript workarounds from `_onRender` - CSS handles everything
- Added custom orange accent color (#EE9B3A) for form controls
- Enhanced About dialog with comprehensive UI guide (600x500, scrollable)
- Removed footer tip section for cleaner interface
- Zero visual artifacts in any interaction state

**Technical Implementation:**
- Pure CSS solution with no JavaScript manipulation
- Properly targets both base state and `:checked` state pseudo-elements
- Uses native browser controls instead of fighting Foundry's custom styling
- Clean, maintainable code with minimal overrides

**Status**: Production-ready stable baseline - form rendering issues completely resolved

### v13.1.6.0 - Smart Version Detection & File Reorganization

**Achievements:**
- Implemented automatic version detection in toolbar button
- Renamed files for clarity: `module.js` → `chat-pruner-v1.js`, etc.
- Created shared utilities module (`chat-pruner-shared.js`)
- Toolbar automatically selects V1 (v11) or V2 (v12+) based on Foundry version
- Broad compatibility matrix (v11-v13)

### v13.1.5.0 - ApplicationV2 Migration Complete

- **MILESTONE**: Successfully implemented fully functional ApplicationV2 interface
- Complete V2 template overhaul matching V1 functionality and design
- Resolved all ApplicationV2 rendering issues using proper PARTS configuration
- Added ApplicationV2 conversion guide reference for future development
- V2 interface now provides professional, production-ready preview experience
- **Status**: ApplicationV2 conversion complete - ready for future functionality expansion

### v13.1.4.6 - ApplicationV2 PARTS Configuration Fix

- **CRITICAL**: Fixed empty content issue with proper static PARTS configuration
- Replaced deprecated single template property with ApplicationV2 template parts system
- Added ApplicationV2 conversion guide reference to Development Reference
- Simplified implementation leveraging HandlebarsApplicationMixin correctly

### v13.1.4.5 - Deprecation Warning and Content Display

- Fixed ChatMessage deprecation warning (m.user → m.author for v12+ compatibility)
- Enhanced ApplicationV2 lifecycle method support with \_preparePartContext
- Added comprehensive debug logging for troubleshooting

### v13.1.4.4 - ApplicationV2 Render Method Implementation

- Fixed ApplicationV2 render method errors with HandlebarsApplicationMixin integration
- Added fallback \_renderHTML and \_replaceHTML methods for compatibility
- Enhanced ApplicationV2 compatibility with proper render method implementation

### v13.1.4.3 - Version Tracking & Development Workflow

- Added version headers to all source files (module.js, module-v2.js, styles.css, templates)
- Updated README.md with current version tracking
- Created comprehensive CHANGELOG.md with version history
- Enhanced development workflow with standardized version management

### v13.1.4.2 - ApplicationV2 Namespace Fix

- Fixed ApplicationV2 detection to use `foundry.applications.api.ApplicationV2`
- Added dual namespace checking (global + foundry.applications.api)
- Enhanced diagnostic logging
- Resolved "ApplicationV2 not defined" error

### v13.1.4.1 - Enhanced Diagnostics

- Added comprehensive ApplicationV2 availability checking
- Improved error handling and user feedback
- Better debugging information

### v13.1.4.0 - Initial V2 Implementation

- Added ApplicationV2-based interface (read-only)
- Maintained full V1 compatibility
- Added graceful fallback for missing ApplicationV2

---

## 📌 Quick Reference Commands

```bash
# Create new branch (ALWAYS FIRST)
git checkout -b v13.1.4.x

# Commit changes
git add . && git commit -m "Description"

# Push new branch
git push -u origin v13.1.4.x

# Access APIs in Foundry
game.modules.get('fvtt-chat-pruner')?.api?.open()     # V1
game.modules.get('fvtt-chat-pruner')?.api?.openV2()   # V2
```

---

## Critical Lessons Learned

### The Foundry V13 Form Rendering Mystery

**The Problem:**
Form inputs (radio buttons, checkboxes) wouldn't render until clicked, then would show visual artifacts when selected.

**What We Tried:**
- CSS visibility overrides
- JavaScript inline style manipulation
- Various `appearance` property combinations
- Different ApplicationV2 configurations (`tag: "form"` vs `tag: "section"`)

**What We Learned:**
Don't try to make Foundry's FontAwesome pseudo-element system work in incompatible contexts. Instead, explicitly opt out with:
1. `appearance: auto !important` to force native controls
2. Remove pseudo-elements for BOTH base and `:checked` states
3. No JavaScript manipulation needed

**Key Resources:**
- Foundry VTT Wiki: ApplicationV2 Conversion Guide
- Specifically the section on form element styling with FontAwesome

---

_Last Updated: November 21, 2025_
_Current Version: 13.2.0.0_
_Maintained by: GitHub Copilot + Paul Cheeba_
