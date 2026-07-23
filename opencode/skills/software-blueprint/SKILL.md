---
name: software-blueprint
description: Produce un blueprint de software trazable desde requisitos hasta componentes, datos, integraciones, seguridad, operacion y plan de entrega
license: MIT
compatibility: opencode
metadata:
  audience: software-architects
  workflow: architecture
---

# Software blueprint

## Entregables minimos

1. Resumen ejecutivo y objetivo del sistema.
2. Actores y casos de uso prioritarios.
3. Requisitos funcionales y no funcionales identificables.
4. Contexto, limites y sistemas externos.
5. Componentes con responsabilidad unica y ownership.
6. Flujos principales, alternos y de error.
7. Modelo de datos conceptual y ciclo de vida.
8. Contratos de integracion y dependencias.
9. Seguridad, privacidad, auditoria y permisos.
10. Observabilidad, recuperacion y operacion.
11. Estrategia de pruebas y gates.
12. Riesgos, tradeoffs y decisiones pendientes.
13. Plan incremental de implementacion.

## Reglas

- Cada componente debe justificar que requisito satisface.
- Cada requisito critico debe tener una forma de validacion.
- No elegir tecnologia sin registrar la necesidad y el tradeoff.
- No confundir una lista de herramientas con una arquitectura.
- Separar estado actual, objetivo y transicion.
