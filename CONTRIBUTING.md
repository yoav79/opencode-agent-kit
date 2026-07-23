# Contribuir a OpenCode Agent Kit

Gracias por tu interes en contribuir. Este documento explica como participar de forma efectiva y segura.

## Principios Fundamentales

1. **Separar configuracion de artefactos.** Los agentes, comandos y plantillas van en `opencode/` y `templates/`. Los resultados de cada proyecto van en su propio `software-design/` o `task-planning/`.
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
- `feat`: nueva funcionalidad (agente, comando, plantilla)
- `fix`: correccion de un bug o problema de integracion
- `docs`: cambios solo de documentacion
- `refactor`: reestructuracion sin cambio de comportamiento
- `test`: agregar o corregir tests
- `chore`: tareas de mantenimiento (scripts, dependencias)

Ejemplos:
```
feat(agents): add task-planner agent with 10-phase workflow
fix(commands): correct template path in init-task-planner
docs: update README with new architecture diagram
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
- **Define permisos por minimo privilegio.** Un agente de solo lectura no necesita permiso de edicion.
- **No dupliques instrucciones** que pertenecen a una regla compartida.
- **Incluye restricciones explicitas.** Por ejemplo, si el agente no debe hacer commits, declaralo en el frontmatter Y en el cuerpo.
- **Documenta el workflow completo** con fases, precondiciones y salidas.

### Verificacion

```bash
./scripts/validate.sh
```

## Cambios a Comandos

### Estructura de un Comando

Cada comando es un archivo `.md` en `opencode/commands/`:

```yaml
---
description: Que hace el comando y cuando usarlo
agent: nombre-del-agente
subtask: false
---
```

### Reglas para Comandos

- **Un comando = un flujo repetible.** No combines multiples flujos en un solo comando.
- **Especifica el agente** que maneja el comando.
- **Documenta el flujo completo** en el cuerpo del markdown.
- **Incluye validaciones** al inicio (verificar scaffold, estado, versiones, etc.).
- **Define contrato de version** si el comando depende de versiones especificas de archivos.

## Cambios a Plantillas

### Estructura

Las plantillas viven en `templates/nombre-agente/` y se copian al proyecto destino durante la inicializacion.

### Reglas para Plantillas

- **Cada plantilla debe ser autocontenido.** No dependa de archivos externos al directorio.
- **Incluye `project-state.json`** con la estructura de estado correcta.
- **Incluye `workflow.md`** que documente las fases y criterios de salida.
- **Valida las versiones** en `project-state.json` contra las esperadas por el agente.
- **No incluyas archivos de test** o fixtures en las plantillas.

## Cambios a Reglas

### Reglas Compartidas

Las reglas en `opencode/rules/` aplican a todos los agentes. Solo modificalas si:

- Existe un problema de comportamiento documentado.
- La regla afecta a multiples agentes, no solo a uno.
- No puede resolverse cambiando el agente especifico.

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
- **Criterio de verificacion** (como se puede probar, que comando ejecutar)
- **Screenshots o output** si aplica

## Reglas de Seguridad

- **Nunca commitees credenciales, tokens o claves API.**
- **No expongas informacion sensible** en logs o mensajes de error.
- **Los agentes no deben tener permisos de deploy** sin autorizacion explicita.
- **Verifica que los scripts** no contengan comandos destructivos sin proteccion.
- **No hardcodees paths de usuarios.** Usa `$HOME` o variables de entorno.

## Preguntas Frecuentes

### Como agrego un nuevo agente?

1. Crea `opencode/agents/nombre-agente.md` con frontmatter YAML
2. Define permisos por minimo privilegio
3. Crea sus plantillas en `templates/nombre-agente/`
4. Crea un comando en `opencode/commands/init-nombre-agente.md`
5. Actualiza `scripts/validate.sh` con las rutas requeridas
6. Actualiza `scripts/install.sh` si es necesario
7. Ejecuta `./scripts/validate.sh`

### Como agrego un nuevo comando?

1. Crea `opencode/commands/nombre-comando.md`
2. Especifica el agente que lo maneja en el frontmatter
3. Documenta el flujo completo con validaciones
4. Define contrato de version si aplica
5. Ejecuta `./scripts/validate.sh`

### Como agrego una nueva plantilla?

1. Crea el directorio `templates/nombre-agente/`
2. Agrega `project-state.json` con el schema correcto
3. Agrega `workflow.md` con las fases y criterios de salida
4. Agrega archivos adicionales que el agente necesite
5. Actualiza `scripts/validate.sh` con las rutas requeridas
6. Ejecuta `./scripts/validate.sh`

### Que hago si no estoy seguro?

Abre un issue discutiendo tu propuesta antes de implementar. Es mejor discutir el diseno antes que recibir un PR que no se alinea con la vision del proyecto.
