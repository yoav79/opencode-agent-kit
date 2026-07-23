# Contribuir a OpenCode Agent Kit

Gracias por tu interes en contribuir. Este documento explica como participar de forma efectiva y segura.

## Principios Fundamentales

1. **Separar configuracion de artefactos.** Los agentes, skills y comandos van en `opencode/`. Los resultados de cada proyecto van en su propio `software-design/`.
2. **Minimo privilegio.** Cada agente solo debe tener los permisos estrictamente necesarios para su rol.
3. **No inventar.** Nunca agregar requisitos, features o decisiones que no esten respaldadas por evidencia.
4. **Trazabilidad.** Cada cambio debe poder justificarse con un problema concreto o una mejora verificable.

## Estructura de Commits

Usa mensajes descriptivos en ingles o espanol segun el contexto del cambio:

```
tipo(alcance): descripcion corta

descripcion mas detallada si es necesaria
```

Tipos permitidos:
- `feat`: nueva funcionalidad (agente, skill, comando)
- `fix`: correccion de un bug o problema de integracion
- `docs`: cambios solo de documentacion
- `refactor`: reestructuracion sin cambio de comportamiento
- `test`: agregar o corregir tests
- `chore`: tareas de mantenimiento (scripts, dependencias)

Ejemplos:
```
feat(agents): add security-reviewer subagent
fix(skills): correct exit criteria in requirements-discovery
docs: update README with installation troubleshooting
```

## Cambios a Agentes

### Estructura de un Agente

Cada agente es un archivo `.md` en `opencode/agents/` con frontmatter YAML:

```yaml
---
description: Descripcion corta del agente
mode: primary | subagent | all
temperature: 0.0 - 1.0
permission:
  read: allow | deny
  edit: allow | deny
  glob: allow | deny
  grep: allow | deny
  bash: allow | deny | ask
  task: allow | deny
---
```

### Reglas para Agentes

- **Explica el rol, autoridad y limites** del agente en el cuerpo del markdown.
- **No agregues un modelo obligatorio** salvo que exista una razon comprobada.
- **Define permisos por minimo privilegio.** Un subagente de revision no necesita permiso de edicion.
- **No dupliques instrucciones** que pertenecen a una skill o regla compartida.
- **Incluye restricciones explicitas.** Por ejemplo, si el agente no debe hacer commits, declaralo en el frontmatter Y en el cuerpo.
- **Especifica que skills carga** y en que fase del workflow.

### Verificacion

```bash
./scripts/validate.sh
```

## Cambios a Skills

### Estructura de una Skill

Cada skill vive en un directorio bajo `opencode/skills/` con un archivo `SKILL.md`:

```yaml
---
name: skill-name
description: Descripcion de cuando cargar esta skill
license: MIT
compatibility: opencode >= 1.0
metadata:
  audience: software-architects | architecture-reviewers | all
  workflow: discovery | requirements | architecture | validation
  tags:
    - tag1
    - tag2
---
```

### Reglas para Skills

- **Usa nombres lowercase kebab-case.** El nombre del directorio debe coincidir con el campo `name`.
- **Describe con precision cuando debe cargarse.** Incluye criterios de activacion claros.
- **Conserva archivos de apoyo** dentro del directorio de la skill.
- **Define criterios de salida explicitos.** El agente debe saber cuando la skill esta completa.
- **No asumas contexto externo.** La skill debe ser autocontenido en su procedimiento.
- **Numera los pasos** cuando el procedimiento es secuencial.

## Cambios a Comandos

### Estructura de un Comando

Cada comando es un archivo `.md` en `opencode/commands/`:

```yaml
---
description: Que hace el comando y cuando usarlo
agent: nombre-del-agente
---
```

### Reglas para Comandos

- **Un comando = un flujo repetible.** No combines multiples flujos en un solo comando.
- **Especifica el agente** que maneja el comando.
- **Documenta el flujo completo** en el cuerpo del markdown.
- **Incluye validaciones** al inicio (verificar scaffold, estado, etc.).

## Cambios a Reglas

### Reglas Compartidas

Las reglas en `opencode/rules/` aplican a todos los agentes. Solo modificalas si:

- Existe un problema de comportamiento documentado.
- La regla afecta a multiples agentes, no solo a uno.
- No puede resolverse cambiando la skill o el agente especifico.

### Estructura

```markdown
# Titulo de la Regla

## Contexto
Cuando aplica esta regla.

## Regla
Que debe hacer el agente.

## Ejemplo
Como se aplica en la practica.
```

## Flujo de Contribucion

### 1. Preparacion

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/opencode-agent-kit.git
cd opencode-agent-kit

# Ejecutar tests para verificar estado actual
make test
```

### 2. Desarrollo

- Crea una rama para tu cambio: `git checkout -b feat/nombre-descriptivo`
- Haz cambios incrementales y verificables
- Ejecuta validacion despues de cada cambio significativo:

```bash
./scripts/validate.sh
./scripts/install.sh --dry-run
```

### 3. Antes del Pull Request

```bash
# Validacion completa
./scripts/validate.sh

# Verificar instalacion
./scripts/install.sh --dry-run

# Ejecutar tests de integracion
./tests/test-scripts.sh
```

### 4. Pull Request

Incluye en tu PR:

- **Descripcion** del problema que resuelve
- **Tipo de cambio** (feat/fix/docs/refactor/test/chore)
- **Archivos modificados** y por que
- **Criterio de verificacion** (como se puede probar)
- **Screenshots o output** si aplica

## Reglas de Seguridad

- **Nunca commitees credenciales, tokens o claves API.**
- **No expongas informacion sensible** en logs o mensajes de error.
- **Los agentes no deben tener permisos de deploy** sin autorizacion explicita.
- **Verifica que los scripts** no contengan comandos destructivos sin proteccion.

## Preguntas Frecuentes

### Como agrego un nuevo agente?

1. Crea `opencode/agents/nombre-agente.md` con frontmatter YAML
2. Define permisos por minimo privilegio
3. Especifica que skills carga
4. Actualiza `scripts/validate.sh` si es necesario
5. Ejecuta `./scripts/validate.sh`

### Como agrego una nueva skill?

1. Crea el directorio `opencode/skills/nombre-skill/`
2. Agrega `SKILL.md` con frontmatter y procedimiento
3. Define criterios de salida explicitos
4. Ejecuta `./scripts/validate.sh`

### Como agrego un nuevo comando?

1. Crea `opencode/commands/nombre-comando.md`
2. Especifica el agente que lo maneja
3. Documenta el flujo completo
4. Ejecuta `./scripts/validate.sh`

### Que hago si no estoy seguro?

Abre un issue discutiendo tu propuesta antes de implementar. Es mejor discutir el diseno antes que recibir un PR que no se alinea con la vision del proyecto.
