---
name: architecture-review
description: Audita un blueprint de software para detectar contradicciones, huecos, riesgos operativos y falta de trazabilidad antes de implementar
license: MIT
compatibility: opencode
metadata:
  audience: architecture-reviewers
  workflow: validation
---

# Architecture review

## Metodo

1. Construye una matriz requisito-componente-validacion.
2. Busca responsabilidades duplicadas o sin owner.
3. Revisa contratos, estados, errores, reintentos e idempotencia.
4. Identifica dependencias implicitas y puntos unicos de falla.
5. Comprueba seguridad, secretos, permisos y datos sensibles.
6. Comprueba logs, metricas, trazas, alertas y recuperacion.
7. Revisa que el plan de entrega reduzca riesgo de forma incremental.
8. Verifica que los gates sean deterministas siempre que sea posible.

## Severidad

- blocker: impide implementar o validar de forma segura.
- major: puede causar rediseño, perdida de datos o fallo operativo serio.
- minor: debilidad local con impacto controlado.
- observation: mejora o cuestion no bloqueante.

## Salida

Incluye evidencia, impacto, recomendacion concreta y condicion de cierre para
cada hallazgo.
