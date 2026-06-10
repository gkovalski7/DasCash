from .models import Cause


def seed():
    causes = [
        {
            "title": "Club Deportivo Barrial",
            "category": "Deporte",
            "summary": "Apoyo a clubes deportivos de barrio para equipamiento e infraestructura.",
            "is_featured": True,
            "image_url": "/causes/equipo-barrial.jpg",
        },
        {
            "title": "Básquet de Base",
            "category": "Deporte",
            "summary": "Equipamiento y becas para escuelas de básquet en clubes de barrio.",
            "is_featured": True,
            "image_url": "/causes/basquet.jpg",
        },
        {
            "title": "Atletismo Joven",
            "category": "Deporte",
            "summary": "Apoyo a jóvenes atletas para competir en torneos provinciales y nacionales.",
            "is_featured": False,
            "image_url": "/causes/atletismo.jpg",
        },
        {
            "title": "Fútbol de Base",
            "category": "Deporte",
            "summary": "Equipamiento, canchas y entrenadores para divisiones inferiores de fútbol barrial.",
            "is_featured": True,
            "image_url": "/causes/futbol.jpg",
        },
    ]
    for data in causes:
        Cause.objects.get_or_create(
            title=data["title"],
            defaults=data,
        )
