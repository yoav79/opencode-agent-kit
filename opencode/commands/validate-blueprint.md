---
description: Revisa consistencia, cobertura y readiness del blueprint
agent: architecture-reviewer
subtask: true
---

Valida el blueprint ubicado en `software-design/`.

El campo `subtask: true` indica que este comando se ejecuta como una subtarea
del agente que lo invoca (usualmente `software-architect`), no como una
interaccion directa con el usuario.

Enfoque adicional:

$ARGUMENTS

Procedimiento:

1. Carga la skill `architecture-review`.
2. No modifiques archivos; eres de solo lectura.
3. Ejecuta los 8 pasos de la skill sobre el blueprint actual.
4. Entrega hallazgos clasificados por severidad, con evidencia, impacto,
   recomendacion y condicion de cierre.
5. Concluye con uno de estos estados:
   - **ready-for-delivery-plan** — no hay hallazgos `blocker` ni `major` abiertos.
   - **needs-revision** — hay hallazgos `major` que resolver antes de avanzar.
   - **blocked** — hay hallazgos `blocker` que impiden continuar.
6. El agente que invoco la subtarea es responsable de presentar los hallazgos al
   usuario y determinar los proximos pasos.
