---
description: Inicializa el espacio de trabajo del Software Architect (wrapper de compatibilidad que delega en devflow init software-architect)
agent: general
subtask: true
---

Wrapper de compatibilidad que delega en el instalador centralizado.

## Comportamiento

Delega exclusivamente en:

```bash
node <RUTA_REPO>/bin/devflow.mjs init software-architect
```

No copies archivos, no crees directorios, no resuelvas dependencias.

## Instrucciones

1. Confirma que estás trabajando en la raíz del proyecto actual.
2. Ejecuta:
   ```bash
   node <RUTA_REPO>/bin/devflow.mjs init software-architect
   ```
3. Presenta el resultado JSON producido por el CLI.
4. Si el resultado indica conflictos, preséntalos textualmente sin intentar
   resolverlos automáticamente.

## Notas

- Este comando es un wrapper de compatibilidad temporario.
- El comando canónico es `/devflow-init software-architect`.
- Será eliminado cuando todos los flujos migren al nuevo comando.

## Contexto adicional

$ARGUMENTS
