# `@fuseui-org/cli`

Command-line interface for FuseUI that manages design tokens and generates code from design intent.

## Installation

```bash
npm install -g @fuseui-org/cli
# or
yarn global add @fuseui-org/cli
# or
pnpm add -g @fuseui-org/cli

# Or use with npx (no installation required)
npx @fuseui-org/cli --help

# Or install in your project
npm install --save-dev @fuseui-org/cli
```

## Requirements

- Node.js 18+ (LTS) recommended
- POSIX-compatible shell environment for best experience (macOS, Linux, or WSL on Windows)

## Usage

**Tip:** All commands support `--help` for detailed usage information and available options.

```bash
# Show help and version
fuseui --help
fuseui --version

# Import tokens using config file (see below)
fuseui import

# Import from a specific source in config
fuseui import --source figma
fuseui import --source local-draft

# Import directly from DTCG file (bypasses config)
fuseui import --dtcg-path ./tokens/primitives.json

# Import directly from Figma (bypasses config)
fuseui import --figma-file-key AbCd123 --figma-api-key your-api-key

# Import and push to Fuse API
fuseui import --dtcg-path ./tokens.json --push --fuse-api-key your-fuse-key

# Enable debug logging
fuseui import --debug

# Manage design tokens
fuseui tokens

# Generate code from tokens
fuseui generate
```

## Import command

The `fuseui import` command ingests design tokens from configured sources (config file or CLI overrides), runs the appropriate importer (DTCG or Figma), and reports token counts, types, warnings, and errors.

### Import modes

The import command operates in two modes:

1. **Config file mode** (default): Reads sources from `fuseui.config.*` and imports all matching sources. Use `--source` to filter by label or type.

2. **CLI override mode**: When you provide CLI flags for a specific source type (e.g., `--dtcg-path` or `--figma-file-key`), the config file is ignored and only that source is imported. **Note**: You cannot mix Figma and DTCG CLI overrides in a single command.

### Config file

Place a `fuseui.config.{json,js,ts}` file in your project root (or pass `--config <path>`), for example:

```json
{
  "defaults": {
    "figmaApiKey": "env:FUSEUI_FIGMA_API_KEY"
  },
  "sources": [
    {
      "type": "dtcg",
      "label": "local-draft",
      "filePath": "./tokens/draft.json"
    },
    {
      "type": "figma",
      "label": "marketing",
      "fileKey": "AbCd123",
      "apiBaseUrl": "https://api.figma.com"
    }
  ]
}
```

Any value prefixed with `env:` is a reminder to provide it through environment variables; the CLI does not resolve that syntax automatically.

### CLI options & environment variables

**Global options:**

- `--debug` or `FUSEUI_DEBUG=1` – Enable verbose logging

**Config options:**

- `-c, --config <path>` or `FUSEUI_CONFIG` – Custom config file path
- `-s, --source <source>` – Filter config sources by label or type (`dtcg`, `figma`)

**DTCG CLI overrides** (mutually exclusive with Figma overrides):

- `--dtcg-path <path>` or `FUSEUI_DTCG_FILE_PATH` – Local DTCG file path
- `--dtcg-url <url>` or `FUSEUI_DTCG_FILE_URL` – Remote DTCG file URL

**Figma CLI overrides** (mutually exclusive with DTCG overrides):

- `--figma-file-key <key>` or `FUSEUI_FIGMA_FILE_KEY` – Figma file key (required)
- `--figma-api-key <key>` or `FUSEUI_FIGMA_API_KEY` – Figma API key (required)
- `--figma-base-url <url>` or `FUSEUI_FIGMA_BASE_URL` – Figma API base URL (optional)

**Push options:**

- `--push` – Push imported tokens to Fuse API after import
- `--fuse-api-key <key>` or `FUSEUI_API_KEY` – Fuse API key for push (required when using --push)
- `--fuse-api-url <url>` or `FUSEUI_API_URL` – Fuse API base URL (optional, defaults to `https://api.fuseui.com`)

### Exit codes

- `0` – success (warnings may still be emitted)
- `2` – validation or configuration error (missing auth, unreadable path, schema issues)
- `1` – fatal/unexpected error (e.g., network outage, crash)

## Development

### Building

```bash
pnpm build
```

### Testing

```bash
pnpm test
```

## Related Documentation

- [CHANGELOG.md](../../CHANGELOG.md) - Version history
