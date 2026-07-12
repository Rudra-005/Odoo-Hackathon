import uuid
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from apps.common.models import AuditLog
from .models import FailedLoginAttempt
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer
)

User = get_user_model()

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        username = request.data.get('email') or request.data.get('username')
        ip_address = get_client_ip(request)
        
        # Check lockout (5 attempts in last 15 mins)
        time_threshold = timezone.now() - timedelta(minutes=15)
        
        # We can identify user by email or username
        user_obj = None
        if username and '@' in username:
            user_obj = User.objects.filter(email=username).first()
        elif username:
            user_obj = User.objects.filter(username=username).first()
            
        if user_obj:
            failed_attempts = FailedLoginAttempt.objects.filter(
                user=user_obj, timestamp__gte=time_threshold
            ).count()
        else:
            failed_attempts = FailedLoginAttempt.objects.filter(
                email_attempted=username, timestamp__gte=time_threshold
            ).count()
            
        if failed_attempts >= 5:
            if user_obj:
                AuditLog.objects.create(
                    user=user_obj,
                    module="Authentication",
                    action="ACCOUNT_LOCKED_ATTEMPT",
                    ip_address=ip_address,
                    browser=request.META.get('HTTP_USER_AGENT', '')
                )
            return Response(
                {"success": False, "message": "Account locked due to too many failed attempts. Try again in 15 minutes."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        try:
            response = super().post(request, *args, **kwargs)
            # Success: clear failed attempts
            if user_obj:
                FailedLoginAttempt.objects.filter(user=user_obj).delete()
                
                # Log success
                AuditLog.objects.create(
                    user=user_obj,
                    module="Authentication",
                    action="LOGIN_SUCCESS",
                    ip_address=ip_address,
                    browser=request.META.get('HTTP_USER_AGENT', '')
                )
                
            # The StandardJSONRenderer will automatically wrap this in {"success": true, "data": ...}
            return response
            
        except (InvalidToken, TokenError) as e:
            # Login Failed
            FailedLoginAttempt.objects.create(
                user=user_obj,
                email_attempted=username if not user_obj else None,
                ip_address=ip_address
            )
            
            if user_obj:
                AuditLog.objects.create(
                    user=user_obj,
                    module="Authentication",
                    action="LOGIN_FAILED",
                    ip_address=ip_address,
                    browser=request.META.get('HTTP_USER_AGENT', '')
                )
                
            return Response(
                {"success": False, "message": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED
            )


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"success": False, "message": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
                
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            AuditLog.objects.create(
                user=request.user,
                module="Authentication",
                action="LOGOUT",
                ip_address=get_client_ip(request),
                browser=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({"success": True, "message": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"success": False, "message": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({
            "success": True,
            "data": serializer.data
        })
        
    def put(self, request):
        # Allow updating profile
        allowed_fields = ['first_name', 'last_name', 'phone', 'profile_photo']
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        serializer = UserSerializer(request.user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "data": serializer.data,
                "message": "Profile updated successfully."
            })
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['current_password']):
                return Response({"success": False, "message": "Invalid current password."}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            AuditLog.objects.create(
                user=request.user,
                module="Authentication",
                action="PASSWORD_CHANGED",
                ip_address=get_client_ip(request),
                browser=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({"success": True, "message": "Password changed successfully."}, status=status.HTTP_200_OK)
            
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.filter(email=email).first()
            
            if user:
                token_generator = PasswordResetTokenGenerator()
                token = token_generator.make_token(user)
                # In a real app, send an email with the link.
                # For now, we print it to console (Console Email Backend handles this or we just print)
                reset_link = f"http://localhost:5173/reset-password?token={token}&email={user.email}"
                print(f"PASSWORD RESET LINK for {user.email}: {reset_link}")
                
            # Always return success to prevent user enumeration
            return Response({
                "success": True, 
                "message": "If an account with this email exists, a password reset link has been sent."
            })
            
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = request.data.get('email')
            token = serializer.validated_data['token']
            
            user = User.objects.filter(email=email).first()
            if not user:
                return Response({"success": False, "message": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST)
                
            token_generator = PasswordResetTokenGenerator()
            if not token_generator.check_token(user, token):
                return Response({"success": False, "message": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
                
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            AuditLog.objects.create(
                user=user,
                module="Authentication",
                action="PASSWORD_RESET",
                ip_address=get_client_ip(request),
                browser=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({"success": True, "message": "Password has been reset successfully."})
            
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
