# Developer Notes

## Version Management

App version (currently `1.11.2`) must be updated in **3 files** simultaneously:

1. `package.json` → `"version": "1.11.2"`
2. `src-tauri/Cargo.toml` → `version = "1.11.2"`
3. `src-tauri/tauri.conf.json` → `"version": "1.11.2"`

**UI Display**: Version auto-imported from `package.json` in `src/views/Overlay/Setting.tsx`

**Electron**: Uses `app.getVersion()` (reads from `package.json`)

**Access in code**: Import from `package.json` if needed for version checks/config validation
