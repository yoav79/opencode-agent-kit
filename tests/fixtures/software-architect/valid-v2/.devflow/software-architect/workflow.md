# Software Blueprint Workflow v2

## Estados permitidos

Cada fase puede tener uno de estos estados:

- pending
- in_progress
- waiting_for_user
- needs_revision
- approved
- blocked

## Fases

| # | Fase | Tipo | Entregable | Aprobación | Ejecutor | Dependencia |
|---|------|------|-----------|-----------|----------|-----------|
| 1 | Discovery | Entrevista | `01-discovery.md` | Usuario | Principal | — |
| 2 | Product Requirements | Entrevista | `02-product-requirements.md` | Usuario | Principal | 1 |
| 3 | Application Flow | Entrevista | `03-application-flow.md` | Usuario | Principal | 2 |
| 4 | UI/UX Brief | Entrevista | `04-uiux-brief.md` | Usuario | Principal | 3 |
| 5 | Module Catalog | Entrevista | `05-module-catalog.md` | Usuario | Principal | 4 |
| 6 | Functional Requirements | Entrevista | `06-functional-requirements.md` | Usuario | Principal | 5 |
| 7 | Backend Schema | Entrevista | `07-backend-schema.md` | Usuario | Principal | 6 |
| 8 | Solution Architecture | Entrevista | `08-solution-architecture.md` | Gate explícito | Principal | 7 |
| 9 | Technology Stack | Entrevista | `09-technology-stack.md` | Usuario | Principal | 8 |
| 10 | Security & NFR | Entrevista | `10-security-and-nfr.md` | Usuario | Principal | 9 |
| 11 | Technical Requirements | Síntesis | `11-technical-requirements.md` | Principal (promueve) | blueprint-compiler | 7–10 |
| 12 | Delivery Roadmap | Entrevista | `12-delivery-roadmap.md` | Gate explícito | Principal | 11 |
| 13 | Software Blueprint | Síntesis | `SOFTWARE-BLUEPRINT.md` | Principal (promueve) | blueprint-compiler | 1–12 |
| 14 | Consistency Review | Revisión | `14-consistency-review.md` | Gate final | consistency-reviewer | 13 |

### Reglas

1. Cada fase produce exactamente un entregable.
2. Una fase solo comienza cuando su dependencia está `approved`.
3. Las fases de tipo **Síntesis** no entrevistan al usuario; ejecutan un
   subagente determinista (`blueprint-compiler`).
4. La fase **Consistency Review** ejecuta al subagente `consistency-reviewer`.
5. Los **Gates explícitos** (fases 8, 12, 14) requieren aprobación humana
   obligatoria y bloquean el avance si no se conceden.
6. La aprobación final del blueprint completo es el gate de la fase 14, no una
   fase 15 adicional.
7. Los subagentes (blueprint-compiler, consistency-reviewer) escriben
   exclusivamente en `drafts/`. Solo el agente principal promueve a `docs/`
   después de verificar el checklist de la plantilla y obtener la aprobación
   correspondiente.

### Entregables

Cada entregable se escribe en:

```
.devflow/software-architect/docs/<ARCHIVO>
```

Excepto los generados por subagentes, que primero se escriben en `drafts/` y
luego el agente principal los promueve a `docs/` tras verificación.

## Regla de avance

Una fase solo puede aprobarse cuando:

1. La información obligatoria está completa.
2. Las contradicciones están resueltas.
3. Los supuestos críticos fueron aprobados o eliminados.
4. El entregable fue creado.
5. `project-state.json` fue actualizado.
6. El usuario aprobó la fase cuando corresponde.

## Información faltante

Cuando falte información crítica:

1. Cambiar la fase a `waiting_for_user`.
2. Registrar las preguntas en `openQuestions`.
3. Hacer entre tres y siete preguntas.
4. No completar vacíos con información inventada.
5. Esperar las respuestas antes de continuar.

## Cambios posteriores

Cuando cambie una decisión aprobada:

1. Registrar el cambio.
2. Identificar documentos afectados.
3. Marcar fases dependientes como `needs_revision`.
4. Actualizar documentos fuente.
5. Actualizar después el documento consolidado.
