# Pilar 3 — Transparencia real + meta colectiva — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el usuario vea el impacto real y confirmado de su compra y que ese aporte se acumule en una meta colectiva (barra de progreso) por causa, visible post-pago y en el detalle de causa.

**Architecture:** Modelo `Goal` nuevo en la app `cashback` con progreso **calculado** (no almacenado) sumando los `CashbackTransaction` de la causa desde `starts_at` — la existencia del `CashbackTransaction` ya implica pago confirmado, así que no se filtra por status. Un endpoint `impact/` permite a la pantalla de éxito reconciliar el estimado optimista contra el dato real cuando llega el webhook. El frontend agrega un componente `GoalProgress` reutilizable.

**Tech Stack:** Django 5/DRF + pytest-django, React/Vite + vitest/testing-library, Docker.

**Spec:** `docs/superpowers/specs/2026-06-13-pilar3-transparencia-meta-colectiva-design.md`

**Convenciones de ejecución (mismas que el plan anterior):**
- DB de tests: `docker compose -f infra/docker-compose.yml up -d db` (una vez).
- pytest: `docker compose -f infra/docker-compose.yml run --rm api pytest <ruta> -v`
- vitest: la imagen `web` del compose puede estar cacheada como prod (nginx, sin npm). Si `docker compose run --rm web npx vitest ...` falla con `npm not found`, usar un node limpio:
  `docker run --rm -v "$PWD/apps/web:/app" -w /app node:20-alpine sh -c "npm ci --no-audit --no-fund --loglevel=error && npx vitest run <ruta>"`
- Todos los comandos desde la raíz del repo.

---

## File structure

**Backend (app `cashback`):**
- `apps/api/apps/cashback/models.py` — agrega `Goal` (+ properties `current_amount`, `percent`) y helper `active_goal_for`.
- `apps/api/apps/cashback/serializers.py` — agrega `GoalSerializer`.
- `apps/api/apps/cashback/views.py` — agrega action `impact` a `PurchaseViewSet`.
- `apps/api/apps/cashback/admin.py` — registra `Goal`.
- `apps/api/apps/cashback/migrations/000X_goal.py` — generada por makemigrations.
- `apps/api/apps/cashback/tests.py` — tests de modelo + endpoint.

**Backend (app `causes`):**
- `apps/api/apps/causes/serializers.py` — agrega `active_goal` (import function-local de `cashback`).
- `apps/api/apps/causes/tests.py` — test del campo `active_goal`.

**Frontend:**
- `apps/web/src/lib/api.ts` — tipos `ApiGoal`, `PurchaseImpact`; función `getPurchaseImpact`; extiende `ApiCause` con `active_goal`.
- `apps/web/src/components/GoalProgress.tsx` — componente nuevo (barra reutilizable).
- `apps/web/src/components/GoalProgress.test.tsx` — test del componente.
- `apps/web/src/pages/app/PagoExitoso.tsx` — reconciliación optimista + barra.
- `apps/web/src/pages/app/PagoExitoso.test.tsx` — test de reconciliación.
- `apps/web/src/pages/causes/CauseDetailPage.tsx` — muestra la barra desde `active_goal`.

---

## Task 1: Backend — modelo `Goal` + progreso calculado + helper

**Files:**
- Modify: `apps/api/apps/cashback/models.py`
- Modify: `apps/api/apps/cashback/admin.py`
- Create: migración (vía makemigrations)
- Test: `apps/api/apps/cashback/tests.py`

- [ ] **Step 1: Write the failing tests**

Agregar al final de `apps/api/apps/cashback/tests.py`. El archivo ya tiene `BaseTestCase` (con `consumer`, `store`, `cause_a`, `cause_b`), e importa `Decimal`, `timedelta`, `timezone`, `Purchase`, `CashbackTransaction`. Verificar esos imports al tope y agregar `Goal` y `active_goal_for` al import de modelos (`from apps.cashback.models import ... , Goal, active_goal_for`).

```python
class GoalModelTests(BaseTestCase):
    def _cashback(self, cause, amount, created_offset_days=0):
        """Crea una Purchase + CashbackTransaction para `cause`."""
        p = Purchase.objects.create(
            user=self.consumer, store=self.store, amount=Decimal("1000"),
            source="QR", status="APPROVED", selected_cause=cause,
        )
        if created_offset_days:
            new_dt = timezone.now() + timedelta(days=created_offset_days)
            Purchase.objects.filter(pk=p.pk).update(created_at=new_dt)
        return CashbackTransaction.objects.create(
            user=self.consumer, purchase=p, cause=cause,
            percentage=Decimal("5"), amount=Decimal(str(amount)),
        )

    def test_current_amount_suma_cashback_de_la_causa(self):
        goal = Goal.objects.create(
            cause=self.cause_a, title="Camisetas", target_amount=Decimal("1000"),
            starts_at=timezone.now() - timedelta(days=1),
        )
        self._cashback(self.cause_a, "50")
        self._cashback(self.cause_a, "30")
        self._cashback(self.cause_b, "999")  # otra causa, no cuenta
        self.assertEqual(goal.current_amount, Decimal("80.00"))

    def test_current_amount_acotado_por_starts_at(self):
        # meta arranca mañana; una compra de hoy NO debe contar
        goal = Goal.objects.create(
            cause=self.cause_a, title="M", target_amount=Decimal("1000"),
            starts_at=timezone.now() + timedelta(days=1),
        )
        self._cashback(self.cause_a, "50")
        self.assertEqual(goal.current_amount, Decimal("0.00"))

    def test_percent_calcula_y_capa_a_100(self):
        goal = Goal.objects.create(
            cause=self.cause_a, title="M", target_amount=Decimal("100"),
            starts_at=timezone.now() - timedelta(days=1),
        )
        self._cashback(self.cause_a, "25")
        self.assertEqual(goal.percent, 25)
        self._cashback(self.cause_a, "200")  # total 225 > 100
        self.assertEqual(goal.percent, 100)

    def test_percent_cero_si_target_cero(self):
        goal = Goal.objects.create(
            cause=self.cause_a, title="M", target_amount=Decimal("0"),
            starts_at=timezone.now() - timedelta(days=1),
        )
        self.assertEqual(goal.percent, 0)

    def test_active_goal_for_devuelve_la_activa_mas_reciente(self):
        Goal.objects.create(
            cause=self.cause_a, title="vieja", target_amount=Decimal("100"),
            active=True, starts_at=timezone.now() - timedelta(days=10),
        )
        nueva = Goal.objects.create(
            cause=self.cause_a, title="nueva", target_amount=Decimal("100"),
            active=True, starts_at=timezone.now() - timedelta(days=1),
        )
        self.assertEqual(active_goal_for(self.cause_a), nueva)

    def test_active_goal_for_none_si_no_hay_activa(self):
        Goal.objects.create(
            cause=self.cause_a, title="inactiva", target_amount=Decimal("100"),
            active=False, starts_at=timezone.now() - timedelta(days=1),
        )
        self.assertIsNone(active_goal_for(self.cause_a))
```

Si `timedelta` o `timezone` no estuvieran importados en el archivo, agregar al tope: `from datetime import timedelta` y `from django.utils import timezone`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `docker compose -f infra/docker-compose.yml up -d db` y luego
`docker compose -f infra/docker-compose.yml run --rm api pytest apps/cashback/tests.py -v -k "GoalModel"`
Expected: ImportError / no se puede importar `Goal` ni `active_goal_for`.

- [ ] **Step 3: Implement — modelo y helper**

En `apps/api/apps/cashback/models.py`, asegurar imports al tope (agregar los que falten):

```python
from decimal import Decimal
from django.utils import timezone
```

(`from django.db import models` ya está.) Al **final** del archivo (después de `MPPaymentData`, para que `CashbackTransaction` ya esté definido):

```python
class Goal(models.Model):
    cause = models.ForeignKey(
        "causes.Cause", on_delete=models.CASCADE, related_name="goals"
    )
    title = models.CharField(max_length=200)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    active = models.BooleanField(default=True)
    starts_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.title} ({self.cause.title})"

    @property
    def current_amount(self) -> Decimal:
        total = CashbackTransaction.objects.filter(
            cause=self.cause,
            purchase__created_at__gte=self.starts_at,
        ).aggregate(s=models.Sum("amount"))["s"]
        return (total or Decimal("0")).quantize(Decimal("0.01"))

    @property
    def percent(self) -> int:
        if self.target_amount <= 0:
            return 0
        raw = (self.current_amount / self.target_amount) * 100
        return min(int(raw), 100)


def active_goal_for(cause):
    """Meta activa más reciente de una causa, o None."""
    return cause.goals.filter(active=True).order_by("-starts_at").first()
```

- [ ] **Step 4: Implement — admin**

En `apps/api/apps/cashback/admin.py`, agregar al import de modelos `Goal` y registrar:

```python
from .models import Campaign, CampaignStore, Purchase, CashbackTransaction, ReceiptUpload, Goal


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "cause", "target_amount", "active", "starts_at")
    list_filter = ("active", "cause")
```

- [ ] **Step 5: Generar migración**

Run: `docker compose -f infra/docker-compose.yml run --rm api python manage.py makemigrations cashback`
Expected: crea `apps/cashback/migrations/000X_goal.py` (número según el estado; usar el que genere).

- [ ] **Step 6: Run tests to verify they pass**

Run: `docker compose -f infra/docker-compose.yml run --rm api pytest apps/cashback/tests.py -v -k "GoalModel"`
Expected: 6 PASS.

- [ ] **Step 7: Run the full API suite (no regressions)**

Run: `docker compose -f infra/docker-compose.yml run --rm api pytest -q`
Expected: todo PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/api/apps/cashback/
git commit -m "feat(api): modelo Goal con progreso calculado + helper active_goal_for"
```

---

## Task 2: Backend — `GoalSerializer` + endpoint `impact`

**Files:**
- Modify: `apps/api/apps/cashback/serializers.py`
- Modify: `apps/api/apps/cashback/views.py`
- Test: `apps/api/apps/cashback/tests.py`

- [ ] **Step 1: Write the failing tests**

Agregar al final de `apps/api/apps/cashback/tests.py` (usa `APIClient`, ya importado en el archivo):

```python
class ImpactEndpointTests(BaseTestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.consumer)
        self.purchase = Purchase.objects.create(
            user=self.consumer, store=self.store, amount=Decimal("1500"),
            source="QR", status="PENDING", selected_cause=self.cause_a,
        )

    def _url(self, pk):
        return f"/api/cashback/purchases/{pk}/impact/"

    def test_impact_sin_cashback_devuelve_contribution_null(self):
        res = self.client.get(self._url(self.purchase.id))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["status"], "PENDING")
        self.assertIsNone(res.data["contribution"])
        self.assertEqual(res.data["cause_title"], self.cause_a.title)

    def test_impact_con_cashback_devuelve_monto_y_goal(self):
        Goal.objects.create(
            cause=self.cause_a, title="Camisetas", target_amount=Decimal("1000"),
            starts_at=timezone.now() - timedelta(days=1),
        )
        self.purchase.status = "APPROVED"
        self.purchase.save(update_fields=["status"])
        CashbackTransaction.objects.create(
            user=self.consumer, purchase=self.purchase, cause=self.cause_a,
            percentage=Decimal("5"), amount=Decimal("75.00"),
        )
        res = self.client.get(self._url(self.purchase.id))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["status"], "APPROVED")
        self.assertEqual(res.data["contribution"], "75.00")
        self.assertEqual(res.data["goal"]["title"], "Camisetas")
        self.assertEqual(res.data["goal"]["current_amount"], "75.00")
        self.assertEqual(res.data["goal"]["percent"], 7)

    def test_impact_sin_meta_devuelve_goal_null(self):
        res = self.client.get(self._url(self.purchase.id))
        self.assertIsNone(res.data["goal"])

    def test_impact_scoping_otro_usuario_404(self):
        self.client.force_authenticate(self.consumer2)
        res = self.client.get(self._url(self.purchase.id))
        self.assertEqual(res.status_code, 404)
```

(Si `BaseTestCase` no tuviera `consumer2`, crear uno en el `setUp` o usar `self.merchant_user`; verificar los fixtures disponibles al tope de la clase base.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `docker compose -f infra/docker-compose.yml run --rm api pytest apps/cashback/tests.py -v -k "Impact"`
Expected: 404 en todos (la ruta `impact/` no existe aún).

- [ ] **Step 3: Implement — serializer**

En `apps/api/apps/cashback/serializers.py`, agregar `Goal` al import de modelos y la clase (al final del archivo):

```python
from .models import Campaign, CampaignStore, Purchase, CashbackTransaction, ReceiptUpload, Goal


class GoalSerializer(serializers.ModelSerializer):
    current_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = Goal
        fields = ("title", "target_amount", "current_amount", "percent")
```

- [ ] **Step 4: Implement — action `impact`**

En `apps/api/apps/cashback/views.py`:

1. Ampliar imports:

```python
from .models import Campaign, CampaignStore, Purchase, CashbackTransaction, Goal, active_goal_for
from .serializers import (
    CampaignSerializer,
    PurchaseSerializer,
    CashbackTransactionSerializer,
    GoalSerializer,
)
```

2. Agregar la action dentro de `PurchaseViewSet` (después de `approve`):

```python
    @action(detail=True, methods=["get"])
    def impact(self, request, pk=None):
        purchase = self.get_object()
        txn = purchase.cashbacktransaction_set.first()
        cause = txn.cause if txn else purchase.selected_cause
        goal = active_goal_for(cause) if cause else None
        return Response({
            "status": purchase.status,
            "contribution": str(txn.amount) if txn else None,
            "cause_title": cause.title if cause else None,
            "goal": GoalSerializer(goal).data if goal else None,
        })
```

Nota: `impact` es un GET detail → `get_permissions` cae en `IsAuthenticated`, y `get_queryset` ya limita las compras del consumer a `user=user` (por eso otro usuario recibe 404). No tocar permisos.

- [ ] **Step 5: Run tests to verify they pass**

Run: `docker compose -f infra/docker-compose.yml run --rm api pytest apps/cashback/tests.py -v -k "Impact"`
Expected: 4 PASS.

- [ ] **Step 6: Run the full API suite**

Run: `docker compose -f infra/docker-compose.yml run --rm api pytest -q`
Expected: todo PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/api/apps/cashback/
git commit -m "feat(api): endpoint impact + GoalSerializer para reconciliar aporte"
```

---

## Task 3: Backend — `active_goal` en el serializer de causa

**Files:**
- Modify: `apps/api/apps/causes/serializers.py`
- Test: `apps/api/apps/causes/tests.py`

- [ ] **Step 1: Write the failing test**

Crear/ër agregar a `apps/api/apps/causes/tests.py`. Si el archivo no existe o está casi vacío, crear con este contenido (ajustar imports si ya hay un `tests.py` con setup propio):

```python
from decimal import Decimal
from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.causes.models import Cause
from apps.cashback.models import Goal


class CauseActiveGoalTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cause = Cause.objects.create(title="Club X", category="Deporte", is_active=True)

    def test_detalle_de_causa_sin_meta_devuelve_active_goal_null(self):
        res = self.client.get(f"/api/causes/{self.cause.slug}/")
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.data["active_goal"])

    def test_detalle_de_causa_con_meta_devuelve_shape(self):
        Goal.objects.create(
            cause=self.cause, title="Camisetas", target_amount=Decimal("1000"),
            active=True, starts_at=timezone.now() - timedelta(days=1),
        )
        res = self.client.get(f"/api/causes/{self.cause.slug}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["active_goal"]["title"], "Camisetas")
        self.assertIn("percent", res.data["active_goal"])
        self.assertIn("current_amount", res.data["active_goal"])
```

(El endpoint de detalle de causa es público — `retrieve` usa `AllowAny` — así que no hace falta autenticar.)

- [ ] **Step 2: Run test to verify it fails**

Run: `docker compose -f infra/docker-compose.yml run --rm api pytest apps/causes/tests.py -v -k "ActiveGoal"`
Expected: `KeyError: 'active_goal'` (el campo no existe).

- [ ] **Step 3: Implement**

En `apps/api/apps/causes/serializers.py`, reescribir `CauseSerializer` agregando el campo con import **function-local** (evita el ciclo `causes`↔`cashback`):

```python
from rest_framework import serializers
from .models import Cause


class CauseSerializer(serializers.ModelSerializer):
    active_goal = serializers.SerializerMethodField()

    class Meta:
        model = Cause
        fields = [
            "id",
            "title",
            "slug",
            "category",
            "summary",
            "image_url",
            "is_featured",
            "is_active",
            "active_goal",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["slug"]

    def get_active_goal(self, obj):
        from apps.cashback.models import active_goal_for
        from apps.cashback.serializers import GoalSerializer
        goal = active_goal_for(obj)
        return GoalSerializer(goal).data if goal else None
```

- [ ] **Step 4: Run test to verify it passes**

Run: `docker compose -f infra/docker-compose.yml run --rm api pytest apps/causes/tests.py -v -k "ActiveGoal"`
Expected: 2 PASS.

- [ ] **Step 5: Run the full API suite**

Run: `docker compose -f infra/docker-compose.yml run --rm api pytest -q`
Expected: todo PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/apps/causes/
git commit -m "feat(api): active_goal en el detalle de causa"
```

---

## Task 4: Web — tipos/api + componente `GoalProgress`

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/components/GoalProgress.tsx`
- Test: `apps/web/src/components/GoalProgress.test.tsx`

- [ ] **Step 1: Write the failing test**

Crear `apps/web/src/components/GoalProgress.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import GoalProgress from './GoalProgress'

describe('GoalProgress', () => {
  it('muestra título, montos y porcentaje', () => {
    render(
      <GoalProgress title="Camisetas" currentAmount="250.00" targetAmount="1000.00" percent={25} />
    )
    expect(screen.getByText('Camisetas')).toBeDefined()
    expect(screen.getByText(/25%/)).toBeDefined()
    const bar = screen.getByTestId('goal-bar-fill')
    expect(bar.style.width).toBe('25%')
  })

  it('muestra meta cumplida al 100%', () => {
    render(
      <GoalProgress title="M" currentAmount="1200.00" targetAmount="1000.00" percent={100} />
    )
    expect(screen.getByText(/Meta cumplida/i)).toBeDefined()
    expect(screen.getByTestId('goal-bar-fill').style.width).toBe('100%')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run (node limpio si la imagen web está cacheada como prod):
`docker run --rm -v "$PWD/apps/web:/app" -w /app node:20-alpine sh -c "npm ci --no-audit --no-fund --loglevel=error && npx vitest run src/components/GoalProgress.test.tsx"`
Expected: FAIL — el módulo `./GoalProgress` no existe.

- [ ] **Step 3: Implement — tipos y api en `api.ts`**

En `apps/web/src/lib/api.ts`:

1. Agregar el tipo `ApiGoal` y extender `ApiCause` (en el bloque de tipos de causas) con `active_goal`:

```ts
export type ApiGoal = {
  title: string
  target_amount: string
  current_amount: string
  percent: number
}
```

En el type `ApiCause`, agregar el campo:

```ts
  active_goal: ApiGoal | null
```

2. Agregar el tipo de impacto y la función (cerca de las funciones de purchases):

```ts
export type PurchaseImpact = {
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  contribution: string | null
  cause_title: string | null
  goal: ApiGoal | null
}

export function getPurchaseImpact(id: number): Promise<PurchaseImpact> {
  return get<PurchaseImpact>(`/api/cashback/purchases/${id}/impact/`)
}
```

- [ ] **Step 4: Implement — componente**

Crear `apps/web/src/components/GoalProgress.tsx`:

```tsx
type Props = {
  title: string
  currentAmount: string
  targetAmount: string
  percent: number
}

function formatARS(value: string): string {
  const n = parseFloat(value) || 0
  return n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default function GoalProgress({ title, currentAmount, targetAmount, percent }: Props) {
  const clamped = Math.max(0, Math.min(percent, 100))
  const done = clamped >= 100
  return (
    <div className="bg-white/10 border border-white/15 rounded-2xl px-5 py-4 text-left">
      <p className="text-sm font-bold text-white mb-2">{title}</p>
      <div className="h-2.5 w-full rounded-full bg-white/15 overflow-hidden">
        <div
          data-testid="goal-bar-fill"
          className="h-full rounded-full bg-brand-lime-400 transition-all duration-700"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-white/70">
          ${formatARS(currentAmount)} / ${formatARS(targetAmount)}
        </span>
        <span className="text-xs font-bold text-brand-lime-300">{clamped}%</span>
      </div>
      {done && (
        <p className="text-xs font-bold text-brand-lime-300 mt-2">¡Meta cumplida! 🎉</p>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `docker run --rm -v "$PWD/apps/web:/app" -w /app node:20-alpine sh -c "npm ci --no-audit --no-fund --loglevel=error && npx vitest run src/components/GoalProgress.test.tsx"`
Expected: 2 PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/components/GoalProgress.tsx apps/web/src/components/GoalProgress.test.tsx
git commit -m "feat(web): tipos de impacto/meta + componente GoalProgress"
```

---

## Task 5: Web — `PagoExitoso` optimista + reconciliar

**Files:**
- Modify: `apps/web/src/pages/app/PagoExitoso.tsx`
- Test: `apps/web/src/pages/app/PagoExitoso.test.tsx`

- [ ] **Step 1: Write the failing test**

Crear `apps/web/src/pages/app/PagoExitoso.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PagoExitoso from './PagoExitoso'
import { getPurchaseImpact } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  getPurchaseImpact: vi.fn(),
}))

function setSession() {
  sessionStorage.setItem('dc_purchase_id', '42')
  sessionStorage.setItem('dc_cashback', '70')
  sessionStorage.setItem('dc_cause', 'tu club')
  sessionStorage.setItem('dc_store', 'Súper Test')
}

describe('PagoExitoso — reconciliación', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
  })
  afterEach(() => {
    sessionStorage.clear()
  })

  it('al confirmar el webhook muestra el monto real y la barra de la meta', async () => {
    setSession()
    vi.mocked(getPurchaseImpact).mockResolvedValue({
      status: 'APPROVED',
      contribution: '75.00',
      cause_title: 'Club Deportivo Barrial',
      goal: { title: 'Camisetas', target_amount: '1000.00', current_amount: '75.00', percent: 7 },
    })
    render(<MemoryRouter><PagoExitoso /></MemoryRouter>)
    expect(await screen.findByText('Camisetas')).toBeDefined()
    expect(screen.getByText(/Club Deportivo Barrial/)).toBeDefined()
    expect(getPurchaseImpact).toHaveBeenCalledWith(42)
  })

  it('sin meta no muestra barra (degrada al texto de aporte)', async () => {
    setSession()
    vi.mocked(getPurchaseImpact).mockResolvedValue({
      status: 'APPROVED', contribution: '75.00', cause_title: 'tu club', goal: null,
    })
    render(<MemoryRouter><PagoExitoso /></MemoryRouter>)
    await waitFor(() => expect(getPurchaseImpact).toHaveBeenCalled())
    expect(screen.queryByTestId('goal-bar-fill')).toBeNull()
  })

  it('sin dc_purchase_id no llama al endpoint', async () => {
    render(<MemoryRouter><PagoExitoso /></MemoryRouter>)
    await new Promise((r) => setTimeout(r, 50))
    expect(getPurchaseImpact).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `docker run --rm -v "$PWD/apps/web:/app" -w /app node:20-alpine sh -c "npm ci --no-audit --no-fund --loglevel=error && npx vitest run src/pages/app/PagoExitoso.test.tsx"`
Expected: FAIL — `getPurchaseImpact` no se llama y no aparece "Camisetas".

- [ ] **Step 3: Implement**

Reescribir `apps/web/src/pages/app/PagoExitoso.tsx`. Cambios respecto al actual: (a) importar `getPurchaseImpact`, `ApiGoal` y `GoalProgress`; (b) la animación de conteo pasa a depender del estado `cashback` (para re-animar al reconciliar); (c) nuevo `useEffect` de pooling; (d) render de `GoalProgress` si hay meta.

```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Heart, ArrowRight, Home, Clock } from 'lucide-react'
import { getPurchaseImpact, type ApiGoal } from '../../lib/api'
import GoalProgress from '../../components/GoalProgress'

export default function PagoExitoso() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [cashback, setCashback] = useState('0')
  const [cause, setCause] = useState('tu club')
  const [storeName, setStoreName] = useState('')
  const [displayAmount, setDisplayAmount] = useState(0)
  const [goal, setGoal] = useState<ApiGoal | null>(null)
  const [confirming, setConfirming] = useState(false)

  const mpStatus = searchParams.get('status') || 'approved'
  const isPending = mpStatus === 'pending' || mpStatus === 'in_process'

  // 1. Estimado optimista desde sessionStorage (al instante)
  useEffect(() => {
    setCashback(sessionStorage.getItem('dc_cashback') || '0')
    setCause(sessionStorage.getItem('dc_cause') || 'tu club')
    setStoreName(sessionStorage.getItem('dc_store') || '')
  }, [])

  // 2. Animación de conteo: re-corre cada vez que cambia `cashback`
  useEffect(() => {
    const target = parseFloat(cashback) || 0
    if (target <= 0) {
      setDisplayAmount(0)
      return
    }
    let current = 0
    const steps = 40
    const increment = target / steps
    const timer = setInterval(() => {
      current = Math.min(current + increment, target)
      setDisplayAmount(current)
      if (current >= target) clearInterval(timer)
    }, 35)
    return () => clearInterval(timer)
  }, [cashback])

  // 3. Reconciliación contra el webhook real
  useEffect(() => {
    const purchaseId = sessionStorage.getItem('dc_purchase_id')
    if (!purchaseId) return
    let cancelled = false
    let attempts = 0
    setConfirming(true)

    const stop = () => {
      if (!cancelled) setConfirming(false)
      clearInterval(timer)
    }
    const tick = async () => {
      attempts += 1
      try {
        const impact = await getPurchaseImpact(Number(purchaseId))
        if (cancelled) return
        if (impact.goal) setGoal(impact.goal)
        if (impact.status === 'APPROVED' && impact.contribution !== null) {
          setCashback(impact.contribution)
          if (impact.cause_title) setCause(impact.cause_title)
          stop()
        } else if (impact.status === 'REJECTED' || attempts >= 6) {
          stop()
        }
      } catch {
        if (attempts >= 6) stop()
      }
    }
    const timer = setInterval(tick, 2000)
    tick()
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  // 4. Limpieza de sessionStorage al desmontar
  useEffect(() => {
    return () => {
      ;['dc_purchase_id', 'dc_store', 'dc_cause', 'dc_amount', 'dc_cashback'].forEach(
        (k) => sessionStorage.removeItem(k)
      )
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A2236] to-[#0F3D6A] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">

          <div className="relative mb-8 mx-auto w-fit">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
              {isPending ? (
                <Clock size={44} className="text-yellow-300" strokeWidth={1.5} />
              ) : (
                <CheckCircle2 size={44} className="text-brand-lime-400" strokeWidth={1.5} />
              )}
            </div>
            {!isPending && (
              <div className="absolute inset-0 rounded-full bg-brand-lime-400/20 animate-ping" />
            )}
          </div>

          <h1 className="text-3xl font-black text-white mb-1">
            {isPending ? '¡Recibido!' : '¡Listo!'}
          </h1>
          {storeName && (
            <p className="text-white/50 text-sm mb-8">
              Compra en <span className="text-white/80 font-medium">{storeName}</span>
            </p>
          )}

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl px-6 py-7 mb-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Heart size={18} className="text-rose-400 fill-rose-400" />
              <span className="text-white/60 text-sm font-medium">
                {isPending ? 'Cashback estimado' : 'Tu aporte al club'}
              </span>
            </div>
            <div className="text-5xl font-black text-white mb-2">
              ${displayAmount.toFixed(2)}
            </div>
            <p className="text-white/70 text-sm">
              {isPending ? 'irán a' : 'fueron a'}{' '}
              <span className="font-bold text-brand-lime-300">{cause}</span>
            </p>
            {confirming && (
              <p className="text-white/40 text-xs mt-3">Confirmando tu aporte…</p>
            )}
            {isPending && (
              <div className="mt-4 bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-4 py-3">
                <p className="text-yellow-300 text-xs leading-relaxed">
                  El pago está siendo procesado por tu banco.
                  El cashback se confirmará en las próximas horas.
                </p>
              </div>
            )}
          </div>

          {goal && (
            <div className="mb-8">
              <GoalProgress
                title={goal.title}
                currentAmount={goal.current_amount}
                targetAmount={goal.target_amount}
                percent={goal.percent}
              />
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => navigate('/app/causes')}
              className="w-full bg-white text-[#0A2236] font-bold py-4 rounded-2xl
                         flex items-center justify-center gap-2
                         hover:bg-brand-green-50 active:bg-brand-green-50 transition-colors"
            >
              <Heart size={18} className="text-brand-green-600" />
              Ver mi impacto total
              <ArrowRight size={18} className="text-brand-green-600" />
            </button>
            <button
              onClick={() => navigate('/app/scan')}
              className="w-full border border-white/20 text-white font-semibold
                         py-4 rounded-2xl flex items-center justify-center gap-2
                         hover:bg-white/10 transition-colors text-sm"
            >
              Escanear otro QR
            </button>
            <button
              onClick={() => navigate('/app/home')}
              className="w-full text-white/40 text-sm py-2 flex items-center
                         justify-center gap-1.5 hover:text-white/60 transition-colors"
            >
              <Home size={15} />
              Inicio
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `docker run --rm -v "$PWD/apps/web:/app" -w /app node:20-alpine sh -c "npm ci --no-audit --no-fund --loglevel=error && npx vitest run src/pages/app/PagoExitoso.test.tsx"`
Expected: 3 PASS.

- [ ] **Step 5: Run the full web suite**

Run: `docker run --rm -v "$PWD/apps/web:/app" -w /app node:20-alpine sh -c "npm ci --no-audit --no-fund --loglevel=error && npm test"`
Expected: todo PASS (incluye login, signup, PagarComercio, GoalProgress, PagoExitoso).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/app/PagoExitoso.tsx apps/web/src/pages/app/PagoExitoso.test.tsx
git commit -m "feat(web): PagoExitoso reconcilia aporte real + barra de meta"
```

---

## Task 6: Web — barra de meta en el detalle de causa

**Files:**
- Modify: `apps/web/src/pages/causes/CauseDetailPage.tsx`
- Test: `apps/web/src/pages/causes/CauseDetailPage.test.tsx`

- [ ] **Step 1: Write the failing test**

Crear `apps/web/src/pages/causes/CauseDetailPage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import CauseDetailPage from './CauseDetailPage'
import { fetchCauseBySlug } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  fetchCauseBySlug: vi.fn(),
}))

const baseCause = {
  id: 1, title: 'Club X', slug: 'club-x', category: 'Deporte', summary: 'Un club',
  image_url: '', is_featured: false, is_active: true,
  created_at: '', updated_at: '',
}

function renderAt() {
  return render(
    <MemoryRouter initialEntries={['/causas/club-x']}>
      <Routes>
        <Route path="/causas/:slug" element={<CauseDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CauseDetailPage — barra de meta', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra la barra cuando la causa tiene meta activa', async () => {
    vi.mocked(fetchCauseBySlug).mockResolvedValue({
      ...baseCause,
      active_goal: { title: 'Camisetas', target_amount: '1000.00', current_amount: '250.00', percent: 25 },
    } as any)
    renderAt()
    expect(await screen.findByText('Camisetas')).toBeDefined()
    expect(screen.getByTestId('goal-bar-fill').style.width).toBe('25%')
  })

  it('no muestra barra si no hay meta', async () => {
    vi.mocked(fetchCauseBySlug).mockResolvedValue({ ...baseCause, active_goal: null } as any)
    renderAt()
    expect(await screen.findByText('Club X')).toBeDefined()
    expect(screen.queryByTestId('goal-bar-fill')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `docker run --rm -v "$PWD/apps/web:/app" -w /app node:20-alpine sh -c "npm ci --no-audit --no-fund --loglevel=error && npx vitest run src/pages/causes/CauseDetailPage.test.tsx"`
Expected: FAIL — no aparece "Camisetas" (la barra no se renderiza aún).

- [ ] **Step 3: Implement**

En `apps/web/src/pages/causes/CauseDetailPage.tsx`:

1. Importar el componente al tope:

```tsx
import GoalProgress from '../../components/GoalProgress'
```

2. Renderizar la barra después del bloque de Summary (antes de cerrar el `</div>` del contenedor interno). Como `GoalProgress` usa colores claros sobre fondo oscuro, envolverlo en un contenedor oscuro para que se lea sobre el fondo blanco de esta página:

```tsx
        {/* Summary */}
        {cause.summary && (
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 text-base leading-relaxed">{cause.summary}</p>
          </div>
        )}

        {cause.active_goal && (
          <div className="mt-6 rounded-2xl bg-[#0A2236] p-5 max-w-md">
            <GoalProgress
              title={cause.active_goal.title}
              currentAmount={cause.active_goal.current_amount}
              targetAmount={cause.active_goal.target_amount}
              percent={cause.active_goal.percent}
            />
          </div>
        )}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `docker run --rm -v "$PWD/apps/web:/app" -w /app node:20-alpine sh -c "npm ci --no-audit --no-fund --loglevel=error && npx vitest run src/pages/causes/CauseDetailPage.test.tsx"`
Expected: 2 PASS.

- [ ] **Step 5: Run the full web suite**

Run: `docker run --rm -v "$PWD/apps/web:/app" -w /app node:20-alpine sh -c "npm ci --no-audit --no-fund --loglevel=error && npm test"`
Expected: todo PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/causes/CauseDetailPage.tsx apps/web/src/pages/causes/CauseDetailPage.test.tsx
git commit -m "feat(web): barra de meta en el detalle de causa"
```

---

## Self-review (hecho al escribir el plan)

- **Cobertura del spec:** S1 modelo `Goal` + progreso calculado + `starts_at` → Task 1 ✔. S2 endpoint `impact` + `GoalSerializer` + `active_goal` en causa → Tasks 2, 3 ✔. S3 `GoalProgress` + `PagoExitoso` optimista+reconciliar + detalle de causa → Tasks 4, 5, 6 ✔. S4 edge cases (sin meta, rechazado, capeo 100, target 0, sin purchase_id, doble conteo) → cubiertos en tests de Tasks 1, 2, 5 ✔.
- **Hallazgo "existencia = confirmado":** respetado — el progreso y el `impact` no filtran por status del `CashbackTransaction`.
- **Import circular causes↔cashback:** resuelto con import function-local en Task 3.
- **Sin placeholders:** todos los pasos tienen código/comandos completos.
- **Consistencia de tipos:** `ApiGoal`/`PurchaseImpact` (TS) ↔ `GoalSerializer` shape (`title`, `target_amount`, `current_amount`, `percent`) ↔ propiedades del modelo. `getPurchaseImpact(id)` ↔ ruta `/api/cashback/purchases/<id>/impact/`. `data-testid="goal-bar-fill"` usado por los tests de Tasks 4, 5, 6 y definido en el componente de Task 4.
- **Nota vitest:** todos los comandos web usan el fallback node:20-alpine por el cacheo de la imagen prod (documentado en convenciones).
