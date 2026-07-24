# Construction Strategy — MailAdmin Piloto Semántico

## 1. Punto de partida conocido

Este es un proyecto nuevo (piloto de prueba). No existe código previo.

| Aspecto | Estado conocido |
|---|---|
| Frontend | React + Next.js (por construir) |
| Backend API | Capa intermedia (por construir) |
| Backend existente | `mailctl` (disponible, no se modifica) |
| Infraestructura | Ansible (disponible, no se modifica) |
| Base de datos | Operada por `mailctl`; la WebUI no accede directamente |
| Build, test, lint | No existen; se establecen como parte del primer incremento |

## 2. Datos del repositorio desconocidos

Ninguno relevante para la planificación. El Supervisor de DevFlow determinará la estructura exacta de archivos al inspectar el repositorio durante la ejecución.

## 3. Inicialización y consumo del producto

MailAdmin es una aplicación web que se ejecuta como servidor Next.js. Se inicializa con:

```text
npm install
npm run dev  (desarrollo)
npm run build && npm start (producción)
```

La aplicación consume la API de `mailctl` mediante llamadas HTTP desde las API routes de Next.js.

## 4. Contrato público de configuración

La aplicación necesita acceso a:

- Endpoint de `mailctl` (API existente)
- Credenciales de administrador (gestionadas por la plataforma)

Estos valores se proporcionan mediante variables de entorno. El Supervisor de DevFlow definirá los nombres exactos.

## 5. Integración con la aplicación host

La WebUI se integra con el backend existente mediante:

- API routes de Next.js como capa de orquestación
- Llamadas HTTP a `mailctl` desde el servidor (no desde el cliente)
- Respuestas JSON que la WebUI renderiza sin reinterpretación

## 6. Persistencia y migraciones

No aplica. La WebUI no gestiona datos persistentes. Toda la persistencia es operada por `mailctl` y sus servicios subyacentes.

## 7. Publicación de contratos públicos

No aplica para el piloto. La aplicación se despliega como servidor Next.js independiente.

## 8. Incrementos verticales de construcción

### Incremento 1: Scaffolding y creación de dominio

**Resultado verificable:** La WebUI muestra un formulario de creación de dominio, envía la solicitud a `mailctl domain create` y muestra el resultado.

**Capacidades cubiertas:** CAP-DOM-CREATE

**Prueba o evidencia:**
- La WebUI renderiza un formulario con campo de nombre de dominio
- Al enviar, se invoca `mailctl domain create`
- El resultado se muestra sin modificación
- Un error de `mailctl` se muestra sin convertirse en éxito

**Prerrequisitos:** Ninguno (es el primer incremento).

---

### Incremento 2: Habilitación de dominio

**Resultado verificable:** La WebUI permite habilitar un dominio existente mediante `mailctl domain enable`.

**Capacidades cubiertas:** CAP-DOM-ENABLE

**Prueba o evidencia:**
- La WebUI muestra dominios disponibles para habilitar
- Al seleccionar uno y confirmar, se invoca `mailctl domain enable`
- El resultado se muestra sin modificación

**Prerrequisitos:** Incremento 1 (scaffolding base compartido).

---

### Incremento 3: Deshabilitación de dominio

**Resultado verificable:** La WebUI permite deshabilitar un dominio existente mediante `mailctl domain disable`.

**Capacidades cubiertas:** CAP-DOM-DISABLE

**Prueba o evidencia:**
- La WebUI muestra dominios habilitados disponibles para deshabilitar
- Al seleccionar uno y confirmar, se invoca `mailctl domain disable`
- El resultado se muestra sin modificación

**Prerrequisitos:** Incremento 1 (scaffolding base compartido).

---

### Incremento 4: Eliminación de dominio

**Resultado verificable:** La WebUI permite eliminar un dominio existente mediante `mailctl domain delete`.

**Capacidades cubiertas:** CAP-DOM-DELETE

**Prueba o evidencia:**
- La WebUI muestra dominios disponibles para eliminar
- Al seleccionar uno y confirmar, se invoca `mailctl domain delete`
- El resultado se muestra sin modificación

**Prerrequisitos:** Incremento 1 (scaffolding base compartido).

---

### Incremento 5: Validación de configuración

**Resultado verificable:** La WebUI ejecuta `mailctl validate` y muestra el resultado.

**Capacidades cubiertas:** CAP-DOM-VALIDATE

**Prueba o evidencia:**
- La WebUI tiene un botón o sección de validación
- Al activar, se invoca `mailctl validate`
- El resultado se muestra sin modificación

**Prerrequisitos:** Incremento 1 (scaffolding base compartido).

---

## 9. Habilitadores técnicos

| Habilitador | Justificación | Corresponde a requisito |
|---|---|---|
| Scaffolding Next.js | Establece build, dev server y estructura base | No (habilitador transversal) |
| Capa de API routes | Permite invocar mailctl desde servidor | No (habilitador arquitectónico) |
| Componente de formulario base | Reutilizado por las 5 operaciones | No (habilitador de UI) |

## 10. Disposición de requisitos no funcionales

| NFR | Disposición | Responsable |
|---|---|---|
| Administradores autorizados | Satisfecho por infraestructura existente | Plataforma |
| Autorización definida por plataforma | Satisfecho por infraestructura existente | Plataforma |
| No exponer secretos | Satisfecho por arquitectura (mailctl gestiona secretos) | Arquitectura |
| TLS para comunicaciones | Satisfecho por infraestructura existente | Plataforma |
| Evidencia auditable | Satisfecho por logs de mailctl | Plataforma |

Ningún NFR requiere decisión adicional o implementación en el MVP del piloto.

## 11. Observaciones

- Los incrementos 2-5 son independientes entre sí y pueden ejecutarse en cualquier orden después del incremento 1.
- Cada incremento es vertical: incluye UI, API route y prueba.
- No se requieren migraciones de base de datos.
- No se requieren modelados de datos nuevos.
