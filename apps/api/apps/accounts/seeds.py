from django.contrib.auth import get_user_model

User = get_user_model()


def seed():
    # Create admin
    if not User.objects.filter(email="admin@example.com").exists():
        u = User(email="admin@example.com", username="admin@example.com", role="ADMIN", is_staff=True, is_superuser=True)
        u.set_password("Admin1234!")
        u.save()
    # Create merchant
    if not User.objects.filter(email="merchant@example.com").exists():
        u = User(email="merchant@example.com", username="merchant@example.com", role="MERCHANT")
        u.set_password("Merchant1234!")
        u.save()
    # Create consumer
    if not User.objects.filter(email="consumer@example.com").exists():
        u = User(email="consumer@example.com", username="consumer@example.com", role="CONSUMER")
        u.set_password("Consumer1234!")
        u.save()
