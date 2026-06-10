"""
Campaign refactor: add name, cause FK, CampaignStore M2M, CashbackTransaction.campaign FK.
Remove old Campaign.store FK.
"""
from django.db import migrations, models
import django.db.models.deletion


def _migrate_campaign_stores(apps, schema_editor):
    """Migrate existing Campaign.store FK data to CampaignStore rows + assign a cause."""
    Campaign = apps.get_model("cashback", "Campaign")
    CampaignStore = apps.get_model("cashback", "CampaignStore")
    Cause = apps.get_model("causes", "Cause")

    default_cause = Cause.objects.filter(is_active=True).first()

    for campaign in Campaign.objects.all():
        # Create CampaignStore entry from old store FK
        if campaign.store_id:
            CampaignStore.objects.get_or_create(
                campaign=campaign,
                store_id=campaign.store_id,
            )
        # Assign default cause if none set
        if not campaign.cause_id and default_cause:
            campaign.cause = default_cause
            campaign.save(update_fields=["cause"])


class Migration(migrations.Migration):

    dependencies = [
        ("cashback", "0004_phase4_cleanup"),
        ("causes", "0002_phase4_cleanup"),
        ("commerce", "0003_storesupportedcause"),
    ]

    operations = [
        # 1. Add Campaign.name with a default for existing rows
        migrations.AddField(
            model_name="campaign",
            name="name",
            field=models.CharField(default="Campaña sin nombre", max_length=255),
            preserve_default=False,
        ),
        # 2. Add Campaign.cause as nullable first
        migrations.AddField(
            model_name="campaign",
            name="cause",
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="campaigns",
                to="causes.cause",
            ),
        ),
        # 3. Add Campaign.stores M2M through CampaignStore
        migrations.CreateModel(
            name="CampaignStore",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "campaign",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="campaign_stores",
                        to="cashback.campaign",
                    ),
                ),
                (
                    "store",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="campaign_stores",
                        to="commerce.store",
                    ),
                ),
                (
                    "cashback_percentage",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        help_text="Override del porcentaje global de la campaña para esta tienda. Null = usar global.",
                        max_digits=5,
                        null=True,
                    ),
                ),
            ],
            options={
                "unique_together": {("campaign", "store")},
            },
        ),
        # 4. Add M2M field on Campaign
        migrations.AddField(
            model_name="campaign",
            name="stores",
            field=models.ManyToManyField(
                related_name="campaigns_m2m",
                through="cashback.CampaignStore",
                to="commerce.store",
            ),
        ),
        # 5. Add CashbackTransaction.campaign FK
        migrations.AddField(
            model_name="cashbacktransaction",
            name="campaign",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="transactions",
                to="cashback.campaign",
            ),
        ),
        # 6. Data migration: copy old store FK to CampaignStore and set cause
        migrations.RunPython(
            code=_migrate_campaign_stores,
            reverse_code=migrations.RunPython.noop,
        ),
        # 7. Remove old Campaign.store FK
        migrations.RemoveField(
            model_name="campaign",
            name="store",
        ),
        # 8. Make Campaign.cause non-nullable
        migrations.AlterField(
            model_name="campaign",
            name="cause",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="campaigns",
                to="causes.cause",
            ),
        ),
    ]
