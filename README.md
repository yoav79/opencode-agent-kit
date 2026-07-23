# OpenCode Agent Kit

Repositorio base para versionar, instalar y mantener agentes reutilizables de OpenCode.

> **OpenCode Agent Kit** es un framework de proceso-as-código que convierte a un asistente de IA en un arquitecto de software disciplinado, siguiendo una metodología de diseño estructurada, auditable y trazable con barreras de seguridad incorporadas.

## Objetivo

Separar claramente:

- La configuracion reusable de agentes, skills y comandos.
- Las reglas compartidas.
- Los artefactos generados dentro de cada proyecto.

Esto permite instalar el mismo conjunto de agentes y metodologia de diseno en multiples proyectos, manteniendo cada proyecto independiente con sus propios artefactos y decisiones.

## Arquitectura del Sistema

```text
┌─────────────────────────────────────────────────────────────┐
│                    OpenCode Agent Kit                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │   Agents     │   │    Skills    │   │   Commands   │    │
│  │              │   │              │   │              │    │
│  │ architect ───┼──►│ discovery    │   │ /new-blue    │    │
│  │ analyst  ────┤   │ blueprint    │   │ /continue    │    │
│  │ reviewer ────┤   │ review       │   │ /validate    │    │
│  └──────────────┘   └──────────────┘   └──────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Shared Rules                        │   │
│  │  general.md | git-policy.md | documentation-policy.md │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Proyecto Destino                             │
│  software-design/                                            │
│  ├── project-state.json  (maquina de estados)               │
│  ├── workflow.md         (criterios de salida por fase)     │
│  ├── decisions/         (Architecture Decision Records)     │
│  ├── docs/              (documentos aprobados)              │
│  ├── drafts/            (borradores en progreso)            │
│  └── archive/           (documentos reemplazados)           │
└─────────────────────────────────────────────────────────────┘
```

## Agentes

### `software-architect` — Agente Principal

El agente principal que interactua con el usuario. Convierte una idea incompleta en un blueprint coherente, trazable e implementable.

- **Modo:** primary
- **Temperatura:** 0.1 (determinista)
- **Fases del workflow:**
  1. **Discovery** — Problema, usuarios, proceso actual, restricciones, criterios de exito
  2. **Requirements** — Requisitos funcionales y no funcionales, verificables
  3. **Architecture** — Componentes, limites, datos, integraciones, tradeoffs
  4. **Delivery Plan** — Secuencia de implementacion, tests, gates, riesgos
  5. **Validation** — Consistencia, cobertura, contradicciones, preparacion

  Un blueprint se considera completado cuando validation se resuelve sin hallazgos
  `blocker` ni `major` abiertos.

**Permisos:** Puede editar archivos, delegar a subagentes. **No puede** hacer `git commit` ni `git push`.

### `requirements-analyst` — Subagente (Solo Lectura)

Diagnostica que falta antes de que una idea pueda tratarse como una especificacion.

- **Modo:** subagent (solo lectura)
- Produce: hechos confirmados, contradicciones, requisitos no verificables, suposiciones prohibidas, preguntas minimas

### `architecture-reviewer` — Subagente (Solo Lectura)

Revisor independiente de arquitectura. Evalua componentes, dependencias, contratos, seguridad, observabilidad y trazabilidad.

- **Modo:** subagent (solo lectura, bash limitado a `git status`/`git diff`)
- Clasifica hallazgos como: `blocker`, `major`, `minor`, `observation`

## Skills

| Skill | Fase | Descripcion |
|-------|------|-------------|
| `requirements-discovery` | Discovery | 7 pasos para convertir informacion inicial en evidencia suficiente |
| `software-blueprint` | Architecture | Produce 13 entregables: resumen, actores, requisitos, componentes, flujos, datos, integraciones, seguridad, observabilidad, testing, riesgos, plan |
| `architecture-review` | Validation | Auditoria de 8 pasos con matriz requisito-componente-validacion |

## Comandos

| Comando | Agente | Descripcion |
|---------|--------|-------------|
| `/new-blueprint` | software-architect | Inicia o diagnostica un flujo de blueprint en el proyecto actual |
| `/continue-blueprint` | software-architect | Reanuda el blueprint desde la fase registrada en `project-state.json` |
| `/validate-blueprint` | architecture-reviewer | Revisa consistencia, cobertura y preparacion del blueprint |

## Estructura del Repositorio

```text
opencode-agent-kit/
├── opencode/
│   ├── agents/                    # Definiciones de agentes (.md + frontmatter YAML)
│   │   ├── software-architect.md
│   │   ├── requirements-analyst.md
│   │   └── architecture-reviewer.md
│   ├── skills/                    # Skills reutilizables (SKILL.md por skill)
│   │   ├── requirements-discovery/
│   │   ├── software-blueprint/
│   │   └── architecture-review/
│   ├── commands/                  # Comandos slash (.md)
│   │   ├── new-blueprint.md
│   │   ├── continue-blueprint.md
│   │   └── validate-blueprint.md
│   ├── rules/                     # Reglas compartidas (.md)
│   │   ├── general.md
│   │   ├── git-policy.md
│   │   └── documentation-policy.md
│   ├── AGENTS.md                  # Reglas globales para todos los agentes
│   └── opencode.example.json      # Configuracion de ejemplo
├── templates/
│   └── software-design-project/   # Plantilla de scaffold
├── scripts/
│   ├── install.sh                 # Instalacion global via symlinks
│   ├── uninstall.sh               # Desinstalacion segura
│   ├── create-project.sh          # Crea scaffold en un proyecto destino
│   └── validate.sh                # Validacion de integridad del repositorio
├── tests/
│   └── test-scripts.sh            # Tests de integracion
├── examples/                      # Ejemplos sanitizados
└── Makefile                       # Targets: validate, test, install, dry-run
```

## Instalacion

### Requisitos

- [OpenCode](https://opencode.ai) instalado y configurado
- Bash
- Python 3 (para validacion)

### Instalacion Global

El instalador crea enlaces simbolicos individuales en `~/.config/opencode`. No modifica credenciales, proveedores, modelos ni tu `opencode.json`.

```bash
./scripts/install.sh
```

Para instalar tambien las reglas globales de ejemplo:

```bash
./scripts/install.sh --with-global-rules
```

Para revisar sin modificar nada:

```bash
./scripts/install.sh --dry-run
```

Para forzar sobreescritura en caso de conflictos:

```bash
./scripts/install.sh --force
```

### Desinstalacion

```bash
./scripts/uninstall.sh
```

Solo elimina symlinks que apunten a este repositorio. No elimina archivos creados por el usuario.

### Configuracion de OpenCode

Copia `opencode/opencode.example.json` a tu configuracion de OpenCode y ajusta segun necesites:

```bash
cp opencode/opencode.example.json ~/.config/opencode/opencode.json
```

## Uso

### Crear un Proyecto

Desde este repositorio, scaffoldea la estructura de diseno en un proyecto destino:

```bash
./scripts/create-project.sh /ruta/al/proyecto
```

Esto crea:

```text
proyecto/
├── AGENTS.md                 # solo si no existe
└── software-design/
    ├── project-state.json    # maquina de estados del workflow
    ├── workflow.md           # criterios de salida por fase
    ├── decisions/            # Architecture Decision Records
    ├── drafts/               # borradores en progreso
    ├── docs/                 # documentos aprobados
    └── archive/              # documentos reemplazados
```

### Flujo de Trabajo

1. **Iniciar un blueprint:**
   ```
   /new-blueprint
   ```
   El agente carga la skill `requirements-discovery` y comienza la fase de discovery.

2. **Proporcionar contexto:**
   El agente recopila hechos, identifica gaps y registra decisiones. Puede delegar al `requirements-analyst` para diagnostico de requisitos.

3. **Avanzar fases:**
   Cuando discovery esta completo, el agente avanza a requirements, architecture (carga `software-blueprint`), delivery-plan y validation.

4. **Continuar despues de una pausa:**
   ```
   /continue-blueprint
   ```
   Reanuda desde donde quedo la maquina de estados.

5. **Validar el blueprint:**
   ```
   /validate-blueprint
   ```
   Ejecuta el `architecture-reviewer` (solo lectura) que audita el blueprint y produce hallazgos clasificados por severidad.

### Validacion del Repositorio

```bash
./scripts/validate.sh
```

Valida:
- Todos los archivos requeridos existen
- JSON valido en todos los archivos
- Frontmatter obligatorio en agentes y skills
- Nombres de skills en kebab-case
- Permisos basicos y referencias internas

### Tests

```bash
make test
# o directamente:
./tests/test-scripts.sh
```

## Principios del Repositorio

1. **Los agentes definen roles y autoridad.** Cada agente tiene un alcance claro y permisos minimos.
2. **Las skills definen capacidades reutilizables.** Se cargan dinamicamente segun la fase del workflow.
3. **Los comandos inician flujos repetibles.** Cada comando tiene un agente asignado y un proposito definido.
4. **Los resultados de cada proyecto no se guardan en este repositorio.** Cada proyecto mantiene su propio `software-design/`.
5. **Ningun agente puede hacer `git commit` o `git push`** sin cambiar explicitamente su politica.
6. **Los borradores nunca se eliminan.** Se promueven a docs o se mueven a archive.
7. **`project-state.json` es la unica fuente de verdad** para el progreso del workflow.
8. **Las decisiones arquitectonicas se registran como ADRs** en `decisions/`.

## Contribuir

Lee [CONTRIBUTING.md](CONTRIBUTING.md) para instrucciones sobre como contribuir al repositorio.

## Licencia

[MIT](LICENSE) — Copyright (c) 2026
