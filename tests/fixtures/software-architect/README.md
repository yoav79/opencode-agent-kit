# Software Architect Fixtures

Estos fixtures son entradas reproducibles para
`validate-blueprint.mjs` y `migrate-v1-to-v2.mjs`. No ejecutan OpenCode ni
representan flujos conversacionales o pruebas de runtime.

| Fixture | Propósito | Resultado esperado |
|---------|-----------|--------------------|
| `valid-v2/` | Estado v2 completo con sus documentos | El validator finaliza correctamente |
| `missing-docs/` | Estado que registra documentos ausentes | El validator rechaza el proyecto |
| `blocked-review/` | Estado con revisión final bloqueada | El validator rechaza el cierre |
| `v1-project/` | Proyecto mínimo en schemaVersion 1 | El migrador produce la estructura v2 esperada |

Los fixtures deben contener solamente la información necesaria para comprobar
el comportamiento determinista. Los permisos, slash commands, delegación de
subagentes y aprobaciones humanas requieren pruebas de runtime separadas.
