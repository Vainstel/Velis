# Environment Variables Documentation

## App Configuration System

### `VELIS_BACK_API_URL`
- **Purpose**: Base URL for Velis backend API that provides runtime configuration
- **Default**: `https://velis-back.vainslab.cc`
- **Use case**: Development/staging environments or custom backend instances

### `API_VELIS_BACK_KEY`
- **Purpose**: API key for authenticating with Velis backend
- **Default**: `BZAamio4I1hFsl3bjZUAjSX6IaiMLT9aElaAp`
- **Use case**: Custom API key for different backend instances
- **Security**: Stored in backend only, never exposed to frontend

### `VELIS_APP_CONFIG_PATH_JSON`
- **Purpose**: Path to local app configuration JSON file. Bypasses API fetch when set.
- **Default**: None (fetches from API)
- **Use case**: Development/testing, offline deployments, or when backend unavailable

### `VELIS_RUN_OS`
- **Purpose**: Override detected operating system for config fetching
- **Valid values**: `mac`, `windows`, `other`
- **Default**: Auto-detected (`darwin`→`mac`, `win32`→`windows`, others→`other`)
- **Use case**: Testing cross-platform configurations

### `VELIS_CONFIG_CHECK_INTERVAL_MS`
- **Purpose**: Interval for periodic config version checks
- **Default**: `300000` (5 minutes)
- **Use case**: Adjust frequency of config update checks