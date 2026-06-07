"""
URL patterns for registrations app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'registrations', views.SiteRegistrationViewSet, basename='registration')
router.register(r'scan-logs', views.ScanLogViewSet, basename='scan-log')

urlpatterns = [
    path('dashboard/', views.dashboard_stats, name='dashboard-stats'),
    path('scan/', views.trigger_scan, name='trigger-scan'),
    path('', include(router.urls)),
]
