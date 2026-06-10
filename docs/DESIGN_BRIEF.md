# DasCash — Brief de diseño frontend

Documento de contexto para pasarle a Claude Design (o a quien rediseñe el frontend) sin que tenga que leer el código para entender qué es la plataforma, cómo está armada visualmente hoy, y qué hay para mejorar.

## 1. Qué es DasCash

Plataforma de cashback con propósito social: el cashback de las compras que los usuarios hacen en comercios adheridos se convierte en donaciones para causas sociales (clubes deportivos, ONGs barriales, etc.) que el usuario elige. Inspirada en FlipGive, pensada para el ecosistema deportivo argentino.

Tres roles de usuario:
- **Consumer**: compra en tiendas adheridas, elige una causa, su cashback se dona automáticamente a esa causa.
- **Merchant** (comercio): aprueba/gestiona las compras reportadas en su tienda.
- **Admin**: gestiona comercios, tiendas, campañas y causas desde un panel interno.

## 2. Stack técnico (restricciones para el rediseño)

- React 18 + TypeScript + Vite
- TailwindCSS utility-first — no hay librería de componentes (MUI, shadcn, etc.), `Button`/`Card` son propios y minimalistas
- React Router v6 (rutas declaradas centralmente en `App.tsx`)
- Sin gestor de estado global: cada página maneja su estado con `useState`/`useEffect`
- Iconos: `lucide-react` (usado parcialmente, p.ej. en la landing)

El rediseño puede tocar libremente componentes, layouts y estilos — no requiere cambiar rutas ni la capa de datos para funcionar.

## 3. Identidad visual actual

### Paleta (`tailwind.config.js` + `src/styles/tokens.css`)

| Token | Hex | Uso actual |
|---|---|---|
| `navy-900` | `#0A2236` | Fondo del hero, footer, secciones oscuras |
| `navy-800` | `#0F2E48` | Gradiente junto a navy-900 |
| `blue-600` | `#2E6CF6` | Color primario de acción (botones, links activos) |
| `blue-700` | `#2154CC` | Hover de blue-600 |
| `sky-50` | `#F5F8FF` | Fondos de secciones claras |
| `gray-700` / `gray-500` | `#1F2937` / `#6B7280` | Texto secundario |
| `lime-400` | `#A3E635` | Acento (casi sin uso — solo el filete del footer) |

Hay además un navy alternativo `#00264E` **hardcodeado** en el header público (`Header.tsx`), que no está en los tokens — es una inconsistencia para unificar.

### Tipografía

No hay fuente custom: usa el stack `sans` por defecto del sistema/Tailwind. No existe una escala tipográfica documentada — los tamaños se definen ad-hoc por sección (`text-[clamp(24px,5.5vw,56px)]`, `text-3xl`, `text-sm`, etc.). Es un buen punto de partida para que el rediseño defina una jerarquía consistente (y, si se quiere, sume una tipografía con personalidad).

### Componentes base (`src/components/ui/`)

- `Button`: variantes `primary` (azul sólido) y `secondary` (blanco con borde), `rounded-md`
- `Card`: contenedor con borde sutil, sombra suave, `rounded-lg`

Son deliberadamente simples — no hay variantes de tamaño, estados adicionales, ni un sistema de espaciado/tipografía formal. Es probable que el rediseño los reemplace o los expanda en un sistema más completo.

### Patrones visuales recurrentes

- Hero con gradiente navy diagonal y texto blanco (landing)
- Tarjetas con sombra suave y bordes redondeados sobre fondo blanco o `sky-50`
- Carruseles tipo "marquee" infinito para logos de marcas (`BrandCarousel`, animaciones CSS en `globals.css`)
- Dos headers distintos: el público (`Header.tsx`, transparente sobre el hero y sólido al hacer scroll) y el de la app privada (`AppLayout.tsx`, barra simple con nav + avatar de usuario)

## 4. Mapa de páginas y flujos

### Sitio público — sin login (`PublicLayout`)

| Ruta | Página | Qué muestra |
|---|---|---|
| `/` | Landing | Hero, "cómo funciona" en 3 pasos, carrusel de marcas, causas destacadas, bloques por audiencia (consumidor / equipo / comercio), testimonios |
| `/how-it-works` | Cómo funciona | Explicación detallada del modelo cashback → donación |
| `/for-consumers`, `/for-teams`, `/for-business` | Landings por audiencia | Pitch específico para cada perfil |
| `/causas`, `/causas/:slug` | Causas (listado / detalle) | Browse público de causas sociales para apoyar |
| `/login`, `/signup` | Auth | Formularios de ingreso y registro |
| `/forgot-password`, `/reset-password` | Recuperación de contraseña | Flujo recién agregado: formulario de email → estado de éxito; formulario de nueva contraseña → estados de éxito/error/link inválido |

### App privada — requiere login (`AppLayout`)

| Ruta | Página | Qué muestra |
|---|---|---|
| `/app/home` | Home | Feed de causas: destacadas + listado filtrable por categoría, búsqueda y orden |
| `/app/dashboard`, `/app/profile` | Perfil | Datos del usuario, balance/impacto acumulado |
| `/app/stores`, `/app/stores/:id` | Tiendas | Listado paginado de comercios adheridos + detalle (tasa de cashback, condiciones) |
| `/app/purchases` | Mis compras | Historial paginado de compras y estado del cashback |
| `/app/causes`, `/app/causes/:slug` | Mi impacto | Causas que el usuario apoya + detalle |
| `/app/merchant/purchases` | Pendientes (solo MERCHANT/ADMIN) | Aprobación de compras reportadas en el comercio |
| `/app/settings` | — | Placeholder ("Settings (próximamente)") |

### Panel admin — `/app/admin/*` (solo ADMIN, dentro de `AdminLayout`)

CRUD de comercios, tiendas (+ asociación a causas), campañas y causas. Son formularios y tablas funcionales; no tuvieron foco de diseño visual — candidatos claros a mejorar.

## 5. Flujos clave para tener en cuenta

1. **Onboarding consumer**: landing → signup/login → elegir causa → explorar tiendas → comprar → ver impacto acumulado
2. **Aprobación merchant**: login → ver compras pendientes → aprobar/rechazar
3. **Gestión admin**: login → CRUD de comercios / tiendas / campañas / causas
4. **Recuperación de cuenta**: login → "olvidé mi contraseña" → email con link → nueva contraseña

## 6. Inconsistencias de marca — RESUELTAS (2026-06-10)

Todas las inconsistencias detectadas en la versión anterior de este brief ya fueron corregidas:

- ✅ Logo del header de la app privada (`AppLayout.tsx`): dice "DasCash"
- ✅ `<title>` de `index.html`: "DasCash — Beneficios con propósito"
- ✅ Asunto del mailto en `for-business.tsx`: "Solicitud de comercio – DasCash"
- ✅ Navy hardcodeado `#00264E` en `Header.tsx`: eliminado (unificado con tokens)
- ✅ Footer: copyright "© 2026 GK Gestión Deportiva" y logo "DasCash"

## 7. Qué conviene pedirle a Claude Design

Como el objetivo es "hacer el frontend lindo", además de este brief conviene darle:

- **Capturas de las pantallas principales** (landing, home, tiendas, causas, perfil, admin) — se pueden generar levantando el proyecto con Docker (`docker compose -f infra/docker-compose.yml up --build`) y navegando con las credenciales semilla (ver `docs/SYSTEM.md` o memoria del proyecto)
- **Una referencia estética**: ¿algo más cálido/deportivo, más "fintech corporativo", más "impacto social"? FlipGive es la referencia funcional, pero ¿también la visual?
- **Si la paleta navy/azul/lime actual debe respetarse** (es la identidad de marca actual) **o si está abierta a redefinirse** por completo
- Aclarar que el rediseño puede tocar componentes/layouts libremente sin afectar rutas ni lógica de datos
