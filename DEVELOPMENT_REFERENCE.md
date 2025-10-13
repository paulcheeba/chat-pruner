# Chat Pruner - Development Reference

**Version: 13.1.4.7**

## 🏗️ Project Overview

**Module ID**: `fvtt-chat-pruner`
**Repository**: `paulcheeba/chat-pruner`
**Compatibility**: Foundry VTT v11-v13
**Current Stable**: v1.3.2
**Current Development**: v13.1.4.7 ⭐ **(NEW BASELINE)**

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

### 📊 Versioning Strategy

- **Stable releases**: `v1.x.x` series (current: v1.3.2)
- **V13 development**: `v13.1.x.x` series for Foundry v13 features
- **Incremental**: Each fix/feature increments last digit

## 🔧 Technical Architecture

### 📁 File Structure

```
chat-pruner/
├── module.js           # V1 Application (main functionality)
├── module-v2.js        # V2 Application (future compatibility)
├── module.json         # Manifest
├── styles.css          # Styling
└── templates/
    ├── chat-pruner.hbs     # V1 template
    └── chat-pruner-v2.hbs  # V2 template
```

### 🎯 Module APIs

#### V1 API (Stable)

```javascript
// Access: game.modules.get('fvtt-chat-pruner')?.api?.open()
// Class: ChatPrunerApp extends Application
// Features: Full functionality, delete operations, anchors
```

#### V2 API (Development)

```javascript
// Access: game.modules.get('fvtt-chat-pruner')?.api?.openV2()
// Class: ChatPrunerAppV2 extends ApplicationV2
// Features: Read-only view, future expansion
```

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

## 🔄 Recent Changes Log

### ⭐ v13.1.4.7 - NEW BASELINE: Complete ApplicationV2 Success
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
- Enhanced ApplicationV2 lifecycle method support with _preparePartContext
- Added comprehensive debug logging for troubleshooting

### v13.1.4.4 - ApplicationV2 Render Method Implementation
- Fixed ApplicationV2 render method errors with HandlebarsApplicationMixin integration
- Added fallback _renderHTML and _replaceHTML methods for compatibility
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

_Last Updated: October 12, 2025_
_Current Version: 13.1.4.3_
_Maintained by: GitHub Copilot + Paul Cheeba_
