# Migración schemaVersion 1 → 2

## Política

Los proyectos nuevos inicializados con `init-software-architect` usan
automáticamente schemaVersion 2 con 14 fases.

Los proyectos existentes con schemaVersion 1 (12 fases) NO se migran
automáticamente. Para migrar un proyecto v1 a v2, ejecuta:

```
node ${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/software-architect/tools/migrate-v1-to-v2.mjs
```

## Qué cambia

| Dimensión | v1 (12) | v2 (14) |
|-----------|---------|---------|
| schemaVersion | 1 | 2 |
| currentPhase max | 12 | 14 |
| Fases | 12 keys | 14 keys |
| Documentos | 12 entries | 14 entries |
| productRequirements | no existe | existe |
| applicationFlow | actores + procesos sueltos | anidados |
| uiuxBrief | no existe | existe |
| backendSchema | entities + integrations sueltos | anidados |
| technicalRequirements | no existe | existe |

## Mapping de fases v1 → v2

| v1 | v2 |
|----|----|
| 1_discovery | 1_discovery |
| 2_executive_definition | 2_product_requirements |
| 3_users_and_processes | 3_application_flow |
| 4_module_catalog | 5_module_catalog |
| 5_functional_requirements | 6_functional_requirements |
| 6_data_and_integrations | 7_backend_schema |
| 7_architecture | 8_solution_architecture |
| 8_technology_stack | 9_technology_stack |
| 9_security_and_nfr | 10_security_and_nfr |
| 10_delivery_roadmap | 12_delivery_roadmap |
| 11_consistency_review | 14_consistency_review |
| 12_final_document | 13_software_blueprint |

## Mapping de documentos v1 → v2

| v1 | v2 |
|----|----|
| 01-discovery.md | 01-discovery.md |
| 02-executive-definition.md | 02-product-requirements.md |
| 03-users-and-processes.md | 03-application-flow.md |
| 04-module-catalog.md | 05-module-catalog.md |
| 05-functional-requirements.md | 06-functional-requirements.md |
| 06-data-and-integrations.md | 07-backend-schema.md |
| 07-solution-architecture.md | 08-solution-architecture.md |
| 08-technology-stack.md | 09-technology-stack.md |
| 09-security-and-nfr.md | 10-security-and-nfr.md |
| 10-delivery-roadmap.md | 12-delivery-roadmap.md |
| 11-consistency-review.md | 14-consistency-review.md |
| SOFTWARE-BLUEPRINT.md | SOFTWARE-BLUEPRINT.md |

## Preservación

- Las decisiones aprobadas (approvedDecisions) se preservan intactas.
- Los ADRs en decisions/ no se modifican.
- Los documentos aprobados se renombran según el mapping.
- Las aprobaciones (approvedAt) se preservan.
- El changeLog se preserva y se agrega entrada de migración.

## Alcance de la migración

La migración es estructural: actualiza `project-state.json` a schemaVersion 2,
remapea fases/documentos y renombra documentos existentes con backups. No crea
documentos faltantes (por ejemplo fases nuevas 04 o 11) ni adapta headings o
contenido v1 a las plantillas v2.

Después de migrar, el proyecto puede requerir remediación manual antes de pasar
`validate-blueprint.mjs` como blueprint final. Reinicia `init-software-architect`
y usa el validador para identificar documentos faltantes, secciones incompatibles
o estados que deban reabrirse.
