# Dev WASM Engine

Este proyecto ya incluye el motor Rust para scoring de proyectos en:

- `src/wasm/dev_engine/Cargo.toml`
- `src/wasm/dev_engine/src/lib.rs`

## Instalar toolchain (Windows)

1. Instala Rust (rustup).
2. Instala `wasm-pack`.

## Compilar motor WASM

```bash
npm run wasm:build:dev-engine
```

Esto genera:

- `public/wasm/pkg/dev_engine.js`
- `public/wasm/pkg/dev_engine_bg.wasm`

El runtime del front los carga automáticamente desde:

- `src/app/lib/dev-wasm-loader.ts`

## Comportamiento

- Si existe el bundle WASM: usa `score_project` de Rust.
- Si no existe: fallback local TypeScript (`src/app/lib/dev-engine.ts`).
