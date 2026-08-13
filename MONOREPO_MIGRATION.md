# pnpm monorepo migration

## Workspace and dependency changes

- `pnpm-workspace.yaml` now targets the exported package locations:
  `artifacts/artifacts/*`, `lib/lib/*`, and `scripts/scripts`. It removes the
  Replit-only platform exclusions that prevented native Vite/esbuild binaries
  from installing on normal deployment targets. It also replaces the catalog
  with explicit package versions in each manifest.
- `package.json` no longer has the Replit shell-based preinstall hook and its
  typecheck filters use the actual exported workspace paths.
- `tsconfig.json` project references use the actual exported library paths.

## Application packages

- `artifacts/artifacts/bizny/package.json` and
  `artifacts/artifacts/mockup-sandbox/package.json` use explicit versions and
  no longer install Replit Vite plugins.
- Their `vite.config.ts` files remove Replit-only plugins and use portable
  defaults (`PORT=5173`, `BASE_PATH=/`) so a standard production build does not
  require Replit environment variables.
- The remaining package manifests replace all `catalog:` references with their
  prior catalog versions while retaining every `workspace:*` local dependency.

### Complete modified-file list

| File | Reason |
| --- | --- |
| `pnpm-workspace.yaml` | Correct workspace globs; remove Replit platform pinning and catalog configuration. |
| `package.json` | Remove the Replit-only preinstall shell hook, correct typecheck paths, and pin pnpm. |
| `tsconfig.json` | Correct TypeScript project-reference paths. |
| `artifacts/artifacts/bizny/package.json` | Replace catalog versions and remove Replit Vite dependencies. |
| `artifacts/artifacts/bizny/vite.config.ts` | Remove Replit plugins and provide portable build defaults. |
| `artifacts/artifacts/mockup-sandbox/package.json` | Replace catalog versions and remove Replit Vite dependencies. |
| `artifacts/artifacts/mockup-sandbox/vite.config.ts` | Remove Replit plugins and provide portable build defaults. |
| `artifacts/artifacts/api-server/package.json` | Replace catalog versions. |
| `lib/lib/api-client-react/package.json` | Replace the catalog version. |
| `lib/lib/api-zod/package.json` | Replace the catalog version. |
| `lib/lib/db/package.json` | Replace catalog versions. |
| `lib/lib/integrations-openai-ai-react/package.json` | Replace the catalog version. |
| `lib/lib/integrations-openai-ai-server/package.json` | Replace the catalog version. |
| `scripts/scripts/package.json` | Replace catalog versions. |
| `MONOREPO_MIGRATION.md` | Record the migration and validation status. |

## Verification note

`pnpm install --offline` reached and passed the lockfile supply-chain policy
check, then stopped because this machine's local pnpm mirror lacks
`@types/cookie-parser` metadata. Online install is also blocked here by the
system TLS error `UNABLE_TO_VERIFY_LEAF_SIGNATURE` when contacting npm. No TLS
validation was disabled, so `pnpm run build` could not be run in this
environment. Run `pnpm install` and `pnpm run build` from the repository root
on a machine with normal npm registry certificate trust.
