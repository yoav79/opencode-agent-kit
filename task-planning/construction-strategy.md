# Estrategia de Construcción - MailAdmin

> **Blueprint resuelto**: `task-planning/SOFTWARE-BLUEPRINT-RESOLVED.md`
> **Fecha**: 2026-07-22
> **Decisiones incorporadas**: DEC-001 a DEC-007

---

## 1. Punto de Partida Conocido

### 1.1 Estado del Repositorio

| Aspecto | Estado |
|---------|--------|
| **Frontend** | Sin código inicial (nuevo proyecto) |
| **Backend** | mailctl ya existe y funciona |
| **Infraestructura** | Ansible ya configurado |
| **Base de datos** | PostgreSQL ya configurado |
| **Servicios** | Dovecot, Postfix, NGINX ya configurados |

### 1.2 Datos Desconocidos

- Nombre exacto del binario mailctl en el PATH
- Formato de salida de los comandos mailctl
- Códigos de salida de mailctl (éxito/error)
- Configuración具体 de PM2 en el servidor

---

## 2. Inicialización del Proyecto

### 2.1 Creación del Proyecto Next.js

```bash
npx create-next-app@latest mailadmin --typescript --tailwind --app
```

### 2.2 Configuración de Dependencias

| Dependencia | Propósito |
|-------------|-----------|
| next | Framework React |
| react | UI library |
| tailwindcss | Estilos |
| @types/node | Tipos Node.js |
| @types/react | Tipos React |

### 2.3 Estructura del Proyecto

```text
mailadmin/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── domains/
│   │   └── page.tsx
│   ├── mailboxes/
│   │   └── page.tsx
│   ├── aliases/
│   │   └── page.tsx
│   ├── identities/
│   │   └── page.tsx
│   ├── distribution/
│   │   └── page.tsx
│   ├── migration/
│   │   └── page.tsx
│   ├── validation/
│   │   └── page.tsx
│   ├── logs/
│   │   └── page.tsx
│   ├── services/
│   │   └── page.tsx
│   └── api/
│       ├── auth/
│       │   └── route.ts
│       ├── mailctl/
│       │   └── route.ts
│       └── ...
├── components/
│   ├── ui/
│   ├── layout/
│   └── features/
├── lib/
│   ├── mailctl.ts
│   ├── auth.ts
│   └── session.ts
├── types/
└── ...
```

---

## 3. Contrato Público de Configuración

### 3.1 Variables de Entorno

| Variable | Requerida | Descripción | Ejemplo |
|----------|-----------|-------------|---------|
| `NEXT_PUBLIC_MAILCTL_PATH` | Sí | Ruta al binario mailctl | `/usr/local/bin/mailctl` |
| `SESSION_SECRET` | Sí | Secreto para firmar cookies | `random-secret-string` |
| `SESSION_TIMEOUT_MINUTES` | No | Timeout de sesión (default: 30) | `30` |
| `NODE_ENV` | No | Entorno de ejecución | `production` |
| `PORT` | No | Puerto de la aplicación | `3000` |

### 3.2 Archivo de Configuración

```env
# .env.local
NEXT_PUBLIC_MAILCTL_PATH=/usr/local/bin/mailctl
SESSION_SECRET=tu-secreto-aqui
SESSION_TIMEOUT_MINUTES=30
NODE_ENV=production
PORT=3000
```

---

## 4. Integración con la Aplicación Host

### 4.1 Integración con mailctl

La WebUI se integra con mailctl ejecutándolo como subprocess:

```typescript
// lib/mailctl.ts
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const MAILCTL_PATH = process.env.NEXT_PUBLIC_MAILCTL_PATH || 'mailctl';

export async function executeMailctl(args: string[]): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(MAILCTL_PATH, args);
    return { stdout, stderr };
  } catch (error) {
    throw new Error(`mailctl execution failed: ${error.message}`);
  }
}
```

### 4.2 Autenticación

La autenticación se maneja a nivel de sistema operativo:

```typescript
// lib/auth.ts
import { executeMailctl } from './mailctl';

export async function authenticate(username: string, password: string): Promise<boolean> {
  try {
    // mailctl no tiene comando de autenticación explícito
    // La validación se hace intentando ejecutar un comando
    await executeMailctl(['domain', 'list']);
    return true;
  } catch {
    return false;
  }
}
```

---

## 5. Persistencia y Migraciones

### 5.1 Estado de Persistencia

| Componente | Estado |
|------------|--------|
| **PostgreSQL** | Ya configurado, no requiere cambios |
| **Esquema de datos** | No se modifica (mailctl es System of Record) |
| **Migraciones** | No aplicables (la WebUI no modifica la BD) |

### 5.2 Datos de Sesión

Las sesiones se almacenan en cookies HTTP-only, no en base de datos.

---

## 6. Incrementos Verticales de Construcción

### Incremento 1: Infraestructura Base

**Objetivo**: Proyecto Next.js funcional con autenticación básica.

**Capacidades**:
- Proyecto Next.js creado y configurado
- Estructura de directorios establecida
- Layout base con navegación
- Página de login funcional
- Sistema de sesiones con HTTP-only cookies
- Integración básica con mailctl (subprocess)

**Criterio de verificación**:
- El proyecto compila sin errores
- Se puede ejecutar `npm run dev`
- La página de login se muestra
- Se puede autenticar (si mailctl está disponible)

**Prerrequisitos**:
- Node.js 22.x instalado
- mailctl accesible en el PATH

---

### Incremento 2: Dashboard y Navegación

**Objetivo**: Dashboard funcional con navegación a todos los módulos.

**Capacidades**:
- Dashboard con estado de servicios
- Navegación lateral completa
- Layout responsivo
- Componentes UI reutilizables

**Criterio de verificación**:
- El dashboard muestra el estado de servicios
- La navegación funciona entre todos los módulos
- La UI es responsiva en desktop y mobile

**Prerrequisitos**:
- Incremento 1 completado

---

### Incremento 3: Gestión de Dominios

**Objetivo**: CRUD completo de dominios.

**Capacidades**:
- Lista de dominios
- Crear dominio
- Editar dominio (habilitar/deshabilitar)
- Eliminar dominio
- Validar configuración

**Criterio de verificación**:
- Se pueden listar dominios existentes
- Se puede crear un dominio nuevo
- Se puede habilitar/deshabilitar un dominio
- Se puede eliminar un dominio
- Se puede validar la configuración

**Prerrequisitos**:
- Incremento 2 completado

---

### Incremento 4: Gestión de Buzones

**Objetivo**: CRUD completo de buzones.

**Capacidades**:
- Lista de buzones
- Crear buzón
- Editar buzón (habilitar/deshabilitar)
- Eliminar buzón
- Restablecer contraseña
- Restablecimiento masivo
- Administrar cuotas
- Operaciones por lotes

**Criterio de verificación**:
- Se pueden listar buzones existentes
- Se puede crear un buzón nuevo
- Se puede habilitar/deshabilitar un buzón
- Se puede eliminar un buzón
- Se puede restablecer contraseña
- Se pueden realizar operaciones en lote

**Prerrequisitos**:
- Incremento 3 completado

---

### Incremento 5: Gestión de Aliases e Identidades

**Objetivo**: CRUD completo de aliases e identidades.

**Capacidades**:
- Lista de aliases
- Crear/editar/eliminar alias
- Habilitar/deshabilitar alias
- Lista de identidades
- Crear/editar/eliminar identidad
- Establecer identidad predeterminada

**Criterio de verificación**:
- Se pueden listar aliases existentes
- Se puede crear un alias nuevo
- Se pueden listar identidades existentes
- Se puede crear una identidad nueva
- Se puede establecer identidad predeterminada

**Prerrequisitos**:
- Incremento 4 completado

---

### Incremento 6: Listas de Distribución

**Objetivo**: Gestión completa de listas de distribución.

**Capacidades**:
- Lista de distribución
- Crear/eliminar lista
- Administrar miembros
- Actualizaciones por lotes

**Criterio de verificación**:
- Se pueden listar listas existentes
- Se puede crear una lista nueva
- Se pueden agregar/eliminar miembros
- Se pueden realizar actualizaciones en lote

**Prerrequisitos**:
- Incremento 5 completado

---

### Incremento 7: Migración IMAP

**Objetivo**: Supervisión de migraciones IMAP.

**Capacidades**:
- Iniciar migración
- Supervisar progreso
- Reintentar fallidos
- Consultar resultados

**Criterio de verificación**:
- Se puede iniciar una migración
- Se puede supervisar el progreso
- Se pueden reintentar migraciones fallidas
- Se pueden consultar resultados

**Prerrequisitos**:
- Incremento 6 completado

---

### Incremento 8: Validación y Bitácoras

**Objetivo**: Validación del sistema y visualización de logs.

**Capacidades**:
- Validación de plataforma
- Validación de flujo de correo
- Validación de configuración
- Validación en tiempo de ejecución
- Bitácoras operativas
- Bitácoras de validación
- Historial de auditoría

**Criterio de verificación**:
- Se puede ejecutar cada tipo de validación
- Se muestran resultados de validación
- Se muestran bitácoras operativas
- Se muestra historial de auditoría

**Prerrequisitos**:
- Incremento 7 completado

---

### Incremento 9: Administración de Servicios

**Objetivo**: Control de servicios del sistema.

**Capacidades**:
- Ver estado de servicios
- Reiniciar servicios
- Recargar configuración
- Health check

**Criterio de verificación**:
- Se puede ver el estado de cada servicio
- Se puede reiniciar un servicio
- Se puede recargar configuración
- Se puede ejecutar health check

**Prerrequisitos**:
- Incremento 8 completado

---

### Incremento 10: Pulido y Despliegue

**Objetivo**: Preparación para producción.

**Capacidades**:
- Manejo de errores con toasts
- Loading states
- Optimizaciones de rendimiento
- Configuración de PM2
- Documentación de despliegue

**Criterio de verificación**:
- Los errores se muestran como toast
- Hay loading states en todas las operaciones
- La aplicación responde en < 2 segundos
- PM2 está configurado correctamente
- La documentación de despliegue está completa

**Prerrequisitos**:
- Incremento 9 completado

---

## 7. Habilitadores Técnicos

### 7.1 Componentes UI Reutilizables

| Componente | Propósito |
|------------|-----------|
| `Button` | Botones con variantes |
| `Input` | Campos de formulario |
| `Table` | Tablas de datos |
| `Modal` | Modales de confirmación |
| `Toast` | Notificaciones |
| `Spinner` | Loading states |
| `Card` | Tarjetas de contenido |
| `Sidebar` | Navegación lateral |

### 7.2 Utilidades

| Utilidad | Propósito |
|----------|-----------|
| `mailctl.ts` | Wrapper para ejecutar comandos mailctl |
| `auth.ts` | Funciones de autenticación |
| `session.ts` | Gestión de sesiones |
| `format.ts` | Formateo de fechas, números |
| `validation.ts` | Validación de formularios |

---

## 8. Requisitos No Funcionales

### 8.1 Disposición de NFR

| NFR | Disposición | Responsable | Mecanismo |
|-----|-------------|-------------|-----------|
| **Rendimiento** | Incluido en MVP | WebUI | Next.js optimizado, caching |
| **Seguridad** | Incluido en MVP | WebUI + mailctl | HTTPS, HTTP-only cookies, audit logs |
| **Disponibilidad** | Satisfecho por infraestructura | DevOps | PM2, health checks |
| **Escalabilidad** | Diferido a post-MVP | - | - |
| **Mantenibilidad** | Incluido en MVP | Desarrolladores | TypeScript, clean code |

### 8.2 Seguridad

| Medida | Implementación |
|--------|----------------|
| **HTTPS** | Configurado en NGINX (existente) |
| **Cookies HTTP-only** | Next.js API Routes |
| **Timeout de sesión** | Configurable vía variable de entorno |
| **Audit logs** | Bitácoras operativas |
| **No exposición de secretos** | Variables de entorno |

### 8.3 Rendimiento

| Métrica | Objetivo |
|---------|----------|
| **Tiempo de carga inicial** | < 2 segundos |
| **Tiempo de respuesta API** | < 1 segundo (depende de mailctl) |
| **Tamaño del bundle** | < 500 KB |

---

## 9. Pruebas y Evidencia

### 9.1 Estrategia de Pruebas

| Tipo | Cobertura | Herramienta |
|------|-----------|-------------|
| **Unitarias** | Utilidades y helpers | Jest |
| **Integración** | API Routes | Jest + supertest |
| **E2E** | Flujos principales | Playwright |

### 9.2 Evidencia por Incremento

| Incremento | Evidencia |
|------------|-----------|
| 1 | Proyecto compila, login funciona |
| 2 | Dashboard muestra datos, navegación funciona |
| 3 | CRUD de dominios funciona |
| 4 | CRUD de buzones funciona |
| 5 | CRUD de aliases e identidades funciona |
| 6 | Listas de distribución funcionan |
| 7 | Migración IMAP funciona |
| 8 | Validaciones y logs funcionan |
| 9 | Servicios se pueden administrar |
| 10 | Despliegue en producción funciona |

---

## 10. Resumen

### 10.1 Total de Incrementos

- **Total**: 10 incrementos
- **Enfoque**: Vertical (cada incremento agrega funcionalidad completa)
- **Orden**: Infraestructura → Core → Funcionalidades → Pulido

### 10.2 Dependencias

```text
Incremento 1 (Base)
    └── Incremento 2 (Dashboard)
        └── Incremento 3 (Dominios)
            └── Incremento 4 (Buzones)
                └── Incremento 5 (Aliases/Identidades)
                    └── Incremento 6 (Listas)
                        └── Incremento 7 (Migración)
                            └── Incremento 8 (Validación/Logs)
                                └── Incremento 9 (Servicios)
                                    └── Incremento 10 (Pulido)
```

### 10.3 Riesgos Identificados

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Salida de mailctl no predecible | Alto | Implementar parsing robusto, logging |
| mailctl no disponible en PATH | Alto | Verificar en Incremento 1 |
| Rendimiento de subprocess | Medio | Async, caching de resultados estáticos |
| Seguridad de exec | Medio | Sanitización de inputs, validación |

---

*Documento generado el 2026-07-22*
