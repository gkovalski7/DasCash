# Documento de Producto — Plataforma Cashback

**Versión:** 1.0  
**Fecha:** 2026-04-27  
**Estado:** MVP funcional — uso interno

---

## Índice

1. [¿Qué es la plataforma?](#1-qué-es-la-plataforma)
2. [Problema que resuelve](#2-problema-que-resuelve)
3. [Propuesta de valor](#3-propuesta-de-valor)
4. [Usuarios y roles](#4-usuarios-y-roles)
5. [Funcionalidades por actor](#5-funcionalidades-por-actor)
6. [Flujo de experiencia del usuario](#6-flujo-de-experiencia-del-usuario)
7. [Modelo de negocio](#7-modelo-de-negocio)
8. [Diferenciadores clave](#8-diferenciadores-clave)
9. [Estado actual del producto](#9-estado-actual-del-producto)
10. [Roadmap de producto](#10-roadmap-de-producto)

---

## 1. ¿Qué es la plataforma?

**Cashback** es una plataforma de **cashback con propósito social**, inspirada en FlipGive. Permite que los consumidores obtengan un porcentaje de devolución de sus compras en comercios adheridos, y ese cashback se destina automáticamente a una **causa social** elegida por el propio consumidor (club deportivo barrial, proyecto educativo, ONG de salud, etc.).

En lugar de que el cashback sea simplemente un descuento en la próxima compra, aquí **la devolución se convierte en una donación a una causa que el usuario apoya**.

---

## 2. Problema que resuelve

### Para el consumidor

- Compro en comercios todos los días pero ese dinero no genera ningún impacto más allá de la transacción.
- Quiero apoyar causas sociales pero no siempre tengo el hábito ni el presupuesto para donar directamente.
- No tengo visibilidad de cuánto impacto he generado con mis decisiones de compra.

### Para el comerciante

- Necesito atraer y fidelizar clientes diferenciándome de la competencia.
- Participar en programas de responsabilidad social es costoso y complejo de implementar solo.
- No tengo manera sencilla de conectar mis ventas con causas que mis clientes valoran.

### Para las causas (clubes, ONGs, proyectos)

- Captar donaciones es difícil, requiere campañas constantes y genera dependencia de la voluntad del donante.
- No tienen un flujo de financiamiento recurrente y predecible.
- Sus donantes no siempre saben cuánto han aportado en total.

---

## 3. Propuesta de valor

| Actor           | Valor entregado                                                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Consumidor**  | Cada compra genera impacto. Sin costo adicional, sin cambiar hábitos. El cashback que le correspondería a él va a la causa que eligió. Ve en tiempo real cuánto ha donado. |
| **Comerciante** | Atrae clientes comprometidos socialmente. Se asocia con causas locales relevantes para su comunidad. Diferenciación real vs. competencia.                                  |
| **Causa / ONG** | Recibe donaciones automáticas y recurrentes, generadas por el comportamiento de compra cotidiano de la comunidad. Sin depender de campañas puntuales.                      |
| **Plataforma**  | Comisión sobre el volumen de cashback generado y/o suscripción mensual de comerciantes.                                                                                    |

---

## 4. Usuarios y roles

### CONSUMER (Consumidor)

**Quién es:** Persona que compra en los comercios adheridos y quiere que su consumo tenga impacto social.

**Motivación principal:** Apoyar una causa que le importa (el club de su hijo, una escuela de su barrio, una ONG ambiental) sin gastar más dinero del que ya gasta.

### MERCHANT (Comerciante)

**Quién es:** Dueño o responsable de un comercio (tienda física o digital) que se incorpora a la red de la plataforma.

**Motivación principal:** Fidelizar clientes, diferenciarse por sus valores y aumentar el tráfico hacia su local o sitio web.

### ADMIN (Administrador)

**Quién es:** Equipo interno de la plataforma.

**Responsabilidades:** Onboarding de nuevos comerciantes, gestión de campañas de cashback, administración de causas habilitadas, supervisión de compras y transacciones.

---

## 5. Funcionalidades por actor

### CONSUMER

#### Descubrimiento

- Navega el **listado público de tiendas** con filtros por categoría (Gastronomía, Indumentaria, Tecnología, etc.) y buscador por nombre/descripción.
- Cada tienda muestra las **causas que soporta**, el porcentaje de cashback activo y datos de contacto (Instagram, web, dirección).
- Navega el **listado público de causas** con categorías (Deporte, Educación, Salud, Ambiente) y accede al detalle de cada causa.

#### Registro y acceso

- Se registra con email y contraseña (mínimo 8 caracteres).
- Se loguea con email o username. Recibe un JWT que lo identifica.

#### Compra y cashback

- En el detalle de una tienda, **registra una compra** indicando el monto, el medio (QR, link, recibo) y la **causa a la que quiere destinar el cashback**.
- La compra queda en estado `PENDING` hasta que el comerciante la aprueba.
- Al aprobarse, se genera automáticamente una `CashbackTransaction` con el monto calculado según la campaña activa de esa tienda.

#### Seguimiento

- Ve su **historial de compras** con estados (PENDING / APPROVED / REJECTED).
- Ve sus **donaciones** desglosadas por causa: cuánto aportó a cada una, en qué tienda, cuándo.
- Ve su **perfil con métricas**: total donado, número de causas apoyadas, número de compras realizadas.

### MERCHANT

#### Gestión de compras

- Accede al panel de **compras pendientes** de sus tiendas.
- Aprueba compras — esto dispara la generación de cashback automáticamente.
- (Futuro) Rechazar compras con motivo.

#### Visibilidad

- Ve las tiendas, causas y campañas asociadas a su cuenta.
- Edita su perfil.

### ADMIN

#### Gestión de la red

- Crea nuevos usuarios MERCHANT con su entidad `Merchant` asociada (operación atómica en un solo API call).
- Lista todos los usuarios con filtro por rol.

#### Gestión de comercios

- CRUD completo de Merchants y Stores.
- Asigna y gestiona qué **causas soporta** cada tienda.
- Activa / desactiva tiendas.

#### Campañas de cashback

- Crea **campañas** que vinculan una o más tiendas con una causa, un porcentaje de cashback y un rango de fechas.
- Puede configurar un **porcentaje diferente por tienda** dentro de la misma campaña.
- El sistema valida que no existan campañas activas solapadas para la misma tienda.
- Edita campañas existentes.

#### Gestión de causas

- CRUD de causas: título, slug, categoría, descripción, imagen, activo/inactivo, destacado.
- Una causa no puede eliminarse si tiene campañas asociadas (protección de integridad).

#### Supervisión

- Ve todas las compras y transacciones de la plataforma.
- Puede aprobar compras directamente (sin pasar por el merchant).

---

## 6. Flujo de experiencia del usuario

### Journey del Consumidor

```
1. Descubre la plataforma
   → Landing page: propuesta de valor, cómo funciona, causas destacadas

2. Se registra
   → /signup: email + contraseña (30 segundos)

3. Explora tiendas
   → /app/stores: filtrar por categoría, buscar por nombre
   → Elige una tienda cercana o de interés

4. Ve el detalle de la tienda
   → /app/stores/:id: descripción, causas soportadas, campaña activa (% cashback)

5. Registra su compra
   → Ingresa monto, fuente (QR / link / recibo)
   → Elige la causa a la que quiere destinar el cashback
   → Status: PENDING

6. El merchant aprueba
   → Cashback calculado automáticamente
   → Status: APPROVED → CashbackTransaction creada

7. Consulta su impacto
   → /app/profile: total donado, causas apoyadas
   → /app/causes: desglose por causa
   → /app/purchases: historial de compras
```

### Journey del Comerciante

```
1. El admin lo da de alta
   → Crea usuario MERCHANT + entidad Merchant

2. Admin configura su tienda
   → Crea Store, asigna categorías, agrega causas que soporta
   → Crea campaña de cashback (%, fechas)

3. El merchant gestiona compras
   → /app/merchant/purchases: ve compras pendientes
   → Aprueba compras → cashback generado automáticamente
```

---

## 7. Modelo de negocio

### Mecanismo de cashback

```
Compra del consumidor: $100
Campaña activa:        5% cashback
Cashback generado:     $5.00  →  va a la causa elegida
```

El porcentaje de cashback es asumido por el **comerciante** como costo de participar en la red (similar a una comisión de marketing).

### Fuentes de ingreso potenciales de la plataforma

| Fuente                                  | Descripción                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| **Suscripción mensual del comerciante** | Tarifa fija por acceso a la red y herramientas de gestión                      |
| **Comisión sobre cashback generado**    | % sobre el volumen de cashback (ej: la plataforma retiene 20% del 5% acordado) |
| **Onboarding premium**                  | Servicio de setup y configuración para comerciantes                            |
| **Patrocinio de causas**                | Marcas que quieren asociarse a causas concretas                                |

---

## 8. Diferenciadores clave

### vs. cashback tradicional (tarjetas de crédito, apps de descuentos)

| Cashback tradicional                   | Esta plataforma                                       |
| -------------------------------------- | ----------------------------------------------------- |
| El beneficio va solo al consumidor     | El beneficio va a una causa elegida por el consumidor |
| Motiva el consumo compulsivo           | Motiva el consumo consciente y con propósito          |
| Relación fría entre marca y consumidor | Relación de valores compartidos                       |
| Anonimato total                        | Comunidad visible alrededor de causas                 |

### vs. donación directa

| Donación directa                             | Esta plataforma                               |
| -------------------------------------------- | --------------------------------------------- |
| Requiere esfuerzo activo y presupuesto extra | Ocurre automáticamente con compras cotidianas |
| Una sola vez o campaña específica            | Recurrente y acumulativa                      |
| Donante no ve el impacto acumulado           | Panel de impacto en tiempo real               |

---

## 9. Estado actual del producto

### Páginas y flujos disponibles (MVP)

#### Públicas (sin login)

| Pantalla                             | Estado          |
| ------------------------------------ | --------------- |
| Landing page (hero, beneficios, CTA) | ✅ Implementado |
| Cómo funciona                        | ✅ Implementado |
| Para consumidores                    | ✅ Implementado |
| Para equipos                         | ✅ Implementado |
| Para comercios                       | ✅ Implementado |
| Listado de causas                    | ✅ Implementado |
| Detalle de causa                     | ✅ Implementado |
| Login                                | ✅ Implementado |
| Registro (consumidor)                | ✅ Implementado |

#### Autenticadas — Consumer

| Pantalla                               | Estado          |
| -------------------------------------- | --------------- |
| Dashboard / Home con causas            | ✅ Implementado |
| Perfil + métricas                      | ✅ Implementado |
| Listado de tiendas (filtros, búsqueda) | ✅ Implementado |
| Detalle de tienda + registrar compra   | ✅ Implementado |
| Mis compras (historial)                | ✅ Implementado |
| Mis causas / impacto acumulado         | ✅ Implementado |
| Settings                               | ⚠️ Placeholder  |

#### Autenticadas — Merchant

| Pantalla                        | Estado          |
| ------------------------------- | --------------- |
| Compras pendientes + aprobación | ✅ Implementado |

#### Admin

| Pantalla                                    | Estado          |
| ------------------------------------------- | --------------- |
| Gestión de merchants (crear, listar)        | ✅ Implementado |
| Gestión de tiendas (crear, listar, causas)  | ✅ Implementado |
| Gestión de campañas (crear, editar, listar) | ✅ Implementado |
| Gestión de causas (crear, editar, listar)   | ✅ Implementado |

### Limitaciones conocidas del MVP

| Limitación                                  | Impacto                                                         |
| ------------------------------------------- | --------------------------------------------------------------- |
| Sin paginación en listados                  | Problema de rendimiento con muchos registros                    |
| Sin Update/Delete en la mayoría de recursos | Requiere acceso directo a base de datos para corregir datos     |
| Upload de recibos sin implementar           | El consumer solo puede declarar compra, no adjuntar comprobante |
| Sin notificaciones (push/email)             | El consumer no recibe confirmación cuando su compra es aprobada |
| Sin pasarela de pago                        | El cashback es virtual, no se transfiere dinero real            |
| Registro solo para consumers                | Los merchants son dados de alta manualmente por el admin        |

---

## 10. Roadmap de producto

### Sprint actual / inmediato

- [ ] Refresh automático de JWT en el frontend (el token expira y no se renueva)
- [ ] Paginación en listados de tiendas, compras y merchants
- [ ] Pantalla de Settings funcional (cambio de contraseña, notificaciones)

### Próximo (corto plazo)

- [ ] Upload de recibos: subida de imagen (S3) + validación manual o con OCR básico
- [ ] Notificaciones por email: compra aprobada, cashback generado, resumen mensual
- [ ] CRUD completo para merchants y stores en el panel admin
- [ ] Edición de perfil enriquecida (foto de perfil, bio)
- [ ] Registro de merchant directamente desde la web (con validación por el admin)

### Mediano plazo

- [ ] App móvil (React Native o PWA) para registro de compras en el punto de venta
- [ ] QR dinámico por tienda para registro rápido de compras desde celular
- [ ] Dashboard de impacto para causas (cuánto recibieron, de cuántos comercios)
- [ ] Reportes y métricas para merchants (volumen, conversión)
- [ ] Integración con pasarela de pagos para liquidación real del cashback a las causas

### Largo plazo

- [ ] API pública para integración con sistemas de punto de venta (POS)
- [ ] Programa de equipos / grupos (grupos de padres, clubes) con metas colectivas
- [ ] Gamificación: badges, niveles, rankings de impacto por comunidad
- [ ] Internacionalización (multi-moneda, multi-idioma)
