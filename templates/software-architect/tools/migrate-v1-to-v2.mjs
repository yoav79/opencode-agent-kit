#!/usr/bin/env node

import { access, copyFile, readFile, rename, writeFile, readdir, mkdir } from 'node:fs/promises';
import { execSync } from 'node:child_process';
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

const V1_TO_V2_FILENAME = {
  '02-executive-definition.md': '02-product-requirements.md',
  '03-users-and-processes.md': '03-application-flow.md',
  '04-module-catalog.md': '05-module-catalog.md',
  '05-functional-requirements.md': '06-functional-requirements.md',
  '06-data-and-integrations.md': '07-backend-schema.md',
  '07-solution-architecture.md': '08-solution-architecture.md',
  '08-technology-stack.md': '09-technology-stack.md',
  '09-security-and-nfr.md': '10-security-and-nfr.md',
  '10-delivery-roadmap.md': '12-delivery-roadmap.md',
  '11-consistency-review.md': '14-consistency-review.md',
};

const ALL_V2_PHASE_KEYS = [
  '1_discovery',
  '2_product_requirements',
  '3_application_flow',
  '4_uiux_brief',
  '5_module_catalog',
  '6_functional_requirements',
  '7_backend_schema',
  '8_solution_architecture',
  '9_technology_stack',
  '10_security_and_nfr',
  '11_technical_requirements',
  '12_delivery_roadmap',
  '13_software_blueprint',
  '14_consistency_review',
];

const V1_PHASE_ORDER = [
  '1_discovery',
  '2_executive_definition',
  '3_users_and_processes',
  '4_module_catalog',
  '5_functional_requirements',
  '6_data_and_integrations',
  '7_architecture',
  '8_technology_stack',
  '9_security_and_nfr',
  '10_delivery_roadmap',
  '11_consistency_review',
  '12_final_document',
];

function v1PhaseIndex(oldKey) {
  return V1_PHASE_ORDER.indexOf(oldKey);
}

function getNow() {
  const timestampTool = path.join(
    process.env.XDG_CONFIG_HOME || path.join(process.env.HOME || '~', '.config'),
    'opencode', 'templates', 'shared', 'tools', 'timestamp.mjs'
  );
  try {
    return execSync(`node "${timestampTool}" now`, { encoding: 'utf8', timeout: 5000 }).trim();
  } catch {
    return new Date().toISOString();
  }
}

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

  // Initialize all v2 phases as pending
  const newPhases = {};
  for (const key of ALL_V2_PHASE_KEYS) {
    newPhases[key] = 'pending';
  }
  // Map old phases over the new ones
  for (const [oldKey, status] of Object.entries(state.phases || {})) {
    const newKey = PHASE_MAP[oldKey];
    if (newKey) newPhases[newKey] = status;
  }

  // Map documents
  const newDocs = {};
  for (const [oldKey, docInfo] of Object.entries(state.documents || {})) {
    const newKey = DOC_MAP[oldKey];
    if (newKey) newDocs[newKey] = {
      status: docInfo.status || 'pending',
      approvedAt: docInfo.approvedAt != null ? docInfo.approvedAt : null,
    };
  }
  for (const key of Object.keys(DOC_KEY_TO_FILENAME)) {
    if (!(key in newDocs)) newDocs[key] = { status: 'pending', approvedAt: null };
  }

  // Map currentPhase intelligently
  let v1CurrentPhase = state.project?.currentPhase || 1;
  const v1PhaseName = V1_PHASE_ORDER[v1CurrentPhase - 1];
  let newCurrentPhase = 1;
  if (v1PhaseName && PHASE_MAP[v1PhaseName]) {
    const v2Name = PHASE_MAP[v1PhaseName];
    newCurrentPhase = ALL_V2_PHASE_KEYS.indexOf(v2Name) + 1;
  }
  if (newCurrentPhase < 1) newCurrentPhase = 1;
  if (newCurrentPhase > 14) newCurrentPhase = 14;

  const now = getNow();

  // Build new state
  const newState = {
    schemaVersion: 2,
    project: {
      ...state.project,
      currentPhase: newCurrentPhase,
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
        date: now,
        action: 'Migración v1 → v2 completada',
        details: 'schemaVersion actualizado a 2, fases re-mapeadas a 14, nuevas secciones agregadas.',
      },
    ],
  };

  await writeFile(stateFile, JSON.stringify(newState, null, 2) + '\n', 'utf8');
  console.log('project-state.json actualizado a schemaVersion 2');

  // Backup and rename docs using explicit filename mapping
  if (await fileExists(docsDir)) {
    const files = await readdir(docsDir);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const newFilename = V1_TO_V2_FILENAME[file];
      if (!newFilename || newFilename === file) continue;

      const oldPath = path.join(docsDir, file);
      const backupPath = path.join(docsDir, file + '.v1');
      const newPath = path.join(docsDir, newFilename);
      if (await fileExists(backupPath)) {
        console.log(`  ${file} → ${newFilename} (backup ya existe, saltando)`);
      } else {
        await copyFile(oldPath, backupPath);
        console.log(`  Backup creado: ${file}.v1`);
      }
      if (await fileExists(newPath)) {
        console.log(`  ${file} → ${newFilename} (destino ya existe, saltando rename)`);
      } else {
        await rename(oldPath, newPath);
        console.log(`  ${file} → ${newFilename}`);
      }
    }
  }

  console.log('\nMigración completada.\nRespaldo creado: project-state.json.v1\nBackups de documentos: <archivo>.md.v1\nLos documentos han sido renombrados a sus nombres v2.');
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
