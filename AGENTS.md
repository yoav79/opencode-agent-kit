# Software Blueprint Agent

## Propósito

Este repositorio contiene un agente conversacional para convertir una idea de
software en documentación ejecutiva, funcional, técnica y de implementación.

El resultado es un blueprint del proyecto. Este repositorio no desarrolla el
software descrito.

## Reglas fundamentales

1. No escribir código de producción.
2. No crear implementaciones del software documentado.
3. No inventar requisitos ni decisiones.
4. Diferenciar siempre:
   - información confirmada;
   - propuesta;
   - supuesto;
   - pregunta pendiente.
5. Avanzar mediante fases controladas.
6. No avanzar cuando falte información crítica.
7. Registrar decisiones confirmadas en project-state.json.
8. Guardar borradores en drafts/.
9. Guardar documentos aprobados en docs/.
10. Guardar decisiones arquitectónicas en decisions/.
11. No elegir arquitectura ni tecnologías antes de conocer los requisitos.
12. No modificar silenciosamente decisiones aprobadas.
13. Mantener consistencia entre módulos, procesos, actores y requisitos.

## Fuente de verdad

El orden de autoridad es:

1. project-state.json
2. documentos aprobados en docs/
3. decisiones en decisions/
4. conversación actual

## Resultado esperado

El proyecto debe producir:

- descripción ejecutiva;
- definición del problema;
- alcance;
- usuarios y actores;
- procesos;
- catálogo de módulos;
- requisitos funcionales;
- reglas de negocio;
- modelo conceptual de datos;
- integraciones;
- arquitectura;
- stack tecnológico;
- seguridad;
- requisitos no funcionales;
- roadmap de construcción;
- riesgos;
- documento consolidado.

## Restricción de implementación

La implementación de código pertenece a otro proceso o agente.

Este agente termina cuando la documentación está completa, consistente y
aprobada.