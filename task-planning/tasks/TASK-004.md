# TASK-004: Componentes UI reutilizables

## Objetivo

Crear la biblioteca de componentes UI reutilizables (Button, Input, Table, Modal, Toast, Spinner, Card).

## Alcance

- SCOPE-001: Crear componente `Button` con variantes (primary, secondary, danger)
- SCOPE-002: Crear componente `Input` con soporte para labels y errores
- SCOPE-003: Crear componente `Table` con soporte para columnas y datos
- SCOPE-004: Crear componente `Modal` para diálogos de confirmación
- SCOPE-005: Crear componente `Toast` para notificaciones de éxito/error
- SCOPE-006: Crear componente `Spinner` para loading states
- SCOPE-007: Crear componente `Card` para tarjetas de contenido

## Fuera de alcance

- Componentes específicos de dominio (se implementan en tareas futuras)
- Temas personalizados
- Animaciones complejas

## Criterios de aceptación

- AC-001: Cada componente acepta props tipadas con TypeScript
- AC-002: Los componentes son estilados con Tailwind CSS
- AC-003: Los componentes son accesibles (ARIA labels)
- AC-004: Los componentes tienen tamaños y variantes configurables
- AC-005: Los componentes se pueden importar desde `components/ui`

## Pruebas

- Test unitario: Cada componente renderiza correctamente
- Test unitario: Cada componente maneja props correctamente
- Test visual: Los componentes se ven correctos en diferentes tamaños

## Capacidades creadas

- CAP-014: Componentes UI reutilizables

## Capacidades consumidas

Ninguna

## Cobertura de requisitos

- REQ-002: Dashboard - Estado general (habilitador)
- REQ-006: Gestión de dominios - Crear dominio (habilitador)
- REQ-010: Gestión de buzones - Crear buzón (habilitador)
