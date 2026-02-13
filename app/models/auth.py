from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Tenant(Base):
    __tablename__ = "tenants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    slug = Column(String, unique=True, index=True)
    domain = Column(String, unique=True, index=True, nullable=True)
    config = Column(JSON, default={})
    is_active = Column(Boolean, default=True)
    
    users = relationship("User", back_populates="tenant")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    role = Column(String, default="viewer")  # admin, editor, viewer
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True) # Nullable for superusers or platform admins
    tenant = relationship("Tenant", back_populates="users")
