# SOFTWARE-BLUEPRINT-RESOLVED.md — MailAdmin Piloto Semántico

## 0. Propósito del piloto

Este documento es un fixture controlado para probar el generador global del Task Planner y el validador semántico determinista.

No representa el alcance completo de MailAdmin.

### Reglas del piloto

- La única fuente funcional permitida es este archivo.
- El único módulo funcional incluido es **Gestión de Dominios**.
- Las únicas funciones del producto que pueden extraerse son las cinco declaradas en la sección `4.1 Gestión de Dominios`.
- Las restricciones arquitectónicas y de seguridad son condiciones transversales; no deben convertirse en funciones adicionales del producto.
- Está prohibido completar módulos ausentes, inferir funciones no escritas o reutilizar información de otros blueprints.
- Cuando falte información necesaria, debe registrarse como pendiente o solicitarse una decisión; no debe inventarse.

---

## 1. Resumen Ejecutivo

**MailAdmin** es una interfaz web administrativa para una plataforma de correo existente.

En este piloto, la WebUI permite administrar dominios de correo invocando la capa de orquestación existente, `mailctl`, para todas las operaciones administrativas incluidas.

### Datos clave

| Aspecto | Valor |
|---|---|
| Nombre | MailAdmin - Piloto Semántico |
| Tipo | Interfaz web administrativa |
| Alcance funcional | Gestión de Dominios |
| Frontend | React + Next.js |
| Backend autorizado | `mailctl` |
| Automatización de infraestructura | Ansible |
| Requisito funcional incluido | `REQ-DOM-001` |

---

## 2. Actor y objetivo

### Actor principal

Administrador de la plataforma de correo.

### Objetivo

Administrar dominios de correo desde una WebUI sin acceder directamente a PostgreSQL, Dovecot, Postfix, archivos de configuración o infraestructura.

---

## 3. Arquitectura y restricciones críticas

### 3.1 Flujo autorizado

```text
Navegador
   │
   ▼
WebUI (React + Next.js)
   │
   ▼
API del Backend
   │
   ▼
mailctl
   │
   ▼
Ansible y servicios existentes
```

### 3.2 Principios obligatorios

La WebUI **DEBERÁ**:

1. Invocar `mailctl` para todas las operaciones administrativas.
2. Utilizar únicamente las interfaces autorizadas del backend.
3. Preservar el comportamiento operativo existente.
4. Mantener la lógica de negocio dentro de `mailctl`.
5. Mostrar los resultados del backend sin reinterpretarlos.
6. Mantener las operaciones administrativas auditables.

La WebUI **NO DEBERÁ**:

1. Modificar PostgreSQL de forma directa.
2. Modificar directamente archivos de configuración de Dovecot, Postfix o del sistema operativo.
3. Ejecutar cambios directos sobre la infraestructura.
4. Reemplazar `mailctl`, Ansible, PostgreSQL, Dovecot o Postfix.

Estas reglas son restricciones arquitectónicas y no agregan funciones al alcance del piloto.

---

## 4. Módulo funcional incluido

### REQ-DOM-001: Gestión de Dominios

**Prioridad:** Crítica

| Function ID | Operación | Operation Key | Resultado observable | Comando backend |
|---|---|---|---|---|
| FUN-DOM-CREATE | Crear dominio | create_domain | El backend confirma la creación del dominio solicitado y la WebUI muestra el resultado sin modificarlo. | `mailctl domain create` |
| FUN-DOM-ENABLE | Habilitar dominio | enable_domain | El backend confirma que el dominio seleccionado quedó habilitado y la WebUI muestra el resultado sin modificarlo. | `mailctl domain enable` |
| FUN-DOM-DISABLE | Deshabilitar dominio | disable_domain | El backend confirma que el dominio seleccionado quedó deshabilitado y la WebUI muestra el resultado sin modificarlo. | `mailctl domain disable` |
| FUN-DOM-DELETE | Eliminar dominio | delete_domain | El backend confirma la eliminación del dominio seleccionado y la WebUI muestra el resultado sin modificarlo. | `mailctl domain delete` |
| FUN-DOM-VALIDATE | Validar configuración | validate_config | La WebUI muestra el resultado de validación producido por el backend sin modificarlo. | `mailctl validate` |

### 4.2 Reglas funcionales del módulo

1. Cada acción de la tabla anterior es una función fuente independiente.
2. Crear, habilitar, deshabilitar, eliminar y validar son operaciones diferentes y no pueden compartir identidad semántica.
3. Cada operación debe conservar el comando backend indicado.
4. Ninguna operación puede implementarse mediante acceso directo a PostgreSQL o modificación directa de archivos.
5. Los mensajes y resultados funcionales mostrados por la WebUI deben provenir de `mailctl`.

---

## 5. Contrato del backend

Toda acción funcional incluida en el piloto **DEBERÁ** corresponder a la operación de `mailctl` declarada en la tabla de la sección `4.1 Gestión de Dominios`.

| Acción de la WebUI | Backend |
|---|---|
| Crear dominio | `mailctl domain create` |
| Habilitar dominio | `mailctl domain enable` |
| Deshabilitar dominio | `mailctl domain disable` |
| Eliminar dominio | `mailctl domain delete` |
| Validar configuración | `mailctl validate` |

El Task Planner no debe sustituir estos comandos por operaciones aproximadas o equivalentes inferidas.

---

## 6. Seguridad y auditoría

La WebUI deberá:

- operar únicamente para administradores autorizados;
- aplicar la autorización definida por la plataforma;
- no exponer secretos;
- utilizar TLS para las comunicaciones;
- conservar evidencia auditable de las operaciones administrativas.

Estas condiciones son transversales. Para este piloto no deben generar módulos funcionales adicionales de autenticación, usuarios, sesiones, roles o bitácoras.

---

## 7. Alcance del piloto

### 7.1 Incluido

Exclusivamente:

- `REQ-DOM-001` Gestión de Dominios;
- Crear dominio;
- Habilitar dominio;
- Deshabilitar dominio;
- Eliminar dominio;
- Validar configuración.

### 7.2 Excluido

- Panel principal o dashboard;
- autenticación, usuarios, roles y sesiones como módulos funcionales;
- gestión de buzones;
- gestión de aliases;
- identidades del remitente;
- listas de distribución;
- migración IMAP;
- bitácoras como módulo funcional;
- administración de servicios;
- edición de dominios;
- listado o búsqueda de dominios;
- operaciones por lotes;
- reemplazo de `mailctl` o Ansible;
- modificación directa de bases de datos o archivos de configuración;
- publicación o ejecución del proyecto completo de MailAdmin.

---

## 8. Condiciones deterministas para evaluar el generador

Esta sección contiene reglas de prueba del Task Planner; no representa funciones adicionales del producto.

El generador deberá producir exactamente:

1. Un requisito funcional: `REQ-DOM-001`.
2. Cinco funciones fuente distintas.
3. Cinco `sourceFunctionId` distintos.
4. Cinco `semanticKey` distintos.
5. Cinco `behaviorId` distintos.
6. Una relación uno a uno entre función fuente, identidad semántica y behavior.
7. Una capacidad funcional propietaria por cada behavior.
8. Cobertura de tarea para cada behavior.
9. Ninguna función, behavior, capacidad funcional o tarea de producto fuera del alcance de la sección 7.1.

La cadena semántica deberá conservarse sin cambios:

```text
Funcionalidad fuente
→ sourceFunctionId
→ semanticKey
→ behaviorId
→ requirementId
→ capacidad funcional
→ tarea
→ requirementCoverage
→ bloque Contrato semántico de la tarea
```

Las siguientes operaciones deben permanecer diferenciadas:

```text
crear ≠ habilitar ≠ deshabilitar ≠ eliminar ≠ validar
```

---

## 9. Criterio de terminación del piloto

El piloto termina cuando:

- todos los artefactos del alcance reducido fueron generados;
- el validador determinista termina con código de salida `0`;
- `readiness.json.blockingIssues` está vacío;
- el workflow queda en `plan_approval` con estado `awaiting_user`;
- `finalPlanApproved` permanece en `false`;
- `planPublished` permanece en `false`;
- no se procesó contenido fuera de este blueprint piloto.

El piloto no debe publicarse ni marcarse como `completed`.
