---
description: Publica los documentos del Software Blueprint al directorio docs/ del proyecto
agent: software-architect
subtask: false
---

Publica los documentos del Software Blueprint completado a
`docs/software-architect/` en la raíz del proyecto.

## Precondiciones

El blueprint debe estar determinísticamente completo: las 14 fases deben
estar en estado `approved` en `project-state.json`. El validador
`validate-blueprint.mjs` debe retornar cero errores.

Si el blueprint no está listo, el comando informa qué fases faltan y no
publica ningún archivo.

## Ubicación del script

```
${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/software-architect/../../scripts/publish-blueprint.sh
```

En el repositorio del kit: `scripts/publish-blueprint.sh`

## Instrucciones

1. Ejecuta el script de publicación:

   ```
   bash scripts/publish-blueprint.sh .
   ```

   Si el script no está en el PATH del proyecto, usa la ruta completa:
   ```
   bash ${XDG_CONFIG_HOME:-$HOME/.config}/opencode/scripts/publish-blueprint.sh .
   ```

2. Si el script retorna exit code 1:

   - El blueprint no está listo.
   - Informa al usuario que faltan fases por aprobar.
   - Ejecuta el validador para identificar los errores:
     ```
     node ${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/software-architect/tools/validate-blueprint.mjs
     ```
   - Reporta los errores encontrados.
   - No publiques ningún archivo.

3. Si el script retorna exit code 0:

   - Los documentos fueron publicados a `docs/software-architect/`.
   - Informa al usuario los archivos publicados.
   - Si hay decisiones arquitectónicas, también se copian a
     `docs/software-architect/decisions/`.

4. No modifiques `.devflow/software-architect/` durante la publicación.

5. No sobrescribas archivos existentes en `docs/software-architect/` sin
   que el script lo maneje (el script usa `cp -f`).

## Contexto adicional

$ARGUMENTS
