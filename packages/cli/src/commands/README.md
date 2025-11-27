# CLI Commands

This directory contains the command definitions for the FuseUI CLI. Each command is implemented as a separate module following a consistent pattern.

## Command Pattern

Each command module should:

1. Export a `setup<Name>Command(program: Command)` function
2. Define the command, its options, and action handler
3. Keep business logic in separate modules (e.g., `import-command.ts`)

## Structure

```
commands/
  ├── import.ts          # Command definition and setup
  └── README.md          # This file

src/
  ├── import-command.ts  # Business logic for import command
  └── index.ts           # Main entry point that registers all commands
```

## Example: Import Command

The `import` command demonstrates the pattern:

```typescript
import type { Command } from "commander"
import { runImportCommand } from "../import-command.js"

export function setupImportCommand(program: Command): void {
  program
    .command("import")
    .description("Ingest design tokens from Figma or a local JSON file")
    .option("--figma <fileId>", "Import from Figma Variables API")
    .option("--file <path>", "Import from a local DTCG/JSON token file")
    .option("--output <path>", "Override output location")
    .action(async (options) => {
      // Validation
      const hasFigma = Boolean(options.figma)
      const hasFile = Boolean(options.file)
      if ((hasFigma && hasFile) || (!hasFigma && !hasFile)) {
        console.error("Please provide exactly one source...")
        process.exitCode = 1
        return
      }

      // Business logic (delegated to separate module)
      try {
        const result = await runImportCommand({
          figmaFileId: options.figma,
          dtcgFilePath: options.file,
          outputFile: options.output,
        })
        // Handle success
      } catch (error) {
        // Handle errors
        console.error(`Import failed: ${error.message}`)
        process.exitCode = 1
      }
    })
}
```

## Command Registration

Commands are registered in `src/index.ts`:

```typescript
// Register commands
setupImportCommand(program)
// Future commands: setupTokensCommand(program), setupGenerateCommand(program)
```

## Best Practices

### Command Definition

- Use descriptive command names (verb-based: `import`, `generate`, `validate`)
- Provide clear descriptions that explain what the command does
- Use consistent option naming (`--flag <value>` for required, `--flag [value]` for optional)

### Option Definitions

- Use kebab-case for option names: `--figma-file-id` not `--figmaFileId`
- Provide clear descriptions for each option
- Use angle brackets `<value>` for required values, square brackets `[value]` for optional

### Validation

- Validate input early in the action handler
- Provide clear error messages
- Set `process.exitCode = 1` for errors
- Return early after validation failures

### Error Handling

- Wrap business logic in try/catch blocks
- Provide user-friendly error messages
- Always set `process.exitCode` on errors
- Log warnings and non-blocking errors separately from fatal errors

### Business Logic Separation

- Keep command setup (options, validation) in `commands/<name>.ts`
- Keep business logic in separate modules (e.g., `import-command.ts`)
- This separation makes business logic testable independently

### User Feedback

- Use `console.log()` for success messages
- Use `console.warn()` for warnings
- Use `console.error()` for errors
- Provide actionable feedback (what went wrong, what to do next)

## Testing

Commands should be tested using isolated command instances:

```typescript
import { Command } from "commander"
import { setupImportCommand } from "./commands/import"

describe("import command", () => {
  let program: Command

  beforeEach(() => {
    program = new Command()
    program.name("fuseui")
    setupImportCommand(program)
  })

  it("handles file imports", async () => {
    await program.parseAsync(["node", "fuseui", "import", "--file", "./tokens.json"])
    // Assertions...
  })
})
```

### Testing Guidelines

- Create isolated `Command` instances for each test
- Mock business logic modules (e.g., `runImportCommand`)
- Test validation logic separately from business logic
- Test error handling and edge cases
- Avoid importing the main `index.ts` module in tests (causes side effects)

## Adding a New Command

1. Create `commands/<name>.ts` with `setup<Name>Command()` function
2. Create business logic module if needed (e.g., `<name>-command.ts`)
3. Register the command in `src/index.ts`:
   ```typescript
   import { setup<Name>Command } from "./commands/<name>"
   
   // In registration section:
   setup<Name>Command(program)
   ```
4. Write tests in `index.test.ts` or a separate test file
5. Update this README if the pattern changes

## Future Commands

Commands planned for future implementation:

- `tokens` - Manage design tokens (list, validate, etc.)
- `generate` - Generate code from design tokens

