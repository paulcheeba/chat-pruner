# Chat Pruner - Changelog

All notable changes to this project will be documented in this file.

## [13.1.4.6] - 2025-10-12

### Fixed
- **CRITICAL**: ApplicationV2 empty content issue by implementing proper PARTS configuration
- Replaced deprecated single `template:` property with `static PARTS` structure
- Removed unnecessary manual render methods (_renderHTML, _replaceHTML) - HandlebarsApplicationMixin provides these

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
