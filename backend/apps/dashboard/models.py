from django.db import models
from apps.common.models import BaseModel, Company

class DashboardCache(BaseModel):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="dashboard_caches")
    cache_key = models.CharField(max_length=100, db_index=True)
    data = models.JSONField()
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "dashboard_dashboard_cache"
        unique_together = ('company', 'cache_key')

    def __str__(self):
        return f"Cache {self.cache_key} for {self.company}"
