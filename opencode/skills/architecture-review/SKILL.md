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

Ejecuta estos 8 pasos en orden. Cada paso produce hallazgos que se clasifican
por severidad.

### 1. Matriz requisito-componente-validacion

Construye una matriz que mapea cada requisito a los componentes que lo
implementan y como se valida. Identifica requisitos sin componente y
componentes sin requisito.

### 2. Responsabilidades y ownership

Busca responsabilidades duplicadas entre componentes y componentes sin un owner
definido.

### 3. Contratos y estados

Revisa los contratos entre componentes: estados, errores, reintentos,
idempotencia y consistencia.

### 4. Dependencias y puntos de falla

Identifica dependencias implicitas (no documentadas) y puntos unicos de falla
que puedan comprometer todo el sistema.

### 5. Seguridad y datos sensibles

Comprueba manejo de secretos, permisos, datos sensibles y superficie de ataque.

### 6. Observabilidad y recuperacion

Verifica que existan logs, metricas, trazas, alertas y procedimientos de
recuperacion ante fallos.

### 7. Plan de entrega

Revisa que el plan de implementacion reduzca riesgo de forma incremental y que
cada incremento sea verificable.

### 8. Gates

Verifica que los gates sean deterministas siempre que sea posible (evitar
criterios subjetivos como "se ve bien").

## Severidad

- **blocker** — impide implementar o validar de forma segura. Ejemplo: un
  componente critico no tiene definido su contrato de entrada.
- **major** — puede causar rediseño, perdida de datos o fallo operativo serio.
  Ejemplo: no hay estrategia de backup para datos criticos.
- **minor** — debilidad local con impacto controlado. Ejemplo: un componente
  tiene responsabilidades ligeramente solapadas.
- **observation** — mejora o cuestion no bloqueante. Ejemplo: podria usarse un
  patron de diseno mas idiomático.

## Salida

Para cada hallazgo incluye:

- **severidad**: blocker/major/minor/observation;
- **evidencia**: que lo origina (archivo, seccion, requisito especifico);
- **impacto**: que consecuencia tiene si no se resuelve;
- **recomendacion**: accion concreta para resolverlo;
- **condicion de cierre**: como se sabra que se resolvio (criterio verificable).

## Criterios de salida

La revision esta completa cuando:

- los 8 pasos han sido ejecutados;
- cada hallazgo tiene evidencia, impacto, recomendacion y condicion de cierre;
- se ha clasificado el blueprint como `ready-for-delivery-plan`,
  `needs-revision` o `blocked` segun la severidad maxima de los hallazgos
  abiertos.
