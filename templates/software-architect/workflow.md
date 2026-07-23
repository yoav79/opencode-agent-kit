# Software Blueprint Workflow

## Estados permitidos

Cada fase puede tener uno de estos estados:

- pending
- in_progress
- waiting_for_user
- needs_revision
- approved
- blocked

## Fases

### 1. Descubrimiento

Objetivo:

Comprender el problema, contexto, usuarios, operación actual, restricciones y
criterios de éxito.

Entregable:

`docs/01-discovery.md`

### 2. Definición ejecutiva

Objetivo:

Definir visión, solución propuesta, propuesta de valor, objetivos, alcance y
exclusiones.

Entregable:

`docs/02-executive-definition.md`

Requiere aprobación explícita.

### 3. Usuarios y procesos

Objetivo:

Documentar actores, roles, procesos actuales, procesos futuros, excepciones y
puntos de control.

Entregable:

`docs/03-users-and-processes.md`

### 4. Catálogo de módulos

Objetivo:

Definir los módulos necesarios, sus responsabilidades, dependencias,
funciones, permisos y prioridad.

Entregable:

`docs/04-module-catalog.md`

Requiere aprobación explícita.

### 5. Requisitos funcionales

Objetivo:

Convertir módulos y procesos en requisitos funcionales trazables y criterios
de aceptación.

Entregable:

`docs/05-functional-requirements.md`

### 6. Información e integraciones

Objetivo:

Definir entidades conceptuales, relaciones, datos sensibles, sistemas externos
e intercambios de información.

Entregable:

`docs/06-data-and-integrations.md`

### 7. Arquitectura

Objetivo:

Evaluar alternativas de arquitectura basadas en requisitos, volumen,
seguridad, presupuesto, infraestructura y equipo.

Entregable:

`docs/07-solution-architecture.md`

Requiere aprobación explícita.

### 8. Stack tecnológico

Objetivo:

Seleccionar tecnologías y justificar cada decisión.

Entregable:

`docs/08-technology-stack.md`

### 9. Seguridad y requisitos no funcionales

Objetivo:

Definir seguridad, rendimiento, disponibilidad, auditoría, respaldos,
recuperación, privacidad y mantenibilidad.

Entregable:

`docs/09-security-and-nfr.md`

### 10. Plan de construcción

Objetivo:

Definir MVP, épicas, dependencias, fases, pruebas, ambientes, despliegue y
operación.

Entregable:

`docs/10-delivery-roadmap.md`

Requiere aprobación explícita.

### 11. Revisión de consistencia

Objetivo:

Detectar contradicciones, omisiones y elementos sin trazabilidad.

Entregable:

`docs/11-consistency-review.md`

### 12. Documento final

Objetivo:

Consolidar toda la documentación aprobada.

Entregable:

`docs/SOFTWARE-BLUEPRINT.md`

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
