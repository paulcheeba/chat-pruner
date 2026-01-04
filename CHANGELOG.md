# Chat Pruner - Changelog

All notable changes to this project will be documented in this file.

## [13.2.1.0] - 2026-01-04 - 🔗 **Module Dependency & CSS Compatibility**

### ⚠️ **IMPORTANT: Foundry VTT v13+ Required**

This version requires **Foundry VTT v13 or higher**.

**If you are still using Foundry VTT v11 or v12**, please continue using **Chat Pruner v13.2.0.0**:

- **Manifest URL**: `https://github.com/paulcheeba/chat-pruner/releases/download/v13.2.0.0/module.json`

### 🔌 **New Dependency**

- ✅ **OverEngineeredVTT Suite Monitor**: Added required dependency on `oev-suite-monitor` module
  - Provides centralized monitoring and management capabilities
  - Automatic installation via Foundry's module dependency system
  - Repository: https://github.com/paulcheeba/OverEngineeredVTT-Suite-Monitor

### 📦 **Files Modified**

- `module.json`: Added `relationships.requires` with oev-suite-monitor dependency, updated compatibility to v13+

## [13.2.0.0] - 2025-11-20 - 🎨 **NEW STABLE BASELINE: Native Form Controls & UI Polish**

### 🌟 **MAJOR MILESTONE**: Root Cause Resolution & Clean UI Implementation

This release establishes **v13.2.0.0** as the new stable baseline, resolving the fundamental form rendering issues by understanding and properly overriding Foundry V13's FontAwesome pseudo-element system.

### 🚀 **Key Achievements**

#### **Form Controls - Root Cause Fixed**

- ✅ **FontAwesome Pseudo-Element Discovery**: Identified that Foundry V13 uses `::before` and `::after` pseudo-elements with FontAwesome icons on form inputs
- ✅ **Minimal CSS Solution**: Reduced to only essential overrides (`appearance: auto` + pseudo-element removal)
- ✅ **Both States Handled**: Properly removes pseudo-elements for both unchecked AND `:checked` states
- ✅ **Zero JavaScript Manipulation**: Removed all inline style workarounds from `_onRender` method
- ✅ **Clean Native Controls**: Pure browser radio buttons and checkboxes with no visual artifacts

#### **Custom Styling**

- ✅ **Orange Accent Color**: Custom `accent-color: #EE9B3A` for checkboxes and radio buttons
- ✅ **Consistent Appearance**: Native browser controls maintain clean styling throughout all interactions
- ✅ **No Overlay Issues**: Complete elimination of the FontAwesome icon overlay artifacts

#### **UI Improvements**

- ✅ **Removed Tip Section**: Cleaner footer with just action buttons
- ✅ **Enhanced About Dialog**:
  - Larger dialog (600x500) for better readability
  - Scrollable content area
  - Comprehensive interactive UI guide
  - Formatted sections with proper headings
  - Detailed explanations of all controls and features

### 🔧 **Technical Implementation**

#### **CSS Solution** (styles.css)

```css
/* Force native browser controls */
.fvtt-chat-pruner .cell.cb input[type="checkbox"],
.fvtt-chat-pruner .cell.anchor input[type="radio"] {
  appearance: auto !important;
  accent-color: #ee9b3a;
}

/* Remove Foundry's FontAwesome pseudo-elements (unchecked) */
input[type="checkbox"]::before,
input[type="checkbox"]::after,
input[type="radio"]::before,
input[type="radio"]::after {
  content: none !important;
  display: none !important;
}

/* CRITICAL: Remove pseudo-elements for :checked state too */
input[type="checkbox"]:checked::before,
input[type="checkbox"]:checked::after,
input[type="radio"]:checked::before,
input[type="radio"]:checked::after {
  content: none !important;
  display: none !important;
}
```

#### **JavaScript Cleanup** (chat-pruner-v2.js)

```javascript
// Simplified _onRender - no form manipulation needed
_onRender(context, options) {
  console.log(`${MOD} | _onRender called - DOM ready`);
  // CSS handles everything - no JavaScript manipulation required
}
```

### 📚 **Research & Documentation**

- ✅ **Foundry Wiki Research**: Discovered official documentation confirming V13's FontAwesome form styling
- ✅ **Root Cause Analysis**: Broke the symptom-chasing loop by identifying the underlying pseudo-element system
- ✅ **Knowledge Transfer**: Comprehensive session documentation for future reference

### 🎯 **Breaking the Loop**

This release resolves the recurring issue where:

1. **Without CSS**: Foundry's pseudo-elements don't render initially (structural mismatch)
2. **With incomplete CSS**: `:checked` state triggers new pseudo-elements creating overlays
3. **With complete CSS**: Both states properly handled, no pseudo-elements, clean native controls

### 📦 **Files Modified**

- `styles.css`: Minimal essential CSS overrides for form controls
- `chat-pruner-v2.js`: Cleaned `_onRender` method, enhanced About dialog
- `templates/chat-pruner-v2.hbs`: Removed tip section from footer

### 🧪 **Testing Confirmed**

- ✅ Radio buttons render cleanly on initial load
- ✅ Checkboxes render cleanly on initial load
- ✅ No visual artifacts when selecting controls
- ✅ Custom orange accent color displays correctly
- ✅ All form interactions work flawlessly
- ✅ Zero deprecation warnings
- ✅ Compatible with Foundry v12-v13

---

## [13.1.6.0] - 2025-10-15 - 🎯 **Smart Version Detection**

### 🌟 **MAJOR MILESTONE**: Universal Foundry Compatibility (v11-v13)

This release establishes **v13.1.6.0** as the new stable baseline, featuring intelligent version detection that automatically selects the optimal application interface based on the user's Foundry VTT version.

### 🚀 **Key Achievements**

#### **Smart Version Detection System**

- ✅ **Automatic Interface Selection**: Detects Foundry version and chooses ApplicationV2 (v12+) or ApplicationV1 (v11)
- ✅ **Broad Compatibility**: Supports Foundry VTT v11-v13 with optimal experience on each version
- ✅ **Zero Breaking Changes**: Seamless upgrade path for all existing users
- ✅ **Future-Proof Architecture**: Ready for upcoming Foundry versions

#### **File Organization & Clarity**

- ✅ **Descriptive Filenames**:
  - `module.js` → `chat-pruner-v1.js`
  - `module-v2.js` → `chat-pruner-v2.js`
  - `chat-pruner.hbs` → `chat-pruner-v1.hbs`
- ✅ **Clear Module Structure**: Enhanced maintainability and development workflow
- ✅ **Updated Cross-References**: All documentation and manifest files updated

#### **Enhanced Compatibility Matrix**

- ✅ **Foundry v11**: Uses ApplicationV1 (maximum compatibility)
- ✅ **Foundry v12+**: Uses ApplicationV2 (optimal modern experience)
- ✅ **Shared Utilities**: Both applications use identical core functionality from `chat-pruner-shared.js`

### 🔧 **Technical Implementation**

```javascript
// Smart version detection in toolbar opener
const foundryVersion = parseInt(game.version?.split(".")?.[0] ?? "0");
if (foundryVersion >= 12 && module?.api?.openV2) {
  module.api.openV2(); // Modern ApplicationV2
} else if (module?.api?.open) {
  module.api.open(); // Compatible ApplicationV1
}
```

### 📦 **Files Modified**

- `module.json`: Updated version to 13.1.6.0, minimum compatibility to v11
- `chat-pruner-v1.js`: Renamed from module.js, smart version detection
- `chat-pruner-v2.js`: Renamed from module-v2.js, maintains V2 implementation
- `templates/chat-pruner-v1.hbs`: Renamed for clarity
- All documentation updated with new file references

---

## [13.1.5.0] - 2025-01-27 - 🌟 **STABLE BASELINE ESTABLISHED**

### 🎉 **MAJOR MILESTONE**: Complete ApplicationV2 Migration & V13 Compatibility

This release establishes **v13.1.5.0** as the new stable baseline, representing the successful completion of the ApplicationV2 migration with full V13 compatibility and production-ready quality.

### 🚀 **Key Achievements**

#### **ApplicationV2 Framework Complete**

- ✅ **Full V1 Feature Parity**: Complete migration from V1 Application to ApplicationV2
- ✅ **Lifecycle Methods**: Proper implementation of `_onRender`, `_prepareContext`, and all ApplicationV2 patterns
- ✅ **HandlebarsApplicationMixin**: Correct integration for template rendering
- ✅ **Action System**: Complete replacement of `activateListeners()` with ApplicationV2 actions

#### **Form Interaction Resolution**

- ✅ **Radio Button Fix**: Resolved invisibility issues through proper lifecycle management and CSS overrides
- ✅ **Checkbox Functionality**: All form elements now work perfectly with user interactions
- ✅ **CSS Compatibility**: Added `appearance: auto` overrides for V13 form element styling
- ✅ **Event Handling**: Proper form initialization in `_onRender` lifecycle method

#### **V13 Compatibility Complete**

- ✅ **DialogV2 Migration**: Complete replacement of deprecated `Dialog.confirm()` with `DialogV2.confirm()`
- ✅ **API Updates**: Updated all dialog usage to V13-compatible patterns
- ✅ **Deprecation Warnings**: Eliminated all V1 Application deprecation warnings
- ✅ **Modern Foundry APIs**: Full adoption of current Foundry VTT API standards

### 🔧 **Technical Improvements**

#### **Code Quality & Architecture**

- **Proper Lifecycle Management**: Implemented `_onRender` for form element initialization
- **Error Handling**: Enhanced error handling for all operations
- **Permission System**: Robust permission checking for message deletion
- **Clean Code Structure**: Well-organized ApplicationV2 patterns throughout

#### **User Experience**

- **Responsive Interface**: All form elements work immediately upon rendering
- **Clear Feedback**: Proper user feedback for all operations
- **Intuitive Controls**: Radio buttons and checkboxes behave as expected
- **Reliable Operations**: All delete operations work consistently

### 🧪 **Development Journey Highlights**

- **v13.1.4.7**: Initial ApplicationV2 template rendering
- **v13.1.4.8**: Full V1 functionality implementation
- **v13.1.4.9-11**: Form interaction debugging and fixes
- **v13.1.4.12**: V13 compatibility and DialogV2 migration
- **v13.1.5.0**: **Stable baseline establishment** ⭐

### 📋 **Production Ready Status**

- **User Testing**: Confirmed "working as expected" through comprehensive testing
- **Quality Assurance**: All major functionality verified and stable
- **Documentation**: Complete development reference and changelog
- **Future Ready**: Solid foundation for all future Chat Pruner development

---

## [13.1.4.8] - 2025-10-13

### 🎉 **MAJOR**: V2 Full Functionality Implementation

- **Complete V1 Feature Parity**: V2 now has all V1 functionality using ApplicationV2 patterns
- **ApplicationV2 Actions System**: Implemented proper action handlers for all buttons
- **Real Permission Checking**: V2 now uses actual message permissions, not read-only placeholders
- **Interactive Elements**: Enabled checkboxes, radio buttons, and all user interactions
- **Full Delete Operations**: Select, newer/older than anchor, with proper confirmations

### Added

- Static action methods following ApplicationV2 conversion guide patterns:
  - `_deleteSelected`, `_deleteNewerThanAnchor`, `_deleteOlderThanAnchor`
  - `_refresh`, `_about`, `_toggleSelectAll`, `_toggleRowSelection`
- Real permission checking with `_canDeleteMessage` method
- Bulk delete functionality with `_deleteMessagesByIds` helper
- Proper event handling through ApplicationV2 actions system
- Interactive template with `data-action` attributes for all controls

### Enhanced

- Template updated to enable all interactive elements (removed `disabled` attributes)
- Permission-based checkbox enabling/disabling
- V2 interface now provides full chat management capabilities
- Comprehensive error handling and user feedback

### Technical Notes

- Follows ApplicationV2 conversion guide action patterns exactly
- Uses static methods with `@this` binding for proper ApplicationV2 integration
- Maintains compatibility with V1 while providing modern V2 experience
- **V2 IS NOW FULLY FUNCTIONAL** - no longer a preview/read-only interface

---

## [13.1.4.7] - 2025-10-12

### Enhanced

- **V2 Template Redesign**: Complete overhaul of chat-pruner-v2.hbs to match V1 functionality
- V2 interface now includes checkboxes, anchor radios, and action buttons (read-only for now)
- Enhanced data preparation to provide `full` text for tooltips and `canDelete` permissions
- Improved V2 UI consistency with established V1 design patterns

### Added

- V2 preview mode notification with instructions to use V1 for full functionality
- Enhanced tooltip support showing full message content in V2
- Disabled action buttons in V2 with clear visual indication of read-only status

### Changed

- V2 template structure now mirrors V1 layout for consistent user experience
- Version headers updated across all files

### UI Improvements

- V2 interface now displays proper column headers (Select, Anchor, Speaker, Time, Preview)
- Consistent styling using existing CSS classes from V1
- Clear indication that V2 is in preview/read-only mode

---

## [13.1.4.6] - 2025-10-12

### Fixed

- **CRITICAL**: ApplicationV2 empty content issue by implementing proper PARTS configuration
- Replaced deprecated single `template:` property with `static PARTS` structure
- Removed unnecessary manual render methods (\_renderHTML, \_replaceHTML) - HandlebarsApplicationMixin provides these

### Added

- ApplicationV2 conversion guide reference to Development Reference
- Enhanced Development Reference with ApplicationV2 implementation patterns
- Key insights section with proper ApplicationV2 lifecycle methods

### Changed

- ApplicationV2 now uses proper template parts system following Foundry V13 patterns
- Simplified ApplicationV2 implementation by leveraging HandlebarsApplicationMixin correctly
- Version headers updated across all files

### Technical Notes

- **Root Cause**: ApplicationV2 requires `static PARTS = { main: { template: "..." } }` instead of `template:` in DEFAULT_OPTIONS
- **Reference**: https://foundryvtt.wiki/en/development/guides/applicationV2-conversion-guide

---

## [13.1.4.5] - 2025-10-12

### Fixed

- ChatMessage deprecation warning: replaced `m.user` with `m.author` (Foundry v12+ compatibility)
- ApplicationV2 empty content display issue with enhanced lifecycle method support
- Added `_preparePartContext` alternative lifecycle method for better Foundry v13 compatibility

### Added

- Debug logging for ApplicationV2 data preparation to troubleshoot content issues
- Enhanced diagnostic information for ApplicationV2 lifecycle methods

### Changed

- Improved ApplicationV2 data context preparation with better error handling
- Version headers updated across all files

---

## [13.1.4.4] - 2025-10-12

### Fixed

- ApplicationV2 render method errors by implementing HandlebarsApplicationMixin integration
- Added fallback \_renderHTML and \_replaceHTML methods for cases without HandlebarsApplicationMixin
- Enhanced ApplicationV2 compatibility with proper render method implementation

### Changed

- ApplicationV2 now uses HandlebarsApplicationMixin when available for proper render support
- Improved error handling and diagnostic logging for ApplicationV2 features
- Version headers updated across all files

---

## [13.1.4.3] - 2025-10-12

### Added

- Version headers added to all source files
- Current version tracking in README.md
- CHANGELOG.md file for version history tracking

### Changed

- Standardized file headers with version information
- Enhanced development workflow with version tracking

---

## [13.1.4.2] - 2025-10-12

### Fixed

- **CRITICAL**: ApplicationV2 namespace detection
- ApplicationV2 now properly accessed via `foundry.applications.api.ApplicationV2`
- Dual namespace checking (global + foundry.applications.api)
- Resolved "ApplicationV2 not defined" error completely

### Added

- Enhanced diagnostic logging for ApplicationV2 availability
- Better error reporting for troubleshooting

---

## [13.1.4.1] - 2025-10-12

### Added

- Enhanced ApplicationV2 diagnostic information
- Comprehensive availability checking for ApplicationV2
- Better debugging information and logging
- Improved error handling and user feedback

### Changed

- More detailed status reporting in console logs
- Enhanced troubleshooting capabilities

---

## [13.1.4.0] - 2025-10-12

### Added

- **NEW**: ApplicationV2 support for Foundry VTT v13+ compatibility
- Read-only V2 interface showing last 200 messages
- Graceful fallback when ApplicationV2 is not available
- Dual API access: `api.open()` (V1) and `api.openV2()` (V2)
- Enhanced error handling with defensive programming

### Changed

- Maintained full backward compatibility with V1 interface
- Additive approach - V2 supplements, doesn't replace V1

### Technical

- Added `chat-pruner-v2.js` with ApplicationV2 implementation
- Added `chat-pruner-v2.hbs` template for V2 interface
- Updated `module.json` to include V2 assets
- Added VS Code workspace configuration for development

---

## [1.3.2] - Previous Stable Release

### Features

- GM-only chat management interface
- View last 200 messages in chronological order
- Multi-select delete functionality
- Anchor-based operations (delete newer/older than anchor)
- Cross-version compatibility (Foundry VTT v11-v13)
- Permission-based message deletion
- Interactive UI with row selection and visual feedback

### Technical

- Application V1 based interface
- Defensive programming for cross-version compatibility
- Comprehensive error handling
- Clean and responsive UI design

---

## Version History Summary

- **1.3.2**: Last stable release with V1 Application
- **13.1.4.0**: Initial ApplicationV2 implementation
- **13.1.4.1**: Enhanced diagnostics and error handling
- **13.1.4.2**: Critical ApplicationV2 namespace fix
- **13.1.4.3**: Version tracking and development workflow improvements

---

_Note: Versions 13.1.4.x are development releases focused on Foundry VTT v13 compatibility and ApplicationV2 implementation._
