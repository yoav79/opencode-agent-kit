# Fase 10: Plan de Construcción

## 1. Estrategia de construcción

### Principios
- **Velocidad máxima**: Construir por módulo completo
- **IA eficiente**: Prompts bien definidos = desarrollo rápido
- **Módulo completo**: Cada módulo se entrega funcional al 100%
- **Orden lógico**: Respetar dependencias entre módulos

## 2. Orden de construcción

| Fase | Módulo | Dependencias | Duración estimada | Estado |
|------|--------|--------------|-------------------|--------|
| **F1** | Auth | Ninguna | 1 día | Pendiente |
| **F2** | Domains | Ninguna | 1 día | Pendiente |
| **F3** | Mailboxes | Domains | 2 días | Pendiente |
| **F4** | Aliases | Mailboxes | 1 día | Pendiente |
| **F5** | Block/Unblock | Mailboxes | 1 día | Pendiente |
| **F6** | Logs | Ninguna | 1 día | Pendiente |
| **F7** | SSL Certs | Domains | 2 días | Pendiente |
| **F8** | Audit | Ninguna | 1 día | Pendiente |
| **F9** | Config | Ninguna | 1 día | Pendiente |

**Total estimado: 11 días**

## 3. Detalle por fase

### F1: Autenticación (1 día)
- [ ] Login con email + contraseña
- [ ] JWT con expiración
- [ ] 2FA con speakeasy
- [ ] Bloqueo por intentos fallidos
- [ ] Headers de seguridad (helmet)
- [ ] Rate limiting

### F2: Dominios (1 día)
- [ ] CRUD completo de dominios
- [ ] Validación de nombre de dominio
- [ ] Estados (activo/inactivo)
- [ ] Búsqueda y paginación

### F3: Buzones (2 días)
- [ ] CRUD completo de buzones
- [ ] Asignación a dominios
- [ ] Gestión de quotas
- [ ] Estados (activo/inactivo/bloqueado)
- [ ] Cambio de contraseña
- [ ] Búsqueda y paginación

### F4: Aliases (1 día)
- [ ] CRUD completo de aliases
- [ ] Validación de destino
- [ ] Estados (activo/inactivo)
- [ ] Búsqueda y paginación

### F5: Bloqueo/Desbloqueo (1 día)
- [ ] Bloquear buzón
- [ ] Desbloquear buzón
- [ ] Cambio de estado rápido
- [ ] Confirmación de acción

### F6: Logs (1 día)
- [ ] Visualización de logs de entrega
- [ ] Filtros por fecha, remitente, destinatario
- [ ] Exportación CSV
- [ ] Paginación

### F7: Certificados SSL (2 días)
- [ ] Visualización de certificados
- [ ] Renovación automática (Let's Encrypt)
- [ ] Instalación en cluster vía SSH
- [ ] Alertas de expiración
- [ ] Estados del certificado

### F8: Auditoría (1 día)
- [ ] Registro de acciones
- [ ] Filtros por fecha, acción, módulo
- [ ] Exportación CSV
- [ ] Detalle de cada acción

### F9: Configuración (1 día)
- [ ] Parámetros del sistema
- [ ] Configuración de seguridad
- [ ] Configuración de correo
- [ ] Guardar cambios

## 4. Dependencias

```
Auth (F1)
  ↓
Domains (F2)
  ↓
Mailboxes (F3) ←─────────────────┐
  ↓                               │
Aliases (F4)                      │
Block/Unblock (F5)                │
                                  │
Logs (F6) ──────────────────────┐ │
SSL Certs (F7) ←────────────────┤ │
Audit (F8) ─────────────────────┤ │
Config (F9) ────────────────────┘ │
                                  │
                                  └──→ Dependencias de Mailboxes
```

## 5. Criterios de entrega por módulo

Cada módulo se considera completo cuando:
1. ✅ CRUD funcional (Create, Read, Update, Delete)
2. ✅ Validaciones de entrada implementadas
3. ✅ Estados manejados correctamente
4. ✅ Búsqueda y paginación funcionales
5. ✅ UI responsive con Tailwind
6. ✅ Integración con PostgreSQL
7. ✅ Auditoría de acciones registrada
8. ✅ Pruebas manuales exitosas

## 6. Estructura de proyecto

```
sysadmin-mail/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (login)
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── mailboxes/
│   │   ├── domains/
│   │   ├── aliases/
│   │   ├── logs/
│   │   ├── ssl/
│   │   ├── audit/
│   │   └── config/
│   └── api/
│       ├── auth/
│       ├── mailboxes/
│       ├── domains/
│       ├── aliases/
│       ├── logs/
│       ├── ssl/
│       ├── audit/
│       └── config/
├── components/
│   ├── ui/
│   ├── layout/
│   └── forms/
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── ssh.ts
│   └── utils.ts
└── prisma/
    └── schema.prisma
```

## 7. Prompts para IA

### Prompt genérico por módulo
```
Crear el módulo [NOMBRE] para el sistema SysAdmin Mail.

Contexto:
- Next.js 14 con App Router
- PostgreSQL 16 con node-postgres
- Tailwind CSS para estilos
- JWT para autenticación

Requisitos:
1. CRUD completo en /api/[modulo]
2. UI en /dashboard/[modulo]
3. Validaciones con Zod
4. Paginación y búsqueda
5. Auditoría de acciones

Entregar:
- Archivos API routes
- Componentes UI
- Consultas SQL
- Validaciones
```

### Prompt específico por módulo
```
Crear [NOMBRE] específico:

Entidad: [DESCRIPCIÓN]
Campos: [LISTA]
Estados: [LISTA]
Relaciones: [LISTA]
Operaciones: [LISTA]
UI: [DESCRIPCIÓN]
```

## 8. Tiempo total

| Concepto | Días |
|----------|------|
| Desarrollo por módulo | 11 días |
| Integración y pruebas | 2 días |
| Ajustes finales | 1 día |
| **Total** | **14 días** |

## 9. Próximos pasos

1. ~~Aprobar plan de construcción~~
2. Iniciar F1: Autenticación
3. Continuar con cada módulo según el orden definido
4. Entregar módulo completo por fase
