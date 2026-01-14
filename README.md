
### Platform Availability

| Platform | Electron | Tauri |
| :--- | :---: | :---: |
| **Windows** | ✅ | ✅ |
| **macOS** | ✅ | 🔜 |
| **Linux** | ✅ | ✅ |

### Windows users: 🪟
Choose between two architectures:
- **Tauri Version** (Recommended): Smaller installer (<30MB), modern architecture
- **Electron Version**: Traditional architecture, fully stable
- Python and Node.js environments will be downloaded automatically after launching

### MacOS users: 🍎
- **Electron Version**: Download the .dmg version
- You need to install Python and Node.js (with npx uvx) environments yourself
- Follow the installation prompts to complete setup

### Linux users: 🐧
Choose between two architectures:
- **Tauri Version** (Recommended): Modern architecture with smaller installer size
- **Electron Version**: Traditional architecture with .AppImage format
- You need to install Python and Node.js (with npx uvx) environments yourself
- For Ubuntu/Debian users:
  - You may need to add `--no-sandbox` parameter
  - Or modify system settings to allow sandbox
  - Run `chmod +x` to make the AppImage executable
- For Arch users:
  - If you are using Arch Linux, you can install dive using an [AUR helper](https://wiki.archlinux.org/title/AUR_helpers). For example: `paru -S dive-ai`

## MCP Setup

For detailed instructions on setting up MCP servers, please see [MCP Servers Setup](MCP_SETUP.md).

## Configuration Files 📁

Velis AI stores its configuration in platform-specific locations:

### Configuration Directory Location

**Development mode** (`.config/` in project root):
- Used when running `npm run dev`
- Automatically created on first launch

**Production mode** (user home directory):
- **macOS**: `~/.velis/config/`
- **Windows**: `%USERPROFILE%\.velis\config\`
- **Linux**: `~/.velis/config/`

### Configuration Files

| File | Description |
|------|-------------|
| `.setup_completed` | Flag file indicating initial setup is complete. Delete to return to welcome screen |
| `mcp_config.json` | MCP server configurations (stdio/SSE transport, environment variables, arguments) |
| `model_config.json` | LLM API keys and provider settings (OpenAI, Anthropic, Ollama, etc.) |
| `model_settings.json` | Model-specific parameters (temperature, top-p, max tokens, streaming mode) |
| `dive_httpd.json` | MCP host service configuration (port, logging, timeouts) |
| `command_alias.json` | Command aliases for Windows (e.g., npx paths) |
| `customrules` | Custom system instructions/prompts for AI behavior |

### Configuration Management

- **First Launch**: On first run, Velis AI shows a welcome screen to configure your first LLM provider
- **Reset Settings**: Go to System Settings → "Reset to Initial Setup" to delete all configuration and return to welcome screen
- **Manual Edit**: You can manually edit JSON files while the app is closed
- **Backup**: It's recommended to backup your `~/.velis/config/` folder before major updates
