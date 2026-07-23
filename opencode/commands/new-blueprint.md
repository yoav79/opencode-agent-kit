---
description: Inicia o diagnostica un blueprint de software para un proyecto
agent: software-architect
---

Inicia el flujo de blueprint para este proyecto.

Contexto adicional proporcionado por el usuario:

$ARGUMENTS

Procedimiento:

1. Lee `AGENTS.md` y revisa si existe `software-design/project-state.json`.
2. Si el scaffold no existe, explica exactamente que falta y solicita permiso
   antes de crear archivos.
3. Si existe, valida su estructura y determina la fase real con evidencia.
4. Carga `requirements-discovery` para iniciar o continuar discovery.
5. No inventes respuestas ni marques fases como completadas por antiguedad.
6. Devuelve diagnostico, bloqueos y siguiente accion concreta.
