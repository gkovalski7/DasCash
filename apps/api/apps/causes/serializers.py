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
        view = self.context.get("view")
        if not view or getattr(view, "action", None) != "retrieve":
            return None
        from apps.cashback.models import active_goal_for
        from apps.cashback.serializers import GoalSerializer
        goal = active_goal_for(obj)
        return GoalSerializer(goal).data if goal else None
