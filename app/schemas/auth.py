from typing import Optional
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None

class TokenRefresh(BaseModel):
    refresh_token: str

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None
    tenant_id: Optional[int] = None
    jti: Optional[str] = None  # JWT ID for revocation

class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = True
    full_name: Optional[str] = None
    role: Optional[str] = "viewer"

class UserCreate(UserBase):
    email: EmailStr
    password: str
    tenant_id: Optional[int] = None

class UserUpdate(UserBase):
    password: Optional[str] = None

class User(UserBase):
    id: int
    is_superuser: bool = False
    tenant_id: Optional[int] = None

    class Config:
        from_attributes = True

class TenantBase(BaseModel):
    name: str
    slug: str
    domain: Optional[str] = None
    is_active: Optional[bool] = True

class TenantCreate(TenantBase):
    pass

class Tenant(TenantBase):
    id: int

    class Config:
        from_attributes = True
