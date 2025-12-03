# Testing Guide for Token Types and Schemas

This guide explains how to test the token type definitions and normalized schema to ensure they work correctly with real-world data.

## Test Structure

The test suite is organized into three main test files:

### 1. `input-sources.test.ts`

Tests the input source type definitions (Figma Variables API and DTCG JSON).

**What it tests:**

- ✅ Valid Figma Variables API structure
- ✅ ALIAS type handling in Figma
- ✅ All Figma variable types (BOOLEAN, FLOAT, STRING, COLOR)
- ✅ Valid DTCG JSON structure
- ✅ DTCG alias syntax (`{token.path}`)
- ✅ DTCG typography tokens (individual types)
- ✅ DTCG spacing/dimension tokens
- ✅ Type guards (`isFigmaInput`, `isDTCGInput`)

**Key scenarios:**

- Complete Figma variable with all required fields
- Figma variables with ALIAS references
- DTCG tokens with nested mode values
- DTCG tokens with alias references

### 2. `token-types.test.ts`

Tests the normalized token schema types.

**What it tests:**

- ✅ ColorValue (with and without alpha)
- ✅ SpacingValue (all unit types)
- ✅ TypographyValue (with number and SpacingValue lineHeight)
- ✅ BorderRadiusValue (uniform and individual corners)
- ✅ ShadowValue (with and without optional fields)
- ✅ TokenValue and TokenAlias
- ✅ NormalizedToken (basic, with modes, with aliases)
- ✅ All supported token types
- ✅ NormalizedTokenSet (with and without metadata)

**Key scenarios:**

- All token value types
- Modes/themes support
- Token aliases
- Complete token sets

### 3. `integration.test.ts`

Integration tests that validate real-world transformation scenarios.

**What it tests:**

- ✅ Figma → Normalized schema mapping
- ✅ DTCG → Normalized schema mapping
- ✅ Complete token sets with all required types
- ✅ Complex scenarios (aliases + modes)

**Key scenarios:**

- Figma variable with multiple modes
- Figma alias references
- DTCG color tokens with modes
- DTCG alias syntax parsing
- DTCG typography composite grouping
- Complete design system token set

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test input-sources.test.ts

# Run with coverage
pnpm test --coverage
```

## Test Coverage

The test suite covers:

1. **Type Safety**: All TypeScript types compile and work correctly
2. **Input Validation**: Both Figma and DTCG input structures are validated
3. **Schema Validation**: Normalized schema handles all token types
4. **Edge Cases**: Aliases, modes, optional fields
5. **Real-World Scenarios**: Complete token sets with all required types

## What's NOT Tested (Yet)

These would require actual transformer implementations:

- ❌ Parsing hex/rgba strings to ColorValue objects
- ❌ Parsing dimension strings ("16px") to SpacingValue objects
- ❌ Resolving alias references (circular reference detection)
- ❌ Grouping DTCG individual typography tokens into composite types
- ❌ Mode resolution logic
- ❌ Error handling for invalid input

## Adding New Tests

When adding new token types or features:

1. **Add unit tests** in `token-types.test.ts` for the new type
2. **Add input tests** in `input-sources.test.ts` if it affects input parsing
3. **Add integration tests** in `integration.test.ts` for real-world scenarios
4. **Update this guide** with new test scenarios

## Example: Testing a New Token Type

```typescript
// In token-types.test.ts
describe("NewTokenType", () => {
  it("should accept valid new token type values", () => {
    const token: NormalizedToken = {
      id: "new-type-example",
      name: "newType.example",
      type: "newType", // Add to TokenType union
      value: {
        type: "value",
        value: { /* new type structure */ },
      },
    };

    expect(token.type).toBe("newType");
  });
});
```

## Validation Utilities

For runtime validation (future enhancement), consider:

- JSON Schema validation for input sources
- Runtime type checking for normalized tokens
- Alias resolution validation
- Circular reference detection
- Mode validation

## Continuous Integration

Tests run automatically on:

- Pull requests
- Commits to main branch
- Pre-commit hooks (if configured)

Ensure all tests pass before merging!

## Related Documentation

- [CHANGELOG.md](../../../../CHANGELOG.md) - Version history
- [Types Documentation](./README.md) - Type definitions and usage
- [Token Specification](../../TOKEN_SPEC.md) - Complete token input sources and data model spec
