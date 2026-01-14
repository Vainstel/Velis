## MCP Setup Guide

Dive supports Model Context Protocol (MCP) servers for extending functionality with various tools and services.

### Local MCP Servers 🛠️

The system comes with a default echo MCP Server, and you can add more powerful tools like Fetch, Filesystem, and Youtube-dl.

![Set MCP](./docs/ToolsManager.png)

### Quick Local Setup

Add this JSON configuration to your Dive MCP settings to enable local tools:

```json
 "mcpServers":{
    "fetch": {
      "command": "uvx",
      "args": [
        "mcp-server-fetch",
        "--ignore-robots-txt"
      ],
      "enabled": true
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/allowed/files"
      ],
      "enabled": true
    },
    "youtubedl": {
      "command": "npx",
      "args": [
        "@kevinwatt/yt-dlp-mcp"
      ],
      "enabled": true
    }
  }
```

### Using SSE Transport (Remote MCP Servers)

You can connect to external MCP servers via SSE (Server-Sent Events). Add this configuration to your Dive MCP settings:

```json
{
  "mcpServers": {
    "MCP_SERVER_NAME": {
      "enabled": true,
      "transport": "sse",
      "url": "YOUR_SSE_SERVER_URL"
    }
  }
}
```

#### Example: Atlassian MCP Server

```json
{
  "mcpServers": {
    "atlassian": {
      "transport": "sse",
      "url": "https://mcp.atlassian.com/v1/sse",
      "enabled": true
    }
  }
}
```

**Important Notes:**
- SSE servers require `"transport": "sse"` field (not `"type"`)
- SSE servers require `"url"` field instead of `"command"` and `"args"`
- Optional: Add `"headers"` for authentication if needed:
  ```json
  "headers": {
    "Authorization": "Bearer YOUR_TOKEN"
  }
  ```

### Using Streamable HTTP Transport

You can also connect to external MCP servers via Streamable HTTP transport:

```json
{
  "mcpServers": {
    "STREAMABLE_MCP_SERVER": {
      "transport": "streamable",
      "url": "YOUR_STREAMABLE_HTTP_URL",
      "headers": {
        "Authorization": "YOUR_AUTH_TOKEN"
      }
    }
  }
}
```

### Additional Setup for yt-dlp-mcp

yt-dlp-mcp requires the yt-dlp package. Install it based on your operating system:

#### Windows

```bash
winget install yt-dlp
```

#### MacOS

```bash
brew install yt-dlp
```

#### Linux

```bash
pip install yt-dlp
```
