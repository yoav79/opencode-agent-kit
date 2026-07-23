---
description: Inicia o diagnostica un blueprint de software para un proyecto
agent: software-architect
---

Inicia el flujo de blueprint para este proyecto.

Contexto adicional proporcionado por el usuario:

$ARGUMENTS

Procedimiento:

1. Lee el `AGENTS.md` del proyecto y revisa si existe
   `software-design/project-state.json`.
2. Si el scaffold no existe, explica que falta (directorio `software-design/` con
   `project-state.json`) y solicita permiso antes de crear archivos. Si el
   usuario autoriza, ejecuta `./scripts/create-project.sh` o crea la estructura
   manualmente.
3. Si existe, valida su estructura y determina la fase real con evidencia (no por
   antiguedad).
4. Carga `requirements-discovery` para iniciar o continuar discovery.
5. No inventes respuestas ni marques fases como completadas solo porque ya
   empezaron; la completitud se basa en evidencia, no en tiempo transcurrido.
6. Devuelve diagnostico, bloqueos y siguiente accion concreta.
