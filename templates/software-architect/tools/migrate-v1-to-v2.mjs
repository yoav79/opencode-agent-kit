#!/usr/bin/env node

import { access, copyFile, readFile, rename, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const PHASE_MAP = {
  '1_discovery': '1_discovery',
  '2_executive_definition': '2_product_requirements',
  '3_users_and_processes': '3_application_flow',
  '4_module_catalog': '5_module_catalog',
  '5_functional_requirements': '6_functional_requirements',
  '6_data_and_integrations': '7_backend_schema',
  '7_architecture': '8_solution_architecture',
  '8_technology_stack': '9_technology_stack',
  '9_security_and_nfr': '10_security_and_nfr',
  '10_delivery_roadmap': '12_delivery_roadmap',
  '11_consistency_review': '14_consistency_review',
  '12_final_document': '13_software_blueprint',
};

const DOC_MAP = {
  '01_discovery': '01_discovery',
  '02_executive_definition': '02_product_requirements',
  '03_users_and_processes': '03_application_flow',
  '04_module_catalog': '05_module_catalog',
  '05_functional_requirements': '06_functional_requirements',
  '06_data_and_integrations': '07_backend_schema',
  '07_solution_architecture': '08_solution_architecture',
  '08_technology_stack': '09_technology_stack',
  '09_security_and_nfr': '10_security_and_nfr',
  '10_delivery_roadmap': '12_delivery_roadmap',
  '11_consistency_review': '14_consistency_review',
  '12_final_document': '13_software_blueprint',
};

const DOC_KEY_TO_FILENAME = {
  '01_discovery': '01-discovery.md',
  '02_product_requirements': '02-product-requirements.md',
  '03_application_flow': '03-application-flow.md',
  '04_uiux_brief': '04-uiux-brief.md',
  '05_module_catalog': '05-module-catalog.md',
  '06_functional_requirements': '06-functional-requirements.md',
  '07_backend_schema': '07-backend-schema.md',
  '08_solution_architecture': '08-solution-architecture.md',
  '09_technology_stack': '09-technology-stack.md',
  '10_security_and_nfr': '10-security-and-nfr.md',
  '11_technical_requirements': '11-technical-requirements.md',
  '12_delivery_roadmap': '12-delivery-roadmap.md',
  '13_software_blueprint': 'SOFTWARE-BLUEPRINT.md',
  '14_consistency_review': '14-consistency-review.md',
};

const NEW_DOC_KEYS = ['04_uiux_brief', '11_technical_requirements'];

async function fileExists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function main() {
  const root = process.cwd();
  const bpDir = path.join(root, '.devflow/software-architect');
  const stateFile = path.join(bpDir, 'project-state.json');
  const docsDir = path.join(bpDir, 'docs');

  if (!(await fileExists(stateFile))) {
    console.error('No existe .devflow/software-architect/project-state.json');
    process.exit(1);
  }

  const raw = await readFile(stateFile, 'utf8');
  const state = JSON.parse(raw);

  if (state.schemaVersion === 2) {
    console.log('Ya es schemaVersion 2. No se requiere migración.');
    process.exit(0);
  }

  if (state.schemaVersion !== 1) {
    console.error(`schemaVersion inesperado: ${state.schemaVersion}`);
    process.exit(1);
  }

  console.log('Migrando schemaVersion 1 → 2...');

  // Backup original
  await copyFile(stateFile, stateFile + '.v1');
  console.log('Backup creado: project-state.json.v1');

  // Map phases
  const newPhases = {};
  for (const [oldKey, status] of Object.entries(state.phases || {})) {
    const newKey = PHASE_MAP[oldKey];
    if (newKey) newPhases[newKey] = status;
  }
  // Add new phases with pending
  for (const key of Object.values(PHASE_MAP)) {
    if (!(key in newPhases)) newPhases[key] = 'pending';
  }

  // Map documents
  const newDocs = {};
  for (const [oldKey, docInfo] of Object.entries(state.documents || {})) {
    const newKey = DOC_MAP[oldKey];
    if (newKey) newDocs[newKey] = docInfo;
  }
  for (const key of NEW_DOC_KEYS) {
    if (!(key in newDocs)) newDocs[key] = { status: 'pending', approvedAt: null };
  }

  // Build new state
  const newState = {
    schemaVersion: 2,
    project: {
      ...state.project,
      currentPhase: Math.min(state.project?.currentPhase || 1, 14),
    },
    phases: newPhases,
    confirmed: state.confirmed || {},
    productRequirements: {
      vision: null,
      valueProposition: null,
      objectives: state.confirmed?.objectives || [],
      mvpScope: [],
      postMvpScope: [],
      outOfScope: state.confirmed?.outOfScope || [],
    },
    applicationFlow: {
      actors: state.actors || [],
      processes: state.processes || [],
      exceptions: [],
      controlPoints: [],
    },
    uiuxBrief: {
      designSystem: null,
      brandColors: [],
      typography: null,
      targetDevices: [],
      accessibility: null,
      keyScreens: [],
    },
    modules: state.modules || [],
    functionalRequirements: state.functionalRequirements || [],
    backendSchema: {
      entities: state.entities || [],
      sensitiveData: [],
      integrations: state.integrations || [],
      volumeEstimates: null,
    },
    architecture: state.architecture || { status: 'pending', style: null, description: null, layers: [], principles: [] },
    technologyStack: state.technologyStack || { status: 'pending', approvedStack: {} },
    technicalRequirements: {
      performance: null,
      scalability: null,
      availability: null,
      compliance: null,
      security: null,
      monitoring: null,
    },
    approvedDecisions: state.approvedDecisions || [],
    assumptions: state.assumptions || [],
    risks: state.risks || [],
    openQuestions: state.openQuestions || [],
    pendingApprovals: state.pendingApprovals || [],
    documents: newDocs,
    changeLog: [
      ...(state.changeLog || []),
      {
        date: new Date().toISOString(),
        action: 'Migración v1 → v2 completada',
        details: 'schemaVersion actualizado a 2, fases re-mapeadas a 14, nuevas secciones agregadas.',
      },
    ],
  };

  await writeFile(stateFile, JSON.stringify(newState, null, 2) + '\n', 'utf8');
  console.log('project-state.json actualizado a schemaVersion 2');

  // Rename docs
  if (await fileExists(docsDir)) {
    const files = await readdir(docsDir);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const oldKey = Object.entries(DOC_KEY_TO_FILENAME).find(([, v]) => v === file)?.[0];
      if (oldKey) continue;
      const oldDocKey = Object.entries(DOC_MAP).find(([, v]) => DOC_KEY_TO_FILENAME[v] === file)?.[0];
      if (!oldDocKey) continue;
      const newFilename = DOC_KEY_TO_FILENAME[DOC_MAP[oldDocKey]];
      if (newFilename && newFilename !== file) {
        const oldPath = path.join(docsDir, file);
        const newPath = path.join(docsDir, newFilename);
        if (await fileExists(newPath)) {
          console.log(`  ${file} → ${newFilename} (ya existe, saltando)`);
        } else {
          await rename(oldPath, newPath);
          console.log(`  ${file} → ${newFilename}`);
        }
      }
    }
  }

  console.log('\nMigración completada. Los archivos originales tienen sufijo .v1');
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
