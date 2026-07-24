---
description: Inicializa o continúa el diseño de arquitectura de software del proyecto actual
agent: software-architect
subtask: false
---

Inicializa o continúa el proceso de Software Blueprint para el proyecto ubicado
en el directorio actual usando el agente `software-architect`.

## Objetivo

Preparar el espacio de trabajo del Software Architect y comenzar en la fase
correcta sin sobrescribir información existente.

## Ubicación de plantillas

Las plantillas globales están en:

`${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/software-architect/`

Archivos requeridos:

- `project-state.json`
- `workflow.md`

No reconstruyas estos archivos desde memoria ni desde contenido embebido en el
comando. Si una plantilla no existe, detén la inicialización e informa cuál
archivo falta.

## Instrucciones

1. Confirma que estás trabajando en la raíz del proyecto actual.

2. Define estas rutas conceptuales:

   - Directorio destino: `.devflow/software-architect/`
   - Estado destino: `.devflow/software-architect/project-state.json`
   - Workflow destino: `.devflow/software-architect/workflow.md`
   - Plantilla de estado:
     `${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/software-architect/project-state.json`
   - Plantilla de workflow:
     `${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/software-architect/workflow.md`

3. Revisa si existe el directorio `.devflow/software-architect/`.

4. Si no existe, crea únicamente esta estructura:

   ```text
   .devflow/software-architect/
   ├── project-state.json
   ├── workflow.md
   ├── drafts/
   └── docs/
   ```

5. Para inicializar archivos faltantes:

   - Crea `.devflow/software-architect/drafts/` si no existe.
   - Crea `.devflow/software-architect/docs/` si no existe.
   - Si `.devflow/software-architect/project-state.json` no existe, cópialo desde la
     plantilla global.
   - Si `.devflow/software-architect/workflow.md` no existe, cópialo desde la plantilla
     global.
   - Nunca sobrescribas ninguno de estos archivos si ya existe.

6. Cuando se cree `.devflow/software-architect/project-state.json` por primera vez:

   - Sustituye `project.createdAt` y `project.updatedAt` por la fecha actual en
     formato ISO 8601.
   - Sustituye `changeLog[0].date` por la misma fecha.
   - Conserva el resto de la estructura sin modificaciones.
   - Verifica que el resultado siga siendo JSON válido.

7. Si `.devflow/software-architect/` ya existe:

   - Lee `.devflow/software-architect/project-state.json`.
   - Lee `.devflow/software-architect/workflow.md`.
   - Revisa los documentos existentes en `.devflow/software-architect/docs/`.
   - Revisa los borradores existentes en `.devflow/software-architect/drafts/` solo cuando
     sean relevantes para la fase actual.
   - Identifica la última fase completada.
   - Continúa desde la fase pendiente.
   - No reinicies el blueprint.
   - No borres borradores.
   - No reemplaces decisiones aprobadas.
   - No sobrescribas documentos sin explicar primero el cambio.

8. Comienza exclusivamente con la fase actualmente pendiente.

9. Si la fase actual es Descubrimiento:

   - Revisa primero cualquier información existente del proyecto.
   - No inventes respuestas.
   - Identifica la información faltante.
   - Formula únicamente las preguntas necesarias para completar
     `.devflow/software-architect/docs/01-discovery.md`.
   - Agrupa las preguntas por contexto, usuarios, operación, alcance,
     restricciones y criterios de éxito.
   - No avances todavía a arquitectura, stack tecnológico ni plan de
     construcción.

10. Respeta las puertas de aprobación del flujo.

    Requieren aprobación humana explícita:

    - `02-executive-definition.md`
    - `04-module-catalog.md`
    - `07-solution-architecture.md`
    - `10-delivery-roadmap.md`

11. No modifiques código fuente.

12. No hagas commits ni crees ramas.

13. No borres el contenido de:

    - `.devflow/software-architect/drafts/`
    - `.devflow/software-architect/docs/`

14. Antes de terminar esta ejecución, informa:

    - Si el blueprint fue inicializado o reanudado.
    - La fase actual.
    - Los archivos creados.
    - Los archivos existentes leídos.
    - Las preguntas pendientes.
    - La siguiente aprobación requerida.

## Contexto adicional

$ARGUMENTS
