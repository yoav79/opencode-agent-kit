---
name: software-blueprint
description: Produce un blueprint de software trazable desde requisitos hasta componentes, datos, integraciones, seguridad, operacion y plan de entrega
license: MIT
compatibility: opencode
metadata:
  audience: software-architects
  workflow: architecture
---

# Software blueprint

## Procedimiento

Produce los siguientes entregables en orden. Cada entrega debe ser verificable
antes de avanzar al siguiente.

### 1. Resumen ejecutivo y objetivo

Describe en 3-5 lineas que hace el sistema, para quien y cual es el problema
que resuelve.

### 2. Actores y casos de uso

Identifica los actores principales, sus casos de uso prioritarios y las
interacciones criticas.

### 3. Requisitos funcionales y no funcionales

Lista requisitos identificables (con ID unico) y no funcionales medibles.
Cada requisito critico debe tener un criterio de validacion.

### 4. Contexto, limites y sistemas externos

Define que esta dentro del sistema, que esta fuera, y como interactua con
sistemas externos.

### 5. Componentes con responsabilidad unica

Cada componente debe:
- tener una responsabilidad clara y unica;
- justificar que requisito satisface;
- definir su owner o equipo responsable.

### 6. Flujos principales, alternos y de error

Documenta los flujos criticos del sistema, incluyendo caminos alternativos y
manejo de errores.

### 7. Modelo de datos conceptual

Define las entidades principales, sus relaciones y ciclo de vida. Este es un
modelo conceptual, no un esquema de base de datos.

### 8. Contratos de integracion

Especifica como se comunican los componentes entre si y con sistemas externos:
APIs, eventos, colas, etc.

### 9. Seguridad, privacidad y auditoria

Documenta autenticacion, autorizacion, manejo de datos sensibles y requisitos
de auditoria.

### 10. Observabilidad y operacion

Define logs, metricas, trazas, alertas y procedimientos de recuperacion.

### 11. Estrategia de pruebas y gates

Establece como se验证 cada componente y que gates deben pasarse antes de
avanzar.

### 12. Riesgos, tradeoffs y decisiones pendientes

Lista los riesgos conocidos, las decisiones tomadas con su justificacion, y las
que quedan pendientes.

### 13. Plan incremental de implementacion

Define la secuencia de entrega en incrementos verticales demostrables, con
dependencias y puntos de verificacion.

## Reglas

- Cada componente debe justificar que requisito satisface.
- Cada requisito critico debe tener una forma de validacion.
- No elegir tecnologia sin registrar la necesidad y el tradeoff.
- No confundir una lista de herramientas con una arquitectura. Una arquitectura
  describe como se divide el trabajo, como fluye la informacion y que decisiones
  se tomaron. Una lista de herramientas solo enumera tecnologias.
- Separar estado actual, objetivo y transicion.

## Criterios de salida

El blueprint esta listo cuando:

- todos los entregables minimos estan presentes;
- cada componente tiene un requisito asociado;
- los riesgos y tradeoffs estan documentados;
- el plan de implementacion es ejecutable en incrementos;
- no hay huecos criticos sin resolver.
