# Workflow de software design

Cada fase tiene criterios de salida que deben cumplirse antes de avanzar. Las
fases se completan en orden, pero es valido regresar si nueva evidencia lo
requiere.

## 1. Discovery

Salida requerida:

- problema y usuario objetivo confirmados;
- proceso actual documentado;
- criterio de exito medible;
- restricciones y exclusiones;
- preguntas y decisiones pendientes visibles.

**No avanzar a requirements** hasta que los 7 criterios de
`requirements-discovery` se cumplan.

## 2. Requirements

Salida requerida:

- requisitos funcionales identificables (con ID unico);
- requisitos no funcionales medibles;
- reglas de negocio y excepciones;
- criterios de aceptacion por requisito;
- trazabilidad con discovery (que requisito resuelve que problema).

## 3. Architecture

Salida requerida:

- contexto y limites del sistema;
- componentes con responsabilidad unica y owner;
- datos, integraciones y contratos;
- seguridad y operacion;
- tradeoffs y decisiones registradas en `decisions/`.

## 4. Delivery plan

Salida requerida:

- incrementos verticales demostrables;
- dependencias y secuencia;
- gates deterministas (criterios objetivos de paso);
- estrategia de pruebas por componente;
- riesgos y plan de rollback.

## 5. Validation

Salida requerida:

- revision independiente ejecutada (subagente `architecture-reviewer`);
- hallazgos `blocker` y `major` cerrados o aceptados con justificacion;
- cobertura requisito-componente-prueba verificada;
- readiness confirmado: el blueprint esta listo para implementar.

**Un blueprint se considera completado** cuando validation se resuelve sin
hallazgos `blocker` ni `major` abiertos.
