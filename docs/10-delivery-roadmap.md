# Fase 10: Plan de Construcción

## 1. Estrategia de Construcción

### Principios
- **Frontend**: React + Next.js (framework rápido en Node.js)
- **mailctl como backend**: Todas las operaciones pasan por mailctl
- **NO acceso directo a DB**: La WebUI nunca accede directamente a PostgreSQL
- **NO modificación de config**: La WebUI nunca modifica archivos de configuración
- **Módulo completo**: Cada módulo se entrega funcional al 100%
- **Orden lógico**: Respetar dependencias entre módulos

## 2. Orden de Construcción

| Fase | Módulo | Dependencias | Duración estimada | Estado |
|------|--------|--------------|-------------------|--------|
| **F1** | Panel Principal | Ninguna | 1 día | Pendiente |
| **F2** | Autenticación | Ninguna | 1 día | Pendiente |
| **F3** | Dominios | Ninguna | 1 día | Pendiente |
| **F4** | Buzones | Dominios | 2 días | Pendiente |
| **F5** | Aliases | Buzones | 1 día | Pendiente |
| **F6** | Identidades | Buzones | 1 día | Pendiente |
| **F7** | Listas Distribución | Dominios | 1 día | Pendiente |
| **F8** | Migración IMAP | Ninguna | 1 día | Pendiente |
| **F9** | Validación | Ninguna | 1 día | Pendiente |
| **F10** | Bitácoras | Ninguna | 1 día | Pendiente |
| **F11** | Servicios | Ninguna | 1 día | Pendiente |

**Total estimado: 12 días**

## 3. Detalle por Fase

### F1: Panel Principal (1 día)
- [ ] Dashboard con estado general
- [ ] Estado de servicios
- [ ] Estadísticas de correo
- [ ] Operaciones recientes
- [ ] Alertas

### F2: Autenticación (1 día)
- [ ] Login de administradores
- [ ] Gestión de sesiones
- [ ] Autorización por roles (RBAC)
- [ ] Gestión de usuarios

### F3: Dominios (1 día)
- [ ] Crear dominio (mailctl domain create)
- [ ] Habilitar dominio (mailctl domain enable)
- [ ] Deshabilitar dominio (mailctl domain disable)
- [ ] Eliminar dominio (mailctl domain delete)
- [ ] Validar configuración (mailctl validate)

### F4: Buzones (2 días)
- [ ] Crear buzón (mailctl mailbox create)
- [ ] Eliminar buzón (mailctl mailbox delete)
- [ ] Habilitar buzón (mailctl mailbox enable)
- [ ] Deshabilitar buzón (mailctl mailbox disable)
- [ ] Restablecer contraseña (mailctl passwd)
- [ ] Administrar cuotas
- [ ] Operaciones por lotes (mailctl passwd --batch)

### F5: Aliases (1 día)
- [ ] Crear alias (mailctl alias create)
- [ ] Eliminar alias (mailctl alias delete)
- [ ] Habilitar alias (mailctl alias enable)
- [ ] Deshabilitar alias (mailctl alias disable)

### F6: Identidades (1 día)
- [ ] Crear identidad (mailctl identity create)
- [ ] Actualizar identidad (mailctl identity update)
- [ ] Eliminar identidad (mailctl identity delete)
- [ ] Establecer identidad predeterminada (mailctl identity default)

### F7: Listas de Distribución (1 día)
- [ ] Crear lista (mailctl distribution create)
- [ ] Eliminar lista (mailctl distribution delete)
- [ ] Administrar miembros (mailctl distribution members)
- [ ] Actualizaciones por lotes (mailctl distribution batch)

### F8: Migración IMAP (1 día)
- [ ] Iniciar migración (mailctl migrate start)
- [ ] Supervisar progreso (mailctl migrate status)
- [ ] Reintentar fallidos (mailctl migrate retry)
- [ ] Consultar resultados (mailctl migrate results)

### F9: Validación (1 día)
- [ ] Validación de plataforma (mailctl validate platform)
- [ ] Validación de flujo de correo (mailctl validate flow)
- [ ] Validación de configuración (mailctl validate config)
- [ ] Validación en tiempo de ejecución (mailctl validate runtime)

### F10: Bitácoras (1 día)
- [ ] Bitácoras operativas
- [ ] Bitácoras de validación
- [ ] Historial de auditoría
- [ ] Exportación a CSV

### F11: Servicios (1 día)
- [ ] Estado de servicios
- [ ] Reiniciar servicio
- [ ] Recargar configuración
- [ ] Información de salud

## 4. Dependencias

```
Panel Principal (F1)
Autenticación (F2)
Dominios (F3)
  ↓
Buzones (F4) ←─────────────────┐
  ↓                               │
Aliases (F5)                      │
Identidades (F6)                  │
                                  │
Listas Distribución (F7) ←───────┤
Migración IMAP (F8) ────────────┐ │
Validación (F9) ────────────────┤ │
Bitácoras (F10) ────────────────┤ │
Servicios (F11) ────────────────┘ │
                                  │
                                  └──→ Dependencias de Buzones
```

## 5. Criterios de Entrega por Módulo

Cada módulo se considera completo cuando:
1. ✅ CRUD funcional (Create, Read, Update, Delete)
2. ✅ Invocación correcta de mailctl
3. ✅ Validaciones de entrada implementadas
4. ✅ Estados manejados correctamente
5. ✅ UI responsive con Tailwind
6. ✅ Auditoría de acciones registrada
7. ✅ Pruebas manuales exitosas

## 6. Estructura de Proyecto

```
yoab-webui/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (login)
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── domains/
│   │   ├── mailboxes/
│   │   ├── aliases/
│   │   ├── identities/
│   │   ├── distribution/
│   │   ├── migration/
│   │   ├── validation/
│   │   ├── logs/
│   │   └── services/
│   └── api/
│       ├── auth/
│       ├── domains/
│       ├── mailboxes/
│       ├── aliases/
│       ├── identities/
│       ├── distribution/
│       ├── migration/
│       ├── validation/
│       ├── logs/
│       └── services/
├── components/
│   ├── ui/
│   ├── layout/
│   └── forms/
├── lib/
│   ├── mailctl.ts
│   ├── auth.ts
│   └── utils.ts
└── prisma/
    └── schema.prisma
```

## 7. Prompts para IA

### Prompt Genérico por Módulo
```
Crear el módulo [NOMBRE] para la WebUI de MailAdmin.

Contexto:
- React + Next.js con App Router
- Tailwind CSS para estilos
- El backend es mailctl (NO acceder directamente a PostgreSQL)
- Todas las operaciones invocan mailctl

Requisitos:
1. CRUD completo en /api/[modulo]
2. UI en /dashboard/[modulo]
3. Invocación de mailctl para cada operación
4. Validaciones de entrada
5. Auditoría de acciones

Entregar:
- Archivos API routes
- Componentes UI
- Invocaciones a mailctl
- Validaciones
```

### Prompt Específico por Módulo
```
Crear [NOMBRE] específico:

Operaciones: [LISTA]
Comandos mailctl: [LISTA]
UI: [DESCRIPCIÓN]
Validaciones: [LISTA]
```

## 8. Tiempo Total

| Concepto | Días |
|----------|------|
| Desarrollo por módulo | 12 días |
| Integración y pruebas | 2 días |
| Ajustes finales | 1 día |
| **Total** | **15 días** |

## 9. Próximos pasos

1. ~~Aprobar plan de construcción~~ ✓ COMPLETADO
2. Iniciar F1: Panel Principal
3. Continuar con cada módulo según el orden definido
4. Entregar módulo completo por fase
