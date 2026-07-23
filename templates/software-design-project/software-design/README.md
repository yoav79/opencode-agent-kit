# Software design

Directorio de trabajo para descubrir, especificar, disenar y validar el sistema.

## Directorios

- **`docs/`**: documentos vigentes y aprobados. Solo un documento activo por
  topic.
- **`drafts/`**: trabajo incompleto o pendiente de aprobacion. Los borradores
  nunca se eliminan; se promueven a `docs/` o se mueven a `archive/`.
- **`decisions/`**: decisiones arquitectonicas registradas como ADRs. Ver
  `decisions/README.md` para el formato.
- **`archive/`**: versiones reemplazadas que deben conservarse por
  trazabilidad.

## Flujo de trabajo

Lee `workflow.md` para los criterios de salida de cada fase. Usa
`project-state.json` para rastrear el progreso.

## Fuente de verdad

`project-state.json` controla la fase, bloqueos y referencias de evidencia. **No
es un documento narrativo.** La informacion sobre *por que* se decidio algo va en
`decisions/`. La informacion sobre *que* hace el sistema va en `docs/`.
