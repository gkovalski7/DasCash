from django.core.management.base import BaseCommand
from django.utils.text import slugify
from apps.causes.models import Cause


SAMPLE = [
    {
        "title": "Becas Escolares",
        "category": "Educación",
        "summary": "Apoyá a estudiantes de bajos recursos con becas y materiales.",
        "image_url": "https://dummyimage.com/800x450/1f2937/ffffff&text=Becas",
        "is_featured": True,
    },
    {
        "title": "Clínica Comunitaria",
        "category": "Salud",
        "summary": "Atención médica gratuita para familias vulnerables.",
        "image_url": "https://dummyimage.com/800x450/0f172a/ffffff&text=Cl%C3%ADnica",
        "is_featured": True,
    },
    {
        "title": "Reforestación Urbana",
        "category": "Ambiente",
        "summary": "Plantamos árboles para mejorar la calidad del aire en la ciudad.",
        "image_url": "https://dummyimage.com/800x450/111827/ffffff&text=Reforestaci%C3%B3n",
        "is_featured": True,
    },
    {
        "title": "Refugio Animal",
        "category": "Ambiente",
        "summary": "Rescate, cuidado y adopción responsable de animales.",
        "image_url": "https://dummyimage.com/800x450/334155/ffffff&text=Refugio",
        "is_featured": True,
    },
    {
        "title": "Deporte para Todos",
        "category": "Deporte",
        "summary": "Acceso al deporte para niños y jóvenes de barrios populares.",
        "image_url": "https://dummyimage.com/800x450/0b2447/ffffff&text=Deporte",
        "is_featured": True,
    },
    {
        "title": "Aulas Digitales",
        "category": "Educación",
        "summary": "Equipamos escuelas con tecnología y capacitación docente.",
        "image_url": "https://dummyimage.com/800x450/133b5c/ffffff&text=Aulas",
        "is_featured": True,
    },
    {
        "title": "Banco de Alimentos",
        "category": "Salud",
        "summary": "Distribuimos alimentos y reducimos el desperdicio.",
        "image_url": "https://dummyimage.com/800x450/1e293b/ffffff&text=Alimentos",
        "is_featured": False,
    },
    {
        "title": "Energía Solar en Escuelas",
        "category": "Ambiente",
        "summary": "Instalación de paneles solares para reducir costos y emisiones.",
        "image_url": "https://dummyimage.com/800x450/0f172a/ffffff&text=Energ%C3%ADa+Solar",
        "is_featured": False,
    },
]


class Command(BaseCommand):
    help = "Crea causas de ejemplo para desarrollo"

    def handle(self, *args, **options):
        created = 0
        for item in SAMPLE:
            slug = slugify(item["title"])[:220]
            obj, was_created = Cause.objects.update_or_create(
                slug=slug,
                defaults={
                    **item,
                    "slug": slug,
                    "is_active": True,
                },
            )
            created += int(was_created)

        total = Cause.objects.count()
        self.stdout.write(self.style.SUCCESS(f"Causas sembradas/actualizadas: {created}; total en DB: {total}"))
