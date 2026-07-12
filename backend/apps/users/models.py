from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from apps.common.models import BaseModel, Company, Region

class Permission(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "users_permission"

    def __str__(self):
        return self.name


class Role(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, related_name="roles", blank=True)

    class Meta:
        db_table = "users_role"

    def __str__(self):
        return self.name


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(BaseModel, AbstractUser):
    # AbstractUser already provides first_name, last_name, email, password, last_login, is_active.
    # We redefine email to make it unique and the primary identifier.
    email = models.EmailField(unique=True, db_index=True)
    phone = models.CharField(max_length=20, blank=True, null=True, unique=True, db_index=True)
    
    # We don't want to use username for login
    username = None 
    
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name="users")
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name="users")
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True, related_name="users")
    
    profile_photo = models.URLField(max_length=1024, blank=True, null=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = "users_user"

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"


class UserRole(BaseModel):
    """
    Pivot table explicitly requested if a many-to-many is needed, 
    though User has a ForeignKey to Role as well. Using this for potential multi-role support in the future.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_roles")
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="role_users")

    class Meta:
        db_table = "users_user_role"
        unique_together = ('user', 'role')

    def __str__(self):
        return f"{self.user} - {self.role}"
