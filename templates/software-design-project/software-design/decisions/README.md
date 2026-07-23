# Decisions

Las decisiones arquitectonicas se registran como ADRs (Architecture Decision
Records). Cada decision importante tiene un archivo.

## Formato de nombre

```text
ADR-NNNN-short-title.md
```

Donde `NNNN` es un numero secuencial (0001, 0002, ...) asignado por el agente
que crea el ADR. No dejes gaps en la numeracion.

## Estructura minima

```markdown
# ADR-NNNN: Titulo de la decision

## Estado

proposed | accepted | superseded | rejected

## Contexto

Que situacion o problema motiva esta decision.

## Decision

Que se decidio y por que.

## Alternativas consideradas

Que otras opciones se evaluaron y por que se descartaron.

## Consecuencias

Que impacto tiene esta decision (positivo y negativo).

## Evidencia y fecha

Que evidencia respalda la decision y cuando se tomo.
```

## Cuando crear un ADR

- Cuando se elige entre dos o mas alternativas para un componente o integracion.
- Cuando se establece una convencion que afecta a multiples partes del sistema.
- Cuando se acepta un tradeoff conocido (por ejemplo: consistencia vs.
  disponibilidad).

No crear ADRs para decisiones triviales o que estan claramente determinadas por
los requisitos.
