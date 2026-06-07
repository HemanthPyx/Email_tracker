"""
URL patterns for accounts app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'email-accounts', views.EmailAccountViewSet, basename='email-account')

urlpatterns = [
    path('google/url/', views.google_auth_url, name='google-auth-url'),
    path('google/callback/', views.google_auth_callback, name='google-auth-callback'),
    path('me/', views.current_user, name='current-user'),
    path('connect-email/', views.connect_email, name='connect-email'),
    path('', include(router.urls)),
]
