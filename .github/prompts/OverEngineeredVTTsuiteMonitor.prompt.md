# OverEngineeredVTT Suite Monitor — AI Build Prompt (Basic Module)

You are building a Foundry VTT module named **OverEngineeredVTT Suite Monitor** (OEV Suite Monitor).

This is a _suite-wide update tracker_ for multiple OverEngineeredVTT (OEV) modules.

## Hard Requirements (must follow)

- Foundry VTT **v13+** only.
- Use **ApplicationV2** and **DialogV2** only (no ApplicationV1 / legacy Dialog).
- GM-only behavior:
  - Only a GM performs network checks.
  - Only GMs receive notifications and see dialogs.
- One purpose: _detect updates for OEV modules and notify the GM_.
- Do not add unrelated features (no extra dashboards, no settings UI beyond what is required, no journaling, no compendiums).

## Desired UX

On world load (after Foundry is ready):

1. Run update check (subject to throttling; see below).
2. Show a notification (GM-only):
   - If any are out of date: `You have X OEV modules out of date.`
   - If all are up to date: `All OEV modules up to date.`
3. If out-of-date count > 0 and user is not currently hidden/snoozed, show a **DialogV2** that:
   - Lists each out-of-date module: name, installed version, latest version
   - Provides links:
     - Manifest URL (releases/latest/download/module.json)
     - Latest release page (optional)
   - Provides actions:
     - **Hide until next update** (suppresses dialogs until any tracked module has a new latest version)
     - **Remind me later** (snooze for a short duration)
     - **Close**

No chat message spam. No chat cards required.

## Tracking Model (Mandatory Registration, Suite-Owned Watch List)

The monitor module contains the canonical list of OEV modules it watches. When new OEV modules are released, the monitor module will be updated to include them.

- The monitor should check only modules that are **installed** in the current Foundry.
- Prefer checking only modules that are **active** in the world (enabled), so notifications match what the GM actually uses.

Create a single in-code watch list structure like:

- `id` (module id)
- `title` (display name)
- `manifestUrl` (latest module.json asset URL)
- `releaseUrl` (optional, GitHub releases page)

Example manifest pattern:
`https://github.com/<owner>/<repo>/releases/latest/download/module.json`

## Fetch Strategy (Many-fetch, no index)

No index JSON. The monitor fetches each watched module’s `manifestUrl` and reads the `version` field.

- Use `fetch`.
- If the request fails, treat that module’s latest version as unknown and do not block the entire run.
- Keep the check polite:
  - Throttle checks using a timestamp setting (see below)
  - Optionally add a small random jitter (seconds) to reduce thundering herd

## Version Comparison

Compare:

- Installed version: `game.modules.get(id).version`
- Latest version: from fetched module.json `version`

Use a robust semver compare so that `1.10.0` is correctly greater than `1.9.9`.

If version strings are not strictly semver, normalize conservatively (strip leading `v`, trim whitespace). If still not comparable, fall back to string equality and treat mismatch as “update available” only if safely determinable.

## Throttling / Persistence (World Settings)

Add world-scoped settings (namespace is the module id):

- `lastCheckAt` (number, ms epoch)
- `checkIntervalHours` (number, default e.g. 12 or 24)
- `hiddenUntilUpdate` (boolean)
- `snoozedUntil` (number, ms epoch)
- `lastFingerprint` (string)

Fingerprint definition:

- A stable string derived from the latest versions for all watched+installed modules, e.g.:
  `id@latestVersion|id@latestVersion|...` sorted by id

Behavior:

- If now < `snoozedUntil`, do nothing (no notification, no dialog).
- If now - `lastCheckAt` < interval, do nothing.
- Otherwise run checks and update `lastCheckAt`.
- If fingerprint changes compared to `lastFingerprint`, automatically set `hiddenUntilUpdate = false` and overwrite `lastFingerprint`.
- Dialog display rule:
  - If out-of-date count > 0 AND `hiddenUntilUpdate` is false AND not snoozed => show DialogV2.

## Minimal Implementation Scope (basic module)

Create the basic module structure with:

- `module.json`
- One ES module entry point
- A small `api` surface on `game.modules.get(<monitorId>).api` is optional but not required for v1

No localization required in v1.
No automated tests required.

## Output Expectations

When you generate code:

- Keep it small and readable.
- Use Foundry v13 patterns.
- Avoid third-party dependencies unless truly necessary.
- Ensure the module loads without errors even when:
  - no watched modules are installed
  - GitHub is unreachable
  - a watched module is installed but has missing version fields

## First Deliverable

Produce the minimal working OEV Suite Monitor module that:

- Checks watched modules on `Hooks.once('ready', ...)` (GM-only)
- Fetches latest module.json versions
- Compares versions and counts out-of-date modules
- Shows the GM notification strings
- Shows the DialogV2 with the actions described
- Implements throttling + hidden/snooze + fingerprint reset behavior

We will refine UI text and module list later.
