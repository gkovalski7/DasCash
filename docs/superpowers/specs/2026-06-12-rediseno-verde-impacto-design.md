# Rediseño "Verde impacto" — app privada estilo delivery

**Fecha:** 2026-06-12 · **Estado:** aprobado por Germán (mockups validados en visual companion)

## Objetivo

Rediseñar la app privada del consumidor (`/app/*`) con la gramática visual de una app de delivery (PedidosYa): mobile-first, color protagonista, cards grandes, navegación inferior fija con botón QR central. El mensaje: *PedidosYa te muestra la comida que llega; DasCash te muestra el impacto que generás.*

**No cambia:** rutas, capa de datos (`lib/api.ts`), lógica de negocio, backend. Es un rediseño de componentes, layouts y estilos.

## Identidad visual

| Token | Valor | Uso |
|---|---|---|
| `navy-900` | `#0A2236` (existente) | Headers de pantalla, texto principal, FAB alternativo |
| `green-600` | `#65A30D` | **Color primario**: botones, chips activos, tags de cashback, FAB QR |
| `green-700` | `#3F6212` | Hover/texto verde oscuro |
| `lime-400` | `#A3E635` (existente) | Acento en gradientes y barras de progreso |
| `green-50` | `#F0FDF4` | Fondos suaves de chips/cards |
| `app-bg` | `#F8FAF7` | Fondo de la app privada |

- **Tipografía:** Nunito (Google Fonts; 400/600/800), aplicada solo dentro de la app privada en esta fase. Fallback: stack `sans` actual.
- Bordes redondeados generosos (`rounded-xl`/`rounded-2xl`), sombras suaves verdosas.
- La paleta azul actual sigue vigente en el sitio público (fuera de alcance).

## Layout

- **`AppLayout` nuevo:** columna centrada `max-w-[480px]` sobre fondo neutro (estilo PedidosYa web). Header superior se reemplaza por headers por pantalla; abajo, `BottomNav` fija.
- **`BottomNav`** (5 ítems): Inicio (`/app/home`), Tiendas (`/app/stores`), **QR** (FAB central elevado → `/app/scan`), Impacto (`/app/causes`), Perfil (`/app/profile`). Ítem activo en verde.
- Merchant/Admin: siguen funcionando dentro del shell sin rediseño propio (el panel admin conserva su layout actual; fuera de alcance).

## Componentes nuevos/actualizados (`src/components/ui/`)

- `BottomNav` — navegación inferior con FAB QR.
- `ScreenHeader` — header de pantalla (navy o verde) con título, subtítulo y slot para búsqueda.
- `StoreCard` — imagen/gradiente, nombre, categorías + dirección, tag verde "X% 💚".
- `ImpactCard` — card oscura con monto del período y barra de progreso.
- `ProgressBar` — barra con gradiente verde→lima.
- `Chip` — filtro de categoría (activo verde sólido / inactivo borde).
- `Button`/`Card` existentes: nueva variante verde y radios mayores.

## Pantallas (alcance)

1. **Home (`/app/home`)** — saludo + "estás apoyando a X" donde X es la causa con más donaciones del usuario, derivada de `/api/profile/donations/` (no existe causa-por-usuario en el modelo; si no donó aún: CTA "elegí tu primera causa"), `ImpactCard` con lo donado del mes (suma de donaciones del mes desde `/api/profile/donations/`), búsqueda, chips de categorías (`/api/commerce/categories/`), feed de `StoreCard` (`/api/commerce/stores/` paginado).
2. **Tiendas (`/app/stores`, `/app/stores/:id`)** — listado con los mismos `StoreCard` + detalle restilizado.
3. **Pagar con QR (`/app/scan`, `/app/pagar/:slug`, `/app/pago-exitoso`, `/app/pago-fallido`)** — header verde con nombre del comercio y % de cashback, monto en tipografía gigante, card "tu cashback dona $X → causa" calculada en vivo, botón "Pagar con Mercado Pago", sello "🔒 procesado por Mercado Pago". Éxito/fallo restilizados con la misma identidad.
4. **Mi Impacto (`/app/causes`)** — héroe con total donado (`/api/profile/`), card por causa con total acumulado, historial de últimas donaciones (`/api/profile/donations/`).
5. **Mis compras (`/app/purchases`)** y **Perfil (`/app/profile`)** — restilizados con cards y tags de estado.

**Regla de datos:** solo se muestra información que la API ya provee. Sin distancias ("a 400 m") ni metas de causa (no existe `goal_amount` en el modelo) — las barras de progreso expresan proporciones reales (p. ej. participación de cada causa en el total donado). Si en el futuro se agrega meta por causa, el `ProgressBar` ya queda listo.

## Fuera de alcance

Landing y páginas públicas; panel admin; pantalla `/app/settings` (sigue placeholder); PWA; cambios de backend o endpoints; gestor de estado global.

## Estados y errores

Se conservan los manejos existentes (loading/error/empty por página) con estilos nuevos: skeletons simples en cards, estados vacíos con emoji + CTA (p. ej. "Todavía no donaste — escaneá tu primer QR").

## Verificación

- `tsc --noEmit` limpio (vía Docker).
- Suite backend intacta (no se toca backend): 87/87.
- Verificación visual: levantar stack dev y recorrer las 5 pantallas en viewport móvil y desktop (columna centrada), con los usuarios seed.
