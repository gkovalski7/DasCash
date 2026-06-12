# Rediseño "Verde impacto" — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar la app privada (`/app/*`) de DasCash con estética de app de delivery: identidad verde-navy, columna centrada de 480px, navegación inferior con FAB QR.

**Architecture:** Solo frontend (`apps/web`). Se agregan tokens verdes a Tailwind, 4 componentes nuevos en `src/components/app/`, se reescribe `AppLayout` como shell centrado con `BottomNav`, se reescriben `HomePage` y `MyCausesPage`, y se restilizan el resto de las páginas consumer con mapeos de clases. Rutas, `lib/api.ts` y backend NO se tocan.

**Tech Stack:** React 18 + TypeScript + Vite + TailwindCSS + lucide-react. Fuente nueva: Nunito (Google Fonts).

**Spec:** `docs/superpowers/specs/2026-06-12-rediseno-verde-impacto-design.md`

**Verificación (no hay test runner frontend):** cada task se verifica con typecheck:
```bash
cd "C:\Users\German\Desktop\Ecosistena GK\DasCash"
docker run --rm -v "${PWD}\apps\web:/app" -w /app node:20-alpine node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit
```
(en git-bash: prefijar `MSYS_NO_PATHCONV=1` y usar `-v "$(pwd -W)/apps/web:/app"`). Expected: exit 0, sin output.
La verificación visual final usa el stack dev: `docker compose -f infra/docker-compose.yml up -d` → http://localhost:5173, login `consumer@example.com / Consumer1234!`.

**Regla de datos (de la spec):** solo mostrar lo que la API devuelve. `ApiStore` NO trae % de cashback → las cards de tienda muestran categorías y causas apoyadas; el % aparece solo en detalle por slug y en PagarComercio (donde sí existe `cashback_percentage`). Sin distancias, sin metas de causa.

---

### Task 1: Tokens verdes + fuente Nunito

**Files:**
- Modify: `apps/web/tailwind.config.ts`
- Modify: `apps/web/index.html` (línea del link de Google Fonts)
- Modify: `apps/web/src/styles/tokens.css`

- [ ] **Step 1: Agregar colores y fuente a Tailwind**

En `tailwind.config.ts`, dentro de `theme.extend`:

```ts
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        sans:    ['"DM Sans"', 'sans-serif'],
        app:     ['"Nunito"', 'sans-serif'],
      },
```

y dentro de `colors.brand` agregar (sin borrar los existentes):

```ts
          'green-600': '#65A30D',
          'green-700': '#3F6212',
          'green-50':  '#F0FDF4',
          'app-bg':    '#F8FAF7',
```

- [ ] **Step 2: Cargar Nunito en `index.html`**

Reemplazar el `href` del link de fonts.googleapis por el mismo agregando `&family=Nunito:wght@400;600;700;800`:

```html
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
```

- [ ] **Step 3: Agregar variables CSS en `tokens.css`** (después de `--lime-300`):

```css
  --green-600: #65A30D;
  --green-700: #3F6212;
  --green-50:  #F0FDF4;
  --app-bg:    #F8FAF7;
```

- [ ] **Step 4: Typecheck** — comando del header. Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/tailwind.config.ts apps/web/index.html apps/web/src/styles/tokens.css
git commit -m "feat(web): tokens verde impacto + fuente Nunito"
```

---

### Task 2: Componentes base de la app

**Files:**
- Create: `apps/web/src/components/app/BottomNav.tsx`
- Create: `apps/web/src/components/app/ScreenHeader.tsx`
- Create: `apps/web/src/components/app/ProgressBar.tsx`
- Create: `apps/web/src/components/app/Chip.tsx`

- [ ] **Step 1: `BottomNav.tsx`** — navegación inferior con FAB QR central:

```tsx
import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Store, QrCode, TrendingUp, User } from 'lucide-react'

const itemCls = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center gap-0.5 text-[11px] font-app font-semibold transition-colors ${
    isActive ? 'text-brand-green-700' : 'text-gray-400 hover:text-gray-600'
  }`

export default function BottomNav() {
  const navigate = useNavigate()
  return (
    <nav className="sticky bottom-0 z-40 w-full max-w-[480px] mx-auto bg-white border-t border-gray-100 px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-end justify-around py-2">
        <NavLink to="/app/home" className={itemCls}><Home size={20} />Inicio</NavLink>
        <NavLink to="/app/stores" className={itemCls}><Store size={20} />Tiendas</NavLink>
        <button
          onClick={() => navigate('/app/scan')}
          aria-label="Pagar con QR"
          className="-mt-7 w-14 h-14 rounded-full bg-brand-green-600 text-white border-4 border-white
                     shadow-[0_4px_14px_rgba(101,163,13,0.45)] flex flex-col items-center justify-center
                     hover:bg-brand-green-700 transition-colors"
        >
          <QrCode size={22} />
          <span className="text-[9px] font-app font-bold leading-none">QR</span>
        </button>
        <NavLink to="/app/causes" className={itemCls}><TrendingUp size={20} />Impacto</NavLink>
        <NavLink to="/app/profile" className={itemCls}><User size={20} />Perfil</NavLink>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: `ScreenHeader.tsx`** — header de pantalla navy o verde con slot:

```tsx
import { ReactNode } from 'react'

export default function ScreenHeader({
  variant = 'navy', eyebrow, title, children,
}: {
  variant?: 'navy' | 'green'
  eyebrow?: ReactNode
  title: ReactNode
  children?: ReactNode
}) {
  const bg = variant === 'green' ? 'bg-brand-green-600' : 'bg-brand-navy-900'
  return (
    <header className={`${bg} text-white px-4 pt-5 pb-4 rounded-b-3xl`}>
      {eyebrow && <p className="text-xs text-white/75 font-app mb-0.5">{eyebrow}</p>}
      <h1 className="text-xl font-app font-extrabold leading-tight">{title}</h1>
      {children}
    </header>
  )
}
```

- [ ] **Step 3: `ProgressBar.tsx`**:

```tsx
export default function ProgressBar({ pct, className = '' }: { pct: number; className?: string }) {
  const width = Math.max(0, Math.min(100, pct))
  return (
    <div className={`h-2 rounded-full bg-black/10 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-green-600 to-brand-lime-400 transition-all"
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 4: `Chip.tsx`**:

```tsx
export default function Chip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-app font-bold transition-all ${
        active
          ? 'bg-brand-green-600 text-white shadow-sm'
          : 'bg-white text-brand-green-700 border border-brand-green-600/25 hover:border-brand-green-600'
      }`}
    >
      {label}
    </button>
  )
}
```

- [ ] **Step 5: Typecheck.** Expected: exit 0 (los componentes aún no se usan — no debe haber errores de unused porque son archivos nuevos exportados).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/app/
git commit -m "feat(web): componentes base BottomNav, ScreenHeader, ProgressBar, Chip"
```

---

### Task 3: AppLayout — shell centrado con BottomNav

**Files:**
- Modify: `apps/web/src/layouts/AppLayout.tsx` (reescritura completa)

- [ ] **Step 1: Reescribir `AppLayout.tsx`**

Conservar el chequeo de autenticación. El header superior y el logout desaparecen del layout (el logout pasa a Perfil en Task 8). El admin sigue accesible: las rutas `/app/admin/*` viven dentro de este shell y `AdminLayout` les pone su propio sub-header.

```tsx
import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { isAuthenticated } from '../lib/auth'
import BottomNav from '../components/app/BottomNav'

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  React.useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true, state: { from: location } })
    }
  }, [location, navigate])

  return (
    <div className="min-h-screen bg-gray-200/60 font-app">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-brand-app-bg shadow-xl">
        <main className="flex-1">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck.** Expected: exit 0. Nota: `QrCode`, `clearTokens`, `getAccessToken`, `getRole`, `Link`, `NavLink` ya no se usan en este archivo — eliminar esos imports o falla el build de tsc con `noUnusedLocals`.

- [ ] **Step 3: Verificación visual rápida** — `docker compose -f infra/docker-compose.yml up -d`, login y comprobar: columna centrada en desktop, BottomNav abajo con FAB verde, todas las rutas `/app/*` siguen renderizando (el contenido interior todavía tiene el look viejo — esperado).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/layouts/AppLayout.tsx
git commit -m "feat(web): AppLayout columna centrada 480px + BottomNav con FAB QR"
```

---

### Task 4: HomePage — feed de comercios

**Files:**
- Modify: `apps/web/src/pages/home/HomePage.tsx` (reescritura completa)

La home pasa de "feed de causas" a "feed de comercios" (las causas viven en Mi Impacto y en el detalle de tienda). Datos: `getProfile()`, `getProfileDonations()`, `fetchStores()` (paginado — usar `results`), `get<ApiCategory[]>('/api/commerce/categories/')`.

- [ ] **Step 1: Reescribir `HomePage.tsx`**

```tsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Store as StoreIcon, Heart } from 'lucide-react'
import {
  get, fetchStores, getProfile, getProfileDonations,
  type ApiStore, type ApiCategory, type ApiProfile, type ApiDonation,
} from '../../lib/api'
import ScreenHeader from '../../components/app/ScreenHeader'
import ProgressBar from '../../components/app/ProgressBar'
import Chip from '../../components/app/Chip'

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ApiProfile | null>(null)
  const [donations, setDonations] = useState<ApiDonation[]>([])
  const [stores, setStores] = useState<ApiStore[]>([])
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getProfile(),
      getProfileDonations().catch(() => [] as ApiDonation[]),
      get<ApiCategory[]>('/api/commerce/categories/'),
    ]).then(([prof, dons, cats]) => {
      if (cancelled) return
      setProfile(prof); setDonations(dons); setCategories(cats)
    }).catch((err) => console.error('Error cargando home:', err))
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const q = new URLSearchParams()
    if (search) q.set('search', search)
    if (category) q.set('category', category)
    fetchStores(q)
      .then((page) => { if (!cancelled) setStores(page.results) })
      .catch((err) => console.error('Error cargando tiendas:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search, category])

  // Causa más apoyada (derivada del historial real) e impacto del mes
  const { topCause, monthTotal } = useMemo(() => {
    const byCause = new Map<string, number>()
    let month = 0
    const now = new Date()
    for (const d of donations) {
      const amt = parseFloat(d.amount) || 0
      byCause.set(d.cause_title, (byCause.get(d.cause_title) || 0) + amt)
      const dt = new Date(d.created_at)
      if (dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth()) month += amt
    }
    let top: string | null = null, topAmt = 0
    byCause.forEach((amt, title) => { if (amt > topAmt) { top = title; topAmt = amt } })
    return { topCause: top, monthTotal: month }
  }, [donations])

  const totalDonated = parseFloat(profile?.total_donated || '0')
  const monthPct = totalDonated > 0 ? (monthTotal / totalDonated) * 100 : 0
  const firstName = profile?.first_name || profile?.email?.split('@')[0] || ''

  return (
    <div>
      <ScreenHeader
        eyebrow={`Hola ${firstName} 👋${topCause ? ' · estás apoyando a' : ''}`}
        title={topCause ? <>{topCause} 💚</> : '¿Dónde comprás hoy?'}
      >
        <div className="relative mt-3">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar comercios…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm font-app text-gray-800
                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-lime-400"
          />
        </div>
      </ScreenHeader>

      <div className="px-4 py-4 space-y-4">
        {profile && (
          <div className="rounded-2xl bg-gradient-to-r from-[#14532D] to-brand-green-700 text-white px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/80">Tu impacto este mes</span>
              <span className="text-lg font-extrabold">${monthTotal.toFixed(2)}</span>
            </div>
            <ProgressBar pct={monthPct} className="mt-2 bg-white/20" />
            <p className="text-[11px] text-white/70 mt-1.5">
              ${totalDonated.toFixed(2)} donados en total · {profile.causes_count} causa{profile.causes_count !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Chip label="Todos" active={category === ''} onClick={() => setCategory('')} />
            {categories.map((c) => (
              <Chip key={c.id} label={c.name} active={category === c.slug} onClick={() => setCategory(c.slug)} />
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-2xl bg-gray-200/70 animate-pulse" />)}
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-16">
            <StoreIcon size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No encontramos comercios con ese criterio.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stores.map((s) => <HomeStoreCard key={s.id} store={s} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function HomeStoreCard({ store }: { store: ApiStore }) {
  return (
    <Link
      to={`/app/stores/${store.id}`}
      className="block bg-white rounded-2xl overflow-hidden shadow-[0_1px_6px_rgba(10,34,54,0.08)]
                 hover:shadow-md transition-shadow"
    >
      <div className="h-20 bg-gradient-to-br from-brand-navy-900 to-brand-green-600 flex items-center justify-center">
        {store.logo_url
          ? <img src={store.logo_url} alt={store.display_name} className="h-12 w-12 rounded-xl object-cover" />
          : <StoreIconFallback />}
      </div>
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-app font-extrabold text-brand-navy-900 truncate">{store.display_name}</h3>
          <p className="text-xs text-gray-400 truncate">
            {[store.categories.map((c) => c.name).join(' · '), store.address].filter(Boolean).join(' — ')}
          </p>
        </div>
        {store.supported_causes.length > 0 && (
          <span className="flex-shrink-0 inline-flex items-center gap-1 bg-brand-green-50 text-brand-green-700
                           text-xs font-bold px-2.5 py-1 rounded-lg">
            <Heart size={11} className="fill-current" /> {store.supported_causes.length} causa{store.supported_causes.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </Link>
  )
}

function StoreIconFallback() {
  return (
    <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center">
      <StoreIcon size={22} className="text-white" />
    </div>
  )
}
```

Nota: verificar contra `lib/api.ts` que `fetchStores` devuelve `ApiPaginated<ApiStore>` con `.results` (sí, desde la paginación v1.1) y que el filtro de categoría acepta slug (`?category=<slug>` — sí, el backend acepta id o slug).

- [ ] **Step 2: Typecheck.** Expected: exit 0.
- [ ] **Step 3: Visual** — home muestra header navy con búsqueda, card verde de impacto, chips y cards de comercios. Buscar y filtrar funciona.
- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/home/HomePage.tsx
git commit -m "feat(web): home rediseñada — feed de comercios estilo delivery"
```

---

### Task 5: Tiendas — StoresPage, StoreDetailPage, StoreCard

**Files:**
- Modify: `apps/web/src/pages/stores/StoresPage.tsx`
- Modify: `apps/web/src/pages/stores/StoreDetailPage.tsx`
- Modify: `apps/web/src/components/StoreCard.tsx` (si StoresPage lo usa; unificar con el look de `HomeStoreCard`)

- [ ] **Step 1: Leer ambas páginas y aplicar el restyle**

Reglas de mapeo (aplicar en TODO el archivo, conservando lógica y estados):

| Patrón actual | Reemplazo |
|---|---|
| `bg-gray-50` / `bg-white` (fondo de página) | `bg-brand-app-bg` (el fondo ya lo da AppLayout: quitar `min-h-screen` y fondos de página) |
| `max-w-6xl mx-auto` / `max-w-screen-*` | quitar (el ancho lo limita el shell de 480px); usar `px-4` |
| `bg-blue-600` / `bg-brand-blue-600` (CTAs) | `bg-brand-green-600` |
| `hover:bg-blue-700` | `hover:bg-brand-green-700` |
| `text-blue-600` (links/acentos) | `text-brand-green-700` |
| `bg-blue-50` / `bg-brand-blue-50` | `bg-brand-green-50` |
| `focus:ring-*blue*` | `focus:ring-brand-lime-400` |
| `font-display` | `font-app` |
| grillas `sm:grid-cols-2 lg:grid-cols-3` | `space-y-3` (lista vertical, una card por fila) |
| `rounded-lg` en cards | `rounded-2xl` |

- El título de página se reemplaza por `<ScreenHeader title="Comercios adheridos" />` (variante navy) con el buscador adentro si la página tiene búsqueda.
- Las cards de tienda usan la misma estructura visual que `HomeStoreCard` de Task 4 (imagen/gradiente arriba, nombre + categorías + tag de causas). Si `StoreCard.tsx` es compartido, actualizarlo ahí y que ambas páginas lo importen desde `src/components/StoreCard.tsx` (mover `HomeStoreCard` de Task 4 a ese archivo y reusar — DRY).
- `StoreDetailPage`: header navy con nombre del comercio. El endpoint por id (`ApiStore`) NO trae % de cashback — no mostrar % acá (regla de datos; el % aparece recién en PagarComercio). Lista de causas apoyadas como cards con corazón verde; CTA principal "Pagar acá con QR" (botón verde, navega a `/app/pagar/${store.qrcode_slug}`).

- [ ] **Step 2: Typecheck.** Expected: exit 0.
- [ ] **Step 3: Visual** — /app/stores lista vertical de cards verdes; detalle muestra causas y CTA de pago.
- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/stores/ apps/web/src/components/StoreCard.tsx apps/web/src/pages/home/HomePage.tsx
git commit -m "feat(web): tiendas restilizadas con cards delivery y CTA de pago QR"
```

---

### Task 6: Flujo de pago QR — PagarComercio, ScanQR, PagoExitoso, PagoFallido

**Files:**
- Modify: `apps/web/src/pages/app/PagarComercio.tsx`
- Modify: `apps/web/src/pages/app/ScanQR.tsx`
- Modify: `apps/web/src/pages/app/PagoExitoso.tsx`
- Modify: `apps/web/src/pages/app/PagoFallido.tsx`

`PagarComercio` ya tiene la estructura correcta (monto grande, selector de causa, botón MP). El trabajo es de identidad:

- [ ] **Step 1: `PagarComercio.tsx`**
  1. Aplicar la tabla de mapeo de Task 5 (azules → verdes, `font-app`, sin `min-h-screen bg-gray-50`).
  2. El header sticky superior (líneas ~158–187) pasa a fondo `bg-brand-green-600` con textos blancos: nombre del comercio en blanco, dirección en `text-white/70`, ícono de volver blanco.
  3. La card "Cashback activo" (gradiente azul, líneas ~190–203) pasa a `from-brand-navy-900 to-brand-green-700`, y el texto "de tu compra va al club" → "de tu compra va a tu causa 💚".
  4. El monto: subir de `text-4xl` a `text-5xl` y color `text-brand-navy-900`.
  5. La fila "Cashback para el club" → "Tu cashback dona" con monto en `text-brand-green-700`.
  6. El botón de pagar: `bg-brand-green-600 hover:bg-brand-green-700`, debajo agregar:

```tsx
        <p className="text-center text-[11px] text-gray-400 flex items-center justify-center gap-1">
          🔒 Pago procesado por Mercado Pago
        </p>
```

  7. Selector de causa: estados activos `border-brand-green-600 bg-brand-green-50`, radio activo `border-brand-green-600 bg-brand-green-600`.

- [ ] **Step 2: `ScanQR.tsx`, `PagoExitoso.tsx`, `PagoFallido.tsx`** — aplicar la tabla de mapeo de Task 5. En `PagoExitoso` el check/acento principal pasa a verde (`text-brand-green-600` / `bg-brand-green-50`); en `PagoFallido` se mantiene el rojo de error pero CTAs en verde.

- [ ] **Step 3: Typecheck.** Expected: exit 0.
- [ ] **Step 4: Visual** — recorrer `/app/scan` → `/app/pagar/<slug-de-seed>` (ver slug con la tienda seed), tipear monto, ver preview de donación en vivo, NO completar el pago real.
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/app/
git commit -m "feat(web): flujo pagar con QR en identidad verde impacto"
```

---

### Task 7: Mi Impacto — MyCausesPage

**Files:**
- Modify: `apps/web/src/pages/causes/MyCausesPage.tsx` (reescritura completa)

- [ ] **Step 1: Reescribir con héroe + agregación por causa + historial**

```tsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, TrendingUp } from 'lucide-react'
import { getProfile, getProfileDonations, type ApiProfile, type ApiDonation } from '../../lib/api'
import ScreenHeader from '../../components/app/ScreenHeader'
import ProgressBar from '../../components/app/ProgressBar'

export default function MyCausesPage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ApiProfile | null>(null)
  const [donations, setDonations] = useState<ApiDonation[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all([getProfile(), getProfileDonations()])
      .then(([prof, dons]) => { if (!cancelled) { setProfile(prof); setDonations(dons) } })
      .catch((err) => console.error('Error cargando impacto:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Total por causa, ordenado descendente. La barra = participación en el total.
  const causeTotals = useMemo(() => {
    const map = new Map<string, { title: string; slug: string | null; total: number }>()
    for (const d of donations) {
      const cur = map.get(d.cause_title) || { title: d.cause_title, slug: d.cause_slug, total: 0 }
      cur.total += parseFloat(d.amount) || 0
      map.set(d.cause_title, cur)
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [donations])

  const total = parseFloat(profile?.total_donated || '0')

  if (loading) {
    return <div className="px-4 py-6 space-y-3">{[0, 1, 2].map((i) =>
      <div key={i} className="h-24 rounded-2xl bg-gray-200/70 animate-pulse" />)}</div>
  }

  return (
    <div>
      <ScreenHeader eyebrow="Tu impacto 💚" title={<span className="text-3xl">${total.toFixed(2)}</span>}>
        <p className="text-xs text-white/70 mt-1">
          donados a {causeTotals.length} causa{causeTotals.length !== 1 ? 's' : ''} · {donations.length} donación{donations.length !== 1 ? 'es' : ''}
        </p>
      </ScreenHeader>

      <div className="px-4 py-4 space-y-4">
        {causeTotals.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-bold mb-1">Todavía no donaste</p>
            <p className="text-gray-400 text-sm mb-5">Escaneá tu primer QR y empezá a generar impacto.</p>
            <Link to="/app/scan" className="inline-block bg-brand-green-600 hover:bg-brand-green-700 text-white
                                            font-bold text-sm px-6 py-3 rounded-xl transition-colors">
              Pagar con QR
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {causeTotals.map((c) => (
                <div key={c.title} className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(10,34,54,0.08)] px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    {c.slug
                      ? <Link to={`/app/causes/${c.slug}`} className="font-extrabold text-brand-navy-900 truncate hover:text-brand-green-700">{c.title}</Link>
                      : <span className="font-extrabold text-brand-navy-900 truncate">{c.title}</span>}
                    <span className="flex-shrink-0 bg-brand-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                      ${c.total.toFixed(2)}
                    </span>
                  </div>
                  <ProgressBar pct={total > 0 ? (c.total / total) * 100 : 0} />
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    {total > 0 ? ((c.total / total) * 100).toFixed(0) : 0}% de todo tu impacto
                  </p>
                </div>
              ))}
            </div>

            <h2 className="font-extrabold text-brand-navy-900 flex items-center gap-1.5 pt-2">
              <TrendingUp size={16} className="text-brand-green-600" /> Últimas donaciones
            </h2>
            <div className="space-y-2">
              {donations.slice(0, 10).map((d) => (
                <div key={d.id} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between gap-3
                                           shadow-[0_1px_4px_rgba(10,34,54,0.06)]">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-brand-navy-900 truncate">{d.store_name}</p>
                    <p className="text-[11px] text-gray-400 truncate">
                      → {d.cause_title} · {new Date(d.created_at).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <span className="flex-shrink-0 font-extrabold text-brand-green-700">
                    +${parseFloat(d.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck.** Expected: exit 0.
- [ ] **Step 3: Visual** — con el consumer seed (tiene compras aprobadas si se usó antes; si está vacío, validar el estado vacío con CTA).
- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/causes/MyCausesPage.tsx
git commit -m "feat(web): Mi Impacto — héroe de total donado, causas y historial"
```

---

### Task 8: Compras y Perfil

**Files:**
- Modify: `apps/web/src/pages/purchases/MyPurchasesPage.tsx`
- Modify: `apps/web/src/pages/profile/ProfilePage.tsx`

- [ ] **Step 1: `MyPurchasesPage.tsx`** — aplicar tabla de mapeo de Task 5. Cada compra como card blanca `rounded-2xl` con tienda + fecha + monto, y tag de estado:

```tsx
const statusTag: Record<string, string> = {
  APPROVED: 'bg-brand-green-50 text-brand-green-700',
  PENDING: 'bg-amber-50 text-amber-700',
  REJECTED: 'bg-red-50 text-red-600',
}
```

(usar con `statusTag[p.status] || statusTag.PENDING` en un `<span className={...} + ' text-xs font-bold px-2 py-0.5 rounded-lg'>`). Título con `<ScreenHeader title="Mis compras" />`.

- [ ] **Step 2: `ProfilePage.tsx`** — mapeo de Task 5 + funcionalidad que perdió el header viejo:
  1. `<ScreenHeader>` navy con avatar (inicial), nombre y email.
  2. Métricas (donado/compras/causas) como tres mini-cards en fila.
  3. Sección "Cuenta" con la edición existente de nombre/usuario.
  4. **Links por rol** (antes vivían en el header): si `getRole()` es `MERCHANT` o `ADMIN`, link "Compras pendientes" → `/app/merchant/purchases`; si es `ADMIN`, link "Panel admin" → `/app/admin/merchants`. Importar `getRole` de `../../lib/role`.
  5. **Botón "Cerrar sesión"** al pie (rojo suave):

```tsx
import { clearTokens } from '../../lib/auth'
import { useNavigate } from 'react-router-dom'
// dentro del componente:
const navigate = useNavigate()
function logout() { clearTokens(); navigate('/login', { replace: true }) }
// al final del JSX:
<button onClick={logout} className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors">
  Cerrar sesión
</button>
```

- [ ] **Step 3: Typecheck.** Expected: exit 0.
- [ ] **Step 4: Visual** — compras con tags de estado; perfil con logout funcionando y links por rol (probar con `admin@example.com / Admin1234!` que aparezcan Admin y Pendientes).
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/purchases/ apps/web/src/pages/profile/
git commit -m "feat(web): compras y perfil restilizados; logout y links por rol en perfil"
```

---

### Task 9: Verificación final, docs y push

**Files:**
- Modify: `docs/DESIGN_BRIEF.md` (nota de actualización)

- [ ] **Step 1: Typecheck final.** Expected: exit 0.
- [ ] **Step 2: Build de producción** (valida Vite + Tailwind purge):

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W)/apps/web:/app" -w /app node:20-alpine sh -c "npm run build"
```
Expected: `✓ built in …` sin errores.

- [ ] **Step 3: Recorrido visual completo** con el stack dev: login consumer → home (feed comercios) → tienda detalle → pagar QR (sin completar pago) → impacto → compras → perfil → logout. Verificar también: viewport desktop (columna centrada), login merchant (link Pendientes), login admin (panel admin sigue usable dentro del shell).
- [ ] **Step 4: Actualizar `docs/DESIGN_BRIEF.md`** — agregar al inicio de la sección 3: "**Actualización 2026-06: la app privada usa la identidad 'Verde impacto'** (navy `#0A2236` + verde `#65A30D`, Nunito, BottomNav con FAB QR, shell de 480px). Ver spec en `docs/superpowers/specs/2026-06-12-rediseno-verde-impacto-design.md`. El sitio público conserva la identidad azul."
- [ ] **Step 5: Commit y push**

```bash
git add docs/DESIGN_BRIEF.md
git commit -m "docs: brief actualizado con identidad verde impacto en app privada"
git push
```
