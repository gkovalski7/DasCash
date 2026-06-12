# Piloto técnico: causa preferida + hosting VPS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar DasCash listo para el piloto: el flujo en caja queda en escanear → monto → pagar (causa preferida preseleccionada) y la app corre en una URL pública HTTPS en un VPS, con webhook de Mercado Pago operativo.

**Architecture:** Fase A agrega `preferred_cause` al usuario (FK a Cause), se setea en el registro o se aprende automáticamente al iniciar un pago, y el frontend la preselecciona en la pantalla de pago. Fase B empaqueta producción: gunicorn + whitenoise para la API, build estático de Vite servido por Caddy (mismo dominio, sin CORS), todo en un `docker-compose.prod.yml` para el VPS.

**Tech Stack:** Django 5/DRF + pytest-django, React/Vite + vitest/testing-library, Docker Compose, Caddy 2 (SSL automático), Mercado Pago Checkout Pro.

**Spec:** `docs/superpowers/specs/2026-06-12-estrategia-piloto-design.html`

**Convenciones de ejecución:**
- Los tests de API corren en Docker: levantar la DB una vez con `docker compose -f infra/docker-compose.yml up -d db`.
- Comando pytest: `docker compose -f infra/docker-compose.yml run --rm api pytest <ruta> -v`
- Comando vitest: `docker compose -f infra/docker-compose.yml run --rm web npx vitest run <ruta>`
- Todos los comandos se ejecutan desde la raíz del repo (`DasCash/`).

---

## Fase A — Feature «causa preferida»

### Task 1: Backend — campo `preferred_cause` en el usuario + exposición en perfil

**Files:**
- Modify: `apps/api/apps/accounts/models.py`
- Modify: `apps/api/apps/accounts/serializers.py`
- Create: `apps/api/apps/accounts/migrations/0002_customuser_preferred_cause.py` (vía makemigrations)
- Test: `apps/api/apps/accounts/tests.py`

- [ ] **Step 1: Write the failing tests**

Agregar al final de `apps/api/apps/accounts/tests.py`. Asegurarse de que estos imports existan al tope del archivo (agregarlos si faltan):

```python
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.causes.models import Cause

User = get_user_model()
```

Tests nuevos:

```python
class PreferredCauseProfileTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="pc@t.com", email="pc@t.com", password="Pass1234!", role="CONSUMER"
        )
        cls.cause = Cause.objects.create(title="Club Test", category="Deporte", is_active=True)
        cls.cause_inactive = Cause.objects.create(title="Inactiva", category="Salud", is_active=False)

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_profile_incluye_preferred_cause_null_por_defecto(self):
        res = self.client.get("/api/profile/")
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.data["preferred_cause"])
        self.assertIsNone(res.data["preferred_cause_title"])

    def test_patch_setea_preferred_cause(self):
        res = self.client.patch(
            "/api/profile/", {"preferred_cause": self.cause.id}, format="json"
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["preferred_cause"], self.cause.id)
        self.assertEqual(res.data["preferred_cause_title"], "Club Test")
        self.user.refresh_from_db()
        self.assertEqual(self.user.preferred_cause_id, self.cause.id)

    def test_patch_acepta_null_para_limpiar(self):
        self.user.preferred_cause = self.cause
        self.user.save(update_fields=["preferred_cause"])
        res = self.client.patch("/api/profile/", {"preferred_cause": None}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.data["preferred_cause"])

    def test_patch_rechaza_causa_inactiva(self):
        res = self.client.patch(
            "/api/profile/", {"preferred_cause": self.cause_inactive.id}, format="json"
        )
        self.assertEqual(res.status_code, 400)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `docker compose -f infra/docker-compose.yml up -d db` (si no está corriendo) y luego
`docker compose -f infra/docker-compose.yml run --rm api pytest apps/accounts/tests.py -v -k PreferredCause`
Expected: FAIL — `FieldError`/`KeyError: 'preferred_cause'` (el campo no existe).

- [ ] **Step 3: Implement — modelo**

En `apps/api/apps/accounts/models.py`, dentro de `CustomUser`, después de `role`:

```python
    preferred_cause = models.ForeignKey(
        "causes.Cause",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="preferred_by",
        help_text="Causa que el usuario apoya por defecto; se preselecciona al pagar.",
    )
```

- [ ] **Step 4: Generate migration**

Run: `docker compose -f infra/docker-compose.yml run --rm api python manage.py makemigrations accounts`
Expected: crea `apps/accounts/migrations/0002_customuser_preferred_cause.py` (el número puede variar; usar el que genere).

- [ ] **Step 5: Implement — serializer**

En `apps/api/apps/accounts/serializers.py`:

Agregar import al tope:

```python
from apps.causes.models import Cause
```

En `ProfileSerializer`, agregar los campos (antes de `class Meta`):

```python
    preferred_cause = serializers.PrimaryKeyRelatedField(
        queryset=Cause.objects.filter(is_active=True),
        allow_null=True,
        required=False,
    )
    preferred_cause_title = serializers.CharField(
        source="preferred_cause.title", read_only=True, default=None
    )
```

Y en `Meta.fields` agregar ambos nombres:

```python
        fields = (
            "id", "email", "username", "first_name", "last_name", "role",
            "preferred_cause", "preferred_cause_title",
            "total_donated", "causes_count", "purchases_count",
        )
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `docker compose -f infra/docker-compose.yml run --rm api pytest apps/accounts/tests.py -v -k PreferredCause`
Expected: 4 PASS.

- [ ] **Step 7: Run the full API suite (no regressions)**

Run: `docker compose -f infra/docker-compose.yml run --rm api pytest -v`
Expected: todo PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/api/apps/accounts/
git commit -m "feat(api): campo preferred_cause en usuario, expuesto en perfil"
```

---

### Task 2: Backend — el registro acepta `preferred_cause`

**Files:**
- Modify: `apps/api/apps/accounts/serializers.py` (RegisterSerializer)
- Test: `apps/api/apps/accounts/tests.py`

- [ ] **Step 1: Write the failing tests**

Agregar al final de `apps/api/apps/accounts/tests.py`:

```python
class RegisterPreferredCauseTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.cause = Cause.objects.create(title="Club Registro", category="Deporte", is_active=True)

    def setUp(self):
        self.client = APIClient()

    def test_registro_con_preferred_cause(self):
        res = self.client.post(
            "/api/auth/register",
            {"email": "nuevo@t.com", "password": "Pass1234!", "preferred_cause": self.cause.id},
            format="json",
        )
        self.assertIn(res.status_code, (200, 201))
        user = User.objects.get(email="nuevo@t.com")
        self.assertEqual(user.preferred_cause_id, self.cause.id)

    def test_registro_sin_preferred_cause_sigue_funcionando(self):
        res = self.client.post(
            "/api/auth/register",
            {"email": "n2@t.com", "password": "Pass1234!"},
            format="json",
        )
        self.assertIn(res.status_code, (200, 201))
        self.assertIsNone(User.objects.get(email="n2@t.com").preferred_cause)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `docker compose -f infra/docker-compose.yml run --rm api pytest apps/accounts/tests.py -v -k RegisterPreferred`
Expected: `test_registro_con_preferred_cause` FAIL (el serializer ignora el campo → queda None). El segundo puede pasar ya.

- [ ] **Step 3: Implement**

En `RegisterSerializer` (`apps/api/apps/accounts/serializers.py`), agregar el campo (junto a `role`):

```python
    preferred_cause = serializers.PrimaryKeyRelatedField(
        queryset=Cause.objects.filter(is_active=True),
        allow_null=True,
        required=False,
    )
```

Y en `Meta.fields`:

```python
        fields = ("id", "email", "username", "password", "role", "preferred_cause")
```

No hace falta tocar `create()`: `preferred_cause` es un campo del modelo y `User(**validated_data)` lo asigna.

- [ ] **Step 4: Run tests to verify they pass**

Run: `docker compose -f infra/docker-compose.yml run --rm api pytest apps/accounts/tests.py -v -k RegisterPreferred`
Expected: 2 PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/apps/accounts/
git commit -m "feat(api): registro acepta causa preferida"
```

---

### Task 3: Backend — iniciar un pago aprende la causa elegida

**Files:**
- Modify: `apps/api/apps/cashback/payment_views.py` (InitiateQRPaymentView.post)
- Test: `apps/api/apps/cashback/tests.py`

- [ ] **Step 1: Write the failing test**

Agregar al final de `apps/api/apps/cashback/tests.py` (el archivo ya tiene `BaseTestCase` con `consumer`, `store` con slug `ts-1`, `cause_a`, y ya importa `patch`, `APIClient`):

```python
class PaymentLearnsPreferredCauseTests(BaseTestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.consumer)

    @patch("apps.cashback.payment_views.MercadoPagoService")
    def test_initiate_actualiza_preferred_cause_del_usuario(self, mock_mp):
        mock_mp.return_value.create_checkout_preference.return_value = {
            "preference_id": "pref-test-1",
            "checkout_url": "https://mp.test/checkout/pref-test-1",
        }
        res = self.client.post(
            "/api/cashback/payments/initiate/",
            {
                "store_slug": self.store.qrcode_slug,
                "amount": 1000,
                "selected_cause_id": self.cause_a.id,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.consumer.refresh_from_db()
        self.assertEqual(self.consumer.preferred_cause_id, self.cause_a.id)

    @patch("apps.cashback.payment_views.MercadoPagoService")
    def test_initiate_sin_causa_no_pisa_la_preferida(self, mock_mp):
        mock_mp.return_value.create_checkout_preference.return_value = {
            "preference_id": "pref-test-2",
            "checkout_url": "https://mp.test/checkout/pref-test-2",
        }
        self.consumer.preferred_cause = self.cause_b
        self.consumer.save(update_fields=["preferred_cause"])
        res = self.client.post(
            "/api/cashback/payments/initiate/",
            {"store_slug": self.store.qrcode_slug, "amount": 500},
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.consumer.refresh_from_db()
        self.assertEqual(self.consumer.preferred_cause_id, self.cause_b.id)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `docker compose -f infra/docker-compose.yml run --rm api pytest apps/cashback/tests.py -v -k LearnsPreferred`
Expected: el primero FAIL (`preferred_cause_id` queda None); el segundo puede pasar ya.

- [ ] **Step 3: Implement**

En `apps/api/apps/cashback/payment_views.py`, dentro de `InitiateQRPaymentView.post`, inmediatamente después del bloque `purchase = Purchase.objects.create(...)`:

```python
        # La causa elegida al pagar se vuelve la preferida del usuario
        # (preselección en el próximo pago).
        if cause and request.user.preferred_cause_id != cause.id:
            request.user.preferred_cause = cause
            request.user.save(update_fields=["preferred_cause"])
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `docker compose -f infra/docker-compose.yml run --rm api pytest apps/cashback/tests.py -v`
Expected: todo PASS (los nuevos y los existentes).

- [ ] **Step 5: Commit**

```bash
git add apps/api/apps/cashback/
git commit -m "feat(api): iniciar pago aprende la causa preferida del usuario"
```

---

### Task 4: Web — PagarComercio preselecciona la causa preferida

**Files:**
- Modify: `apps/web/src/lib/api.ts` (tipo ApiProfile + patchProfile)
- Modify: `apps/web/src/pages/app/PagarComercio.tsx`
- Test: `apps/web/src/pages/app/PagarComercio.test.tsx` (nuevo)

- [ ] **Step 1: Write the failing test**

Crear `apps/web/src/pages/app/PagarComercio.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PagarComercio from './PagarComercio'
import { get, getProfile } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  getProfile: vi.fn(),
}))

const storeData = {
  id: 1,
  name: 'Súper Test',
  address: 'Calle 1',
  description: '',
  logo_url: '',
  cashback_percentage: '5.00',
  supported_causes: [
    { id: 10, title: 'Club Deportivo', slug: 'club', image_url: '', category: 'Deporte' },
    { id: 20, title: 'Básquet de Base', slug: 'basquet', image_url: '', category: 'Deporte' },
  ],
}

function renderPagar() {
  return render(
    <MemoryRouter initialEntries={['/app/pagar/super-test']}>
      <Routes>
        <Route path="/app/pagar/:slug" element={<PagarComercio />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PagarComercio — causa preferida', () => {
  beforeEach(() => {
    vi.mocked(get).mockResolvedValue(storeData)
  })

  it('preselecciona la causa preferida del usuario si la tienda la soporta', async () => {
    vi.mocked(getProfile).mockResolvedValue({ preferred_cause: 20 } as any)
    renderPagar()
    const btn = await screen.findByRole('button', { name: /Básquet de Base/ })
    expect(btn.getAttribute('aria-pressed')).toBe('true')
  })

  it('cae a la primera causa cuando no hay preferida', async () => {
    vi.mocked(getProfile).mockResolvedValue({ preferred_cause: null } as any)
    renderPagar()
    const btn = await screen.findByRole('button', { name: /Club Deportivo/ })
    expect(btn.getAttribute('aria-pressed')).toBe('true')
  })

  it('cae a la primera causa si el perfil falla (no bloquea el pago)', async () => {
    vi.mocked(getProfile).mockRejectedValue(new Error('401'))
    renderPagar()
    const btn = await screen.findByRole('button', { name: /Club Deportivo/ })
    expect(btn.getAttribute('aria-pressed')).toBe('true')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `docker compose -f infra/docker-compose.yml run --rm web npx vitest run src/pages/app/PagarComercio.test.tsx`
Expected: FAIL — `aria-pressed` es null (el atributo no existe todavía) y `getProfile` no se usa.

- [ ] **Step 3: Implement — tipos en api.ts**

En `apps/web/src/lib/api.ts`, en el type `ApiProfile`, agregar después de `role: string`:

```ts
  preferred_cause: number | null
  preferred_cause_title: string | null
```

Y ampliar `patchProfile`:

```ts
export function patchProfile(
  data: Partial<Pick<ApiProfile, 'username' | 'first_name' | 'last_name' | 'preferred_cause'>>
): Promise<ApiProfile> {
  return patch<ApiProfile>('/api/profile/', data)
}
```

- [ ] **Step 4: Implement — PagarComercio**

En `apps/web/src/pages/app/PagarComercio.tsx`:

1. Cambiar el import de api:

```tsx
import { get, post, getProfile } from '../../lib/api'
```

2. Reemplazar el `useEffect` de carga por:

```tsx
  useEffect(() => {
    if (!slug) return
    Promise.all([
      get<StoreInfo>(`/api/commerce/stores/by-slug/${slug}/`),
      getProfile().catch(() => null),
    ])
      .then(([data, profile]) => {
        setStore(data)
        if (data.supported_causes.length > 0) {
          const preferred = profile?.preferred_cause
            ? data.supported_causes.find((c) => c.id === profile.preferred_cause)
            : undefined
          setSelectedCauseId((preferred ?? data.supported_causes[0]).id)
        }
        setPageState('ready')
      })
      .catch(() => setPageState('not_found'))
  }, [slug])
```

3. En el botón de causa (el `<button>` dentro de `store.supported_causes.map`), agregar el atributo `aria-pressed` junto a `onClick`:

```tsx
                  aria-pressed={selectedCauseId === cause.id}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `docker compose -f infra/docker-compose.yml run --rm web npx vitest run src/pages/app/PagarComercio.test.tsx`
Expected: 3 PASS.

- [ ] **Step 6: Run the full web suite (no regressions)**

Run: `docker compose -f infra/docker-compose.yml run --rm web npm test`
Expected: todo PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/pages/app/
git commit -m "feat(web): pagar preselecciona la causa preferida del usuario"
```

---

### Task 5: Web — selector de causa (opcional) en el registro

**Files:**
- Modify: `apps/web/src/pages/signup.tsx`
- Test: `apps/web/src/pages/signup.test.tsx` (nuevo)

- [ ] **Step 1: Write the failing test**

Crear `apps/web/src/pages/signup.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import SignupPage from './signup'
import { post, fetchCauses } from '../lib/api'

vi.mock('../lib/api', () => ({
  post: vi.fn(),
  fetchCauses: vi.fn(),
}))

const causes = [
  { id: 10, title: 'Club Deportivo', slug: 'club', category: 'Deporte' },
  { id: 20, title: 'Escuela 12', slug: 'escuela-12', category: 'Educación' },
]

async function fillAndSubmit() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email'), 'nuevo@test.com')
  await user.type(screen.getByLabelText('Contraseña'), 'password123')
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'password123')
  return user
}

describe('SignupPage — causa preferida', () => {
  beforeEach(() => {
    vi.mocked(fetchCauses).mockResolvedValue(causes as any)
    vi.mocked(post).mockResolvedValue({})
  })

  it('envía preferred_cause cuando se elige una causa', async () => {
    render(<MemoryRouter><SignupPage /></MemoryRouter>)
    const user = await fillAndSubmit()
    await user.click(await screen.findByRole('button', { name: /Club Deportivo/ }))
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(post).toHaveBeenCalledWith(
      '/api/auth/register',
      expect.objectContaining({ preferred_cause: 10 })
    )
  })

  it('no envía preferred_cause cuando no se elige ninguna', async () => {
    render(<MemoryRouter><SignupPage /></MemoryRouter>)
    const user = await fillAndSubmit()
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    const body = vi.mocked(post).mock.calls[0][1] as Record<string, unknown>
    expect(body).not.toHaveProperty('preferred_cause')
  })

  it('el registro funciona aunque las causas no carguen', async () => {
    vi.mocked(fetchCauses).mockRejectedValue(new Error('network'))
    render(<MemoryRouter><SignupPage /></MemoryRouter>)
    const user = await fillAndSubmit()
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(post).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `docker compose -f infra/docker-compose.yml run --rm web npx vitest run src/pages/signup.test.tsx`
Expected: FAIL — no existe el botón de causa y `post` se llama sin `preferred_cause`.

- [ ] **Step 3: Implement**

En `apps/web/src/pages/signup.tsx`:

1. Imports:

```tsx
import React, { useEffect, useState } from 'react'
import { post, fetchCauses, type ApiCause } from '../lib/api'
```

2. Estado nuevo (junto a los otros `useState`):

```tsx
    const [causes, setCauses] = useState<ApiCause[]>([])
    const [preferredCauseId, setPreferredCauseId] = useState<number | null>(null)

    useEffect(() => {
        fetchCauses().then(setCauses).catch(() => setCauses([]))
    }, [])
```

3. En `onSubmit`, reemplazar la llamada a `post` por:

```tsx
            await post('/api/auth/register', {
                email,
                username: email,
                password,
                role: 'CONSUMER',
                ...(preferredCauseId !== null ? { preferred_cause: preferredCauseId } : {}),
            })
```

4. En el JSX, después del `<div>` del campo "Confirmar contraseña" y antes del `<Button>`:

```tsx
                    {causes.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ¿Qué causa querés apoyar? <span className="text-gray-400">(opcional)</span>
                            </label>
                            <div className="space-y-2">
                                {causes.map((c) => (
                                    <button
                                        type="button"
                                        key={c.id}
                                        onClick={() =>
                                            setPreferredCauseId(preferredCauseId === c.id ? null : c.id)
                                        }
                                        aria-pressed={preferredCauseId === c.id}
                                        className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                                            preferredCauseId === c.id
                                                ? 'border-green-600 bg-green-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    >
                                        <span className="text-sm font-medium text-gray-900">{c.title}</span>
                                        <span className="text-xs text-gray-500 ml-2">{c.category}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `docker compose -f infra/docker-compose.yml run --rm web npx vitest run src/pages/signup.test.tsx`
Expected: 3 PASS.

- [ ] **Step 5: Run the full web suite (login.test.tsx usa SignupPage — verificar que no se rompa)**

Run: `docker compose -f infra/docker-compose.yml run --rm web npm test`
Expected: todo PASS. (Nota: `login.test.tsx` renderiza SignupPage sin mockear `fetchCauses` — el mock de ese archivo solo define `post`. Si falla con "fetchCauses is not a function", agregar `fetchCauses: vi.fn().mockResolvedValue([])` al `vi.mock('../lib/api', ...)` de `login.test.tsx`.)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/
git commit -m "feat(web): registro con seleccion opcional de causa preferida"
```

---

## Fase B — Hosting en VPS

### Task 6: API lista para producción — whitenoise para estáticos del admin

**Files:**
- Modify: `apps/api/requirements.txt`
- Modify: `apps/api/core/settings.py`

- [ ] **Step 1: Agregar dependencia**

En `apps/api/requirements.txt`, después de `gunicorn>=22.0`:

```
whitenoise>=6.7
```

- [ ] **Step 2: Configurar middleware y storage**

En `apps/api/core/settings.py`:

1. En `MIDDLEWARE`, insertar como segundo elemento (inmediatamente después de `"django.middleware.security.SecurityMiddleware"`):

```python
    "whitenoise.middleware.WhiteNoiseMiddleware",
```

2. Después de la línea `STATIC_ROOT = BASE_DIR / "staticfiles"`:

```python
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}
```

- [ ] **Step 3: Rebuild y verificar collectstatic + suite**

Run:
```bash
docker compose -f infra/docker-compose.yml build api
docker compose -f infra/docker-compose.yml run --rm api sh -c "python manage.py collectstatic --noinput && pytest -q"
```
Expected: `X static files copied to '/app/staticfiles'` y la suite PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/api/requirements.txt apps/api/core/settings.py
git commit -m "feat(api): whitenoise para servir estaticos del admin en produccion"
```

---

### Task 7: Build de producción del frontend + Caddy

**Files:**
- Create: `apps/web/Dockerfile.prod`
- Create: `infra/Caddyfile`

- [ ] **Step 1: Dockerfile de producción del web**

Crear `apps/web/Dockerfile.prod`:

```dockerfile
# Build estático de la SPA + Caddy como server y reverse proxy
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=optional || npm install --omit=optional
COPY . .
# VITE_API_URL="" → la SPA llama a la API same-origin (Caddy la proxea)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv
```

- [ ] **Step 2: Caddyfile**

Crear `infra/Caddyfile`:

```
{$SITE_ADDRESS}

encode gzip

handle /api/* {
	reverse_proxy api:8000
}

handle /admin/* {
	reverse_proxy api:8000
}

handle /static/* {
	reverse_proxy api:8000
}

handle {
	root * /srv
	try_files {path} /index.html
	file_server
}
```

(Con `SITE_ADDRESS=midominio.com` Caddy emite el certificado HTTPS automáticamente vía Let's Encrypt; con `SITE_ADDRESS=:80` sirve HTTP plano para smoke test local.)

**Nota:** `env.apiUrl` (en `apps/web/src/lib/env.ts`) lee `VITE_API_URL`; el comentario en `apps/web/src/lib/api.ts:4` ya documenta que `''` significa same-origin. No hay que tocar código del frontend.

- [ ] **Step 3: Verificar que el build compila**

Run: `docker build -f apps/web/Dockerfile.prod -t dascash-web-prod apps/web`
Expected: build exitoso (tsc + vite build sin errores).

- [ ] **Step 4: Commit**

```bash
git add apps/web/Dockerfile.prod infra/Caddyfile
git commit -m "feat(infra): build estatico del web + Caddy con SSL automatico"
```

---

### Task 8: docker-compose de producción + plantilla de variables

**Files:**
- Create: `infra/docker-compose.prod.yml`
- Create: `infra/.env.prod.example`
- Modify: `.gitignore` (ignorar `infra/.env.prod`)

- [ ] **Step 1: Compose de producción**

Crear `infra/docker-compose.prod.yml`:

```yaml
services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER"]
      interval: 5s
      timeout: 5s
      retries: 10
    volumes:
      - db_data_prod:/var/lib/postgresql/data

  api:
    build: ../apps/api
    restart: unless-stopped
    environment:
      DJANGO_SECRET_KEY: ${DJANGO_SECRET_KEY}
      DJANGO_DEBUG: "0"
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_HOST: db
      POSTGRES_PORT: 5432
      ALLOWED_HOSTS: ${DOMAIN},api,localhost
      CORS_ALLOWED_ORIGINS: https://${DOMAIN}
      LOAD_SEEDS: "false"
      EMAIL_BACKEND: ${EMAIL_BACKEND}
      EMAIL_HOST_USER: ${EMAIL_HOST_USER}
      EMAIL_HOST_PASSWORD: ${EMAIL_HOST_PASSWORD}
      DEFAULT_FROM_EMAIL: ${DEFAULT_FROM_EMAIL}
      MP_ACCESS_TOKEN: ${MP_ACCESS_TOKEN}
      MP_WEBHOOK_SECRET: ${MP_WEBHOOK_SECRET}
      MP_SANDBOX: ${MP_SANDBOX}
      BACKEND_BASE_URL: ${PUBLIC_URL}
      FRONTEND_BASE_URL: ${PUBLIC_URL}
      FRONTEND_URL: ${PUBLIC_URL}
      SECURE_SSL_REDIRECT: "0"
    depends_on:
      db:
        condition: service_healthy
    command: >
      sh -c "python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 60"

  web:
    build:
      context: ../apps/web
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    environment:
      SITE_ADDRESS: ${SITE_ADDRESS}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - api

volumes:
  db_data_prod:
  caddy_data:
  caddy_config:
```

(`SECURE_SSL_REDIRECT: "0"` porque Caddy ya redirige http→https; activarlo en Django causaría loop detrás del proxy.)

- [ ] **Step 2: Plantilla de variables**

Crear `infra/.env.prod.example`:

```bash
# ── Dominio ──────────────────────────────────────────────
# DOMAIN: hostname público (sin protocolo). SITE_ADDRESS: lo que escucha Caddy.
# Producción: DOMAIN=app.midominio.com.ar / SITE_ADDRESS=app.midominio.com.ar / PUBLIC_URL=https://app.midominio.com.ar
# Smoke local:  DOMAIN=localhost / SITE_ADDRESS=:80 / PUBLIC_URL=http://localhost
DOMAIN=app.midominio.com.ar
SITE_ADDRESS=app.midominio.com.ar
PUBLIC_URL=https://app.midominio.com.ar

# ── Django ───────────────────────────────────────────────
# Generar con: python -c "import secrets; print(secrets.token_urlsafe(50))"
DJANGO_SECRET_KEY=cambiame

# ── Postgres ─────────────────────────────────────────────
POSTGRES_USER=cashback
POSTGRES_PASSWORD=cambiame
POSTGRES_DB=cashback

# ── Mercado Pago ─────────────────────────────────────────
# Producción: credenciales de la aplicación MP en modo producción (APP_USR-...)
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=
MP_SANDBOX=false

# ── Email (opcional durante el piloto) ───────────────────
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=DasCash <noreply@dascash.com>
```

- [ ] **Step 3: Ignorar el .env real**

En `.gitignore` (raíz del repo), agregar la línea:

```
infra/.env.prod
```

- [ ] **Step 4: Validar la sintaxis del compose**

Run: `docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod.example config --quiet`
Expected: sin errores (exit 0).

- [ ] **Step 5: Commit**

```bash
git add infra/docker-compose.prod.yml infra/.env.prod.example .gitignore
git commit -m "feat(infra): stack de produccion (gunicorn + caddy) para VPS"
```

---

### Task 9: Smoke test local del stack de producción

**Files:**
- Create: `infra/.env.prod` (local, NO se commitea)

- [ ] **Step 1: Crear env local de prueba**

```bash
cp infra/.env.prod.example infra/.env.prod
```

Editar `infra/.env.prod` con valores de smoke local:

```bash
DOMAIN=localhost
SITE_ADDRESS=:80
PUBLIC_URL=http://localhost
DJANGO_SECRET_KEY=solo-para-smoke-local
POSTGRES_PASSWORD=smoke-local
MP_ACCESS_TOKEN=TEST-xxx   # el token de test de MP que ya usás en dev
MP_SANDBOX=true
```

- [ ] **Step 2: Bajar el stack de dev (libera el puerto 5432/8000) y levantar prod**

```bash
docker compose -f infra/docker-compose.yml down
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod up -d --build
```

Expected: 3 contenedores arriba (db, api, web).

- [ ] **Step 3: Smoke checks**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost/            # → 200 (SPA)
curl -s http://localhost/api/causes/                                # → [] (JSON vacío, LOAD_SEEDS=false)
curl -s -o /dev/null -w "%{http_code}" http://localhost/admin/login/ # → 200 (admin con CSS)
curl -s -o /dev/null -w "%{http_code}" http://localhost/app/home     # → 200 (SPA fallback try_files)
```

Expected: los códigos indicados. Si `/admin/login/` devuelve 500, revisar que `collectstatic` haya corrido (logs del contenedor api).

- [ ] **Step 4: Bajar el stack prod local**

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod down
```

- [ ] **Step 5: Commit (solo si hubo fixes de los pasos anteriores)**

```bash
git add -A
git commit -m "fix(infra): ajustes del stack de produccion tras smoke local"
```

---

### Task 10: Deploy al VPS — checklist operativo

**Files:** ninguno en el repo (operaciones en el VPS y paneles externos). Pasos manuales de German, en orden:

- [ ] **Step 1: Contratar VPS y dominio**

- VPS: Ubuntu 24.04, mínimo 2 GB RAM / 1 vCPU. Proveedores en pesos: DonWeb Cloud, Hostinger (paga en ARS con tarjeta local). Anotar la IP pública.
- Dominio: registrar (`.com.ar` vía nic.ar con clave fiscal, o un `.com`). Crear registro DNS **A**: `app.midominio.com.ar → IP del VPS`. Esperar propagación (verificar con `nslookup app.midominio.com.ar`).

- [ ] **Step 2: Preparar el VPS**

```bash
ssh root@IP_DEL_VPS
curl -fsSL https://get.docker.com | sh
git clone https://github.com/TU_USUARIO/DasCash.git /opt/dascash
cd /opt/dascash
```

(Si el repo es privado: crear un token de GitHub con scope `repo` y clonar con `https://TOKEN@github.com/...`.)

- [ ] **Step 3: Configurar variables de producción**

```bash
cp infra/.env.prod.example infra/.env.prod
python3 -c "import secrets; print(secrets.token_urlsafe(50))"   # → DJANGO_SECRET_KEY
nano infra/.env.prod
```

Completar: DOMAIN/SITE_ADDRESS/PUBLIC_URL con el dominio real, SECRET_KEY generada, password fuerte de Postgres. MP queda en test por ahora (paso 6).

- [ ] **Step 4: Levantar**

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod up -d --build
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod exec api python manage.py createsuperuser
```

- [ ] **Step 5: Verificar HTTPS**

Abrir `https://app.midominio.com.ar` → la landing carga con candado (Caddy emitió el certificado solo). `https://.../admin/` → login del admin de Django con estilos.

- [ ] **Step 6: Mercado Pago a producción**

1. En el panel de desarrolladores de MP, activar las **credenciales de producción** de la aplicación (requiere completar los datos de homologación).
2. En `infra/.env.prod`: `MP_ACCESS_TOKEN=APP_USR-...`, `MP_SANDBOX=false`.
3. En el panel MP → Webhooks: URL `https://app.midominio.com.ar/api/cashback/webhooks/mercadopago/`, evento "Pagos". Copiar la **clave secreta** del webhook → `MP_WEBHOOK_SECRET` en `.env.prod`.
4. `docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod up -d api` (recrea la api con las vars nuevas).

- [ ] **Step 7: Cargar los datos reales del piloto**

Desde `https://app.midominio.com.ar` logueado como admin, en el panel `/app/admin`:
1. Crear el merchant del supermercado (usuario + entidad).
2. Crear la store con su `qrcode_slug` (ej: `super-de-pedro`).
3. Crear la causa del club (título, foto, categoría Deporte).
4. Asignar la causa a la store y crear la campaña con el % acordado y fechas del piloto.

- [ ] **Step 8: Generar e imprimir el QR**

Con un token de admin (login → copiar access token), pedir:

```bash
curl -s https://app.midominio.com.ar/api/commerce/stores/1/qr/ -H "Authorization: Bearer TOKEN"
```

El campo `qr_image` es un data-URL base64 → guardarlo como PNG e imprimir el cartel para la caja. Verificar antes que `payment_url` apunte al dominio público.

- [ ] **Step 9: Prueba end-to-end con plata real**

Compra real chica ($100) escaneando el QR impreso con un celular: registro → pago MP → volver a la app → verificar en Mi Impacto que figura la donación, y en el admin que la Purchase está APPROVED con su CashbackTransaction. **Esto cierra el prerequisito técnico del piloto.**

---

## Self-review (hecho al escribir el plan)

- **Cobertura del spec:** el spec pide para semanas 1-2: hosting público ✔ (Tasks 6-10) y «causa preferida» para que la caja sea escanear → monto → pagar ✔ (Tasks 1-5: registro con causa + aprendizaje al pagar + preselección). La métrica «tiempo de pago en caja» queda medible a mano (sin instrumentación extra — YAGNI).
- **Sin placeholders:** todos los pasos tienen código o comandos completos.
- **Consistencia de tipos:** `preferred_cause` (number|null en TS, FK nullable en Django) y `preferred_cause_title` usados con el mismo nombre en serializers, api.ts y tests.
- **Nota MP_SANDBOX:** el flag existe en settings y compose; el deploy lo pone en `false` recién en Task 10 Step 6, tras homologación.
