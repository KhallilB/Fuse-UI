# `@fuseui-org/typescript-config`

Shared TypeScript configuration presets for FuseUI packages and applications.

## Installation

This package is typically installed as a dev dependency in workspace packages:

```bash
pnpm add -D @fuseui-org/typescript-config
```

## Available Configs

### `base.json`

Base TypeScript configuration with strict settings, ES2022 target, and Node.js module resolution. Suitable for Node.js packages and libraries.

**Features:**
- Strict type checking enabled
- ES2022 target with modern libs
- Node.js module resolution (NodeNext)
- Declaration files generation
- No unchecked indexed access

### `nextjs.json`

Extends `base.json` with Next.js-specific settings. Use for Next.js applications.

**Additional features:**
- Next.js TypeScript plugin
- ESNext modules with bundler resolution
- JSX preserve mode
- JavaScript files allowed

### `react-library.json`

Extends `base.json` with React library settings. Use for React component libraries.

**Additional features:**
- React JSX transform (react-jsx)

## Usage

In your `tsconfig.json`, extend the appropriate preset:

```json
{
  "extends": "@fuseui-org/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

For Next.js apps:

```json
{
  "extends": "@fuseui-org/typescript-config/nextjs.json",
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"]
}
```

For React libraries:

```json
{
  "extends": "@fuseui-org/typescript-config/react-library.json",
  "include": ["src/**/*"]
}
```

## Related Documentation

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [tsconfig.json Reference](https://www.typescriptlang.org/tsconfig)

