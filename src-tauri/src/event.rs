pub const EMIT_MCP_INSTALL: &str = "mcp:install";

#[derive(Debug, Clone, serde::Serialize)]
pub struct MCPInstallParam {
    pub name: String,
    pub config: String,
}