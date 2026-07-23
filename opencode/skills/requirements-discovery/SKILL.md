---
name: requirements-discovery
description: Descubre y valida problema, actores, proceso actual, restricciones, criterios de exito y alcance antes de disenar software
license: MIT
compatibility: opencode
metadata:
  audience: software-architects
  workflow: discovery
---

# Requirements discovery

## Objetivo

Convertir informacion inicial en evidencia suficiente para decidir si el
proyecto puede avanzar a requisitos.

## Procedimiento

1. **Hechos confirmados** — Reune informacion verificada sobre el problema, los
   actores involucrados y el responsable de la decision (stakeholder o
   comprador). Distingue lo confirmado de lo inferido.
2. **Proceso actual** — Describe como funciona hoy: entradas, salidas,
   responsables, excepciones y herramientas involucradas.
3. **Dolor vs. solucion** — Distingue el dolor original, su causa, los sintomas
   visibles y la solucion propuesta. Evita confundir sintoma con causa.
4. **Resultados medibles** — Define que exito significa en terminos cuantificables
   y cual es el horizonte de evaluacion (semanas, meses,metricas).
5. **Restricciones** — Identifica limitaciones legales, tecnicas, operativas,
   economicas y de tiempo que el diseno debe respetar.
6. **Alcance y exclusiones** — Delimita explicitamente que esta fuera del alcance
   de este proyecto.
7. **Preguntas estrategicas** — Formula solo las preguntes que cambien alcance,
   arquitectura o criterio de exito. Las preguntas que no cumplen este umbral se
   anotan pero no se presentan al usuario.

## Como se recolecta informacion

- Through conversacion directa con el usuario.
- Leyendo documentacion existente en el repositorio (README, issues, codigo).
- Inspeccionando la estructura del proyecto y su historial de git.

## Criterios de salida

Discovery puede cerrarse solamente cuando existen:

- problema y usuario objetivo confirmados;
- proceso actual comprensible;
- comprador o responsable de decision identificado;
- criterio de exito medible;
- restricciones materiales registradas;
- alcance inicial y exclusiones;
- decisiones pendientes visibles (no ocultas).

Si solo algunos criterios estan cumplidos, discovery permanece abierto. El agente
debe reportar exactamente cuales faltan.
