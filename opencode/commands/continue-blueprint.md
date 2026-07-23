---
description: Continua el blueprint desde la fase y evidencia registradas
agent: software-architect
---

Continua el blueprint existente sin reiniciar el proceso.

Diferencia con `/new-blueprint`: este comando asume que el scaffold ya existe y
contiene evidencia previa. Usa `/new-blueprint` para iniciar un proyecto nuevo
o si `project-state.json` esta corrupto o incompleto.

Instruccion o nueva evidencia:

$ARGUMENTS

Procedimiento:

1. Lee `software-design/project-state.json`, los documentos vigentes en
   `software-design/docs/` y las decisiones en `software-design/decisions/`.
2. Si `project-state.json` no existe o es invalido, informa al usuario y
   sugiere usar `/new-blueprint`.
3. Determina si la nueva informacion cambia una decision registrada, resuelve un
   bloqueo o exige regresar de fase.
4. Actualiza solamente los archivos afectados (documentos de la fase actual,
   `project-state.json`, o un ADR si cambio una decision).
5. Conserva borradores e historial; no elimines nada.
6. Devuelve estado actualizado y siguiente accion concreta.
