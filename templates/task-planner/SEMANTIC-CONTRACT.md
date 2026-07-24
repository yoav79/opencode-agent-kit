# Deterministic semantic validation contract

## Purpose

The validator does not interpret natural language. It verifies that one approved semantic identity is propagated without alteration from the resolved blueprint contract to requirements, behaviors, capabilities, tasks, coverage and task Markdown.

## Source of truth

`.devflow/task-planner/semantic-contract.json` is the machine-readable semantic source approved together with the resolved blueprint.

Each `contracts[]` record must contain:

- `behaviorId`
- `semanticKey`
- `sourceFunctionId`
- `requirementId`
- `operation`
- `outcome`
- `sourceSection`
- `sourceItem`
- `scope`

Example:

```json
{
  "behaviorId": "BEH-DOMAIN-UPDATE",
  "semanticKey": "domain.update",
  "sourceFunctionId": "FUN-DOMAIN-UPDATE",
  "requirementId": "REQ-DOMAIN-001",
  "operation": "update_domain",
  "outcome": "The administrator updates one existing domain.",
  "sourceSection": "5.3 Domain management",
  "sourceItem": "Update domain",
  "scope": "mvp"
}
```

## Requirements contract

`requirements.json` uses `schemaVersion: 3`.

Every behavior must copy exactly from its approved semantic contract:

- `semanticKey`
- `sourceFunctionId`
- `operation`
- `outcome`
- `sourceSection`
- `sourceItem`
- `scope`

Any difference is `BEHAVIOR_SEMANTIC_CONTRACT_MISMATCH`.

## Capability contract

`capability-map.json` uses `schemaVersion: 3`.

Every functional capability declares:

```json
{
  "behaviorIds": ["BEH-DOMAIN-UPDATE"],
  "semanticKeys": ["domain.update"]
}
```

The semantic keys must be exactly those required by the declared behaviors. Every MVP behavior must have at least one planned functional capability, and a behavior cannot be owned by several functional capabilities.

## Task contract

`task-plan.json` uses `schemaVersion: 4`.

Every functional task declares:

```json
{
  "behaviorIds": ["BEH-DOMAIN-UPDATE"],
  "semanticKeys": ["domain.update"]
}
```

The set must exactly equal:

1. the behaviors implemented by the functional capability created by the task;
2. the behaviors claimed in `requirementCoverage`.

## Task Markdown contract

Every task contains:

````md
## Contrato semántico
```json
{
  "behaviorIds": ["BEH-DOMAIN-UPDATE"],
  "semanticKeys": ["domain.update"],
  "sourceFunctionIds": ["FUN-DOMAIN-UPDATE"]
}
```
```
````

The validator compares this block exactly with `task-plan.json` and `semantic-contract.json`.

## Important limitation

This contract makes semantic lineage deterministic. It does not infer whether arbitrary prose is correct. The structured semantic contract is authoritative; descriptive prose must not override it.
