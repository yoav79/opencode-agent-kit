# OpenCode Agent Kit

Repositorio base para versionar, instalar y mantener agentes reutilizables de OpenCode.

## Objetivo

Separar claramente:

- la configuracion reusable de agentes, skills y comandos;
- las reglas compartidas;
- los artefactos generados dentro de cada proyecto.

## Estructura

```text
opencode-agent-kit/
├── opencode/
│   ├── agents/
│   ├── skills/
│   ├── commands/
│   ├── rules/
│   ├── AGENTS.md
│   └── opencode.example.json
├── templates/
│   └── software-design-project/
├── scripts/
├── tests/
└── .github/workflows/
```

## Instalacion global

El instalador crea enlaces simbolicos individuales en `~/.config/opencode`.
No modifica credenciales, proveedores, modelos ni tu `opencode.json`.

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

El instalador se detiene si encuentra un archivo con el mismo nombre. Usa
`--force` solamente cuando hayas revisado el conflicto.

## Crear el scaffold de un proyecto

Desde este repositorio:

```bash
./scripts/create-project.sh /ruta/al/proyecto
```

Esto crea:

```text
proyecto/
├── AGENTS.md                 # solo si no existe
└── software-design/
    ├── project-state.json
    ├── workflow.md
    ├── decisions/
    ├── drafts/
    ├── docs/
    └── archive/
```

## Validacion

```bash
./scripts/validate.sh
```

Valida JSON, nombres de skills, frontmatter obligatorio, permisos basicos y
referencias internas del scaffold.

## Uso en OpenCode

Lista los agentes disponibles:

```bash
opencode agent list
```

Comandos incluidos:

```text
/new-blueprint
/continue-blueprint
/validate-blueprint
```

## Principios del repositorio

1. Los agentes definen roles y autoridad.
2. Las skills definen capacidades reutilizables.
3. Los comandos inician flujos repetibles.
4. Los resultados de cada proyecto no se guardan en este repositorio.
5. Ningun agente puede hacer `git commit` o `git push` sin cambiar
   explicitamente su politica.
