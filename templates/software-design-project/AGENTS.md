# Instrucciones del proyecto

## Alcance de los agentes de diseño

- Los artefactos de diseño viven en `software-design/`.
- No modificar codigo de producto durante discovery o arquitectura salvo
  autorizacion explicita.
- Leer `software-design/project-state.json` antes de continuar un flujo.
- No declarar una fase terminada sin cumplir sus criterios de salida (definidos
  en `software-design/workflow.md`).
- Registrar decisiones materiales en `software-design/decisions/`.
- Mantener borradores y versiones reemplazadas; no borrarlos para ocultar
  cambios o reducir ruido.

## Comandos del proyecto

Configurar cuando exista codigo de producto:

- Build: `pendiente` (por ejemplo: `npm run build`, `cargo build`)
- Lint: `pendiente` (por ejemplo: `npm run lint`, `cargo clippy`)
- Tests: `pendiente` (por ejemplo: `npm test`, `cargo test`)
- Typecheck: `pendiente` (por ejemplo: `npm run typecheck`, `cargo check`)

> Los campos marcados como "pendiente" deben completarse una vez que el proyecto
> tenga tooling de build configurado. Los agentes usarán estos comandos para
> validar cambios.
