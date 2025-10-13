# Chat Pruner - Changelog

All notable changes to this project will be documented in this file.

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

- Added `module-v2.js` with ApplicationV2 implementation
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
