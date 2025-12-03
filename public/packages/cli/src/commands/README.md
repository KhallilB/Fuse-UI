# CLI Commands

This directory contains the command definitions for the FuseUI CLI. Each command is implemented as a separate module following a consistent pattern.

## Command Pattern

Each command module should:

1. Export a `setup<Name>Command(program: Command)` function
2. Define the command, its options, and action handler
3. Export business logic functions (e.g., `runImportCommand`) for testability
4. Keep command setup and business logic in the same file (pragmatic for this complexity)

## Structure

```text
commands/
  ├── import.ts          # Command setup + business logic
  └── README.md          # This file

src/
  └── index.ts           # Main entry point that registers all commands
```

## Example: Import Command

The `import` command demonstrates the pattern:

```typescript
import type { Command } from "commander";
import { createLogger } from "../logger.js";

// Export business logic for testability
export async function runImportCommand(
  options: ImportCommandOptions = {}
): Promise<ExitCode> {
  const logger = createLogger({ debug: options.debug });
  // ... business logic ...
  return ExitCode.Success;
}

// Export command setup function
export function setupImportCommand(
  program: Command,
  deps: { runImport?: ImportCommandRunner } = {}
): void {
  const runImport = deps.runImport ?? runImportCommand;

  program
    .command("import")
    .description("Ingest design tokens from configured sources")
    .option("--dtcg-path <path>", "Override DTCG file path")
    .option("--figma-file-key <key>", "Override Figma file key")
    .action(async (commandOptions, command) => {
      const logger = createLogger({ debug: globalOptions.debug });

      // Validation
      if (hasConflictingCliSources(commandOptions)) {
        logger.error("Provide either Figma or DTCG overrides, not both.");
        process.exitCode = ExitCode.Validation;
        return;
      }

      // Business logic (can be injected for testing)
      try {
        const exitCode = await runImport({
          ...commandOptions,
          logger,
        });
        process.exitCode = exitCode;
      } catch (error) {
        process.exitCode = handleCliError(error, logger, debugEnabled);
      }
    });
}
```

## Command Registration

Commands are registered in `src/index.ts`:

```typescript
// Register commands
setupImportCommand(program);
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

### Business Logic Organization

- Keep command setup and business logic in `commands/<name>.ts`
- Export business logic functions (e.g., `runImportCommand`) for testability
- Use dependency injection for testability (e.g., inject `runImport` function)
- For complex commands, consider extracting helpers to separate files only when needed

### User Feedback

- Use `console.log()` for success messages
- Use `console.warn()` for warnings
- Use `console.error()` for errors
- Provide actionable feedback (what went wrong, what to do next)

## Testing

Commands should be tested using isolated command instances:

```typescript
import { Command } from "commander";
import { setupImportCommand } from "./commands/import";

describe("import command", () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.name("fuseui");
    setupImportCommand(program);
  });

  it("handles file imports", async () => {
    await program.parseAsync([
      "node",
      "fuseui",
      "import",
      "--file",
      "./tokens.json",
    ]);
    // Assertions...
  });
});
```

### Testing Guidelines

- Create isolated `Command` instances for each test
- Use dependency injection to mock business logic (e.g., inject `runImport` mock)
- Test validation logic separately from business logic
- Test error handling and edge cases
- Avoid importing the main `index.ts` module in tests (causes side effects)

## Adding a New Command

1. Create `commands/<name>.ts` with:
   - `setup<Name>Command(program: Command)` function for command registration
   - Business logic functions (e.g., `run<Name>Command()`) exported for testability
2. Register the command in `src/index.ts`:

   ```typescript
   import { setup<Name>Command } from "./commands/<name>"

   // In registration section:
   setup<Name>Command(program)
   ```

3. Write tests in `index.test.ts` or a separate test file
4. Use dependency injection for testability (inject business logic functions)
5. Update this README if the pattern changes

## Future Commands

Commands planned for future implementation:

- `tokens` - Manage design tokens (list, validate, etc.)
- `generate` - Generate code from design tokens
