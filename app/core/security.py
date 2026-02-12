from datetime import datetime, timedelta, timezone
from typing import Optional, Union, Any
import uuid
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.config import settings

# Setup password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration - Load from environment
SECRET_KEY = settings.SECRET_KEY  # Now loaded from .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # Reduced from 30 for security
REFRESH_TOKEN_EXPIRE_DAYS = 7

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

def create_access_token(
    subject: Optional[Union[str, Any]] = None,
    expires_delta: Optional[timedelta] = None,
    claims: Optional[dict] = None,
    **kwargs
) -> str:
    """Create a JWT access token with unique JTI for revocation support."""
    # Handle 'data' kwarg for compatibility with legacy tests
    data = kwargs.get("data")
    if data:
        if claims:
            claims.update(data)
        else:
            claims = data
        if not subject and "sub" in data:
            subject = data["sub"]

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # Generate unique JWT ID for revocation
    jti = str(uuid.uuid4())

    to_encode = {
        "sub": str(subject) if subject is not None else "",
        "exp": expire,
        "jti": jti,
        "type": "access"
    }

    if claims:
        to_encode.update(claims)

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    subject: Optional[Union[str, Any]] = None,
    expires_delta: Optional[timedelta] = None,
    claims: Optional[dict] = None,
    **kwargs
) -> str:
    """Create a JWT refresh token with longer expiration."""
    # Handle 'data' kwarg for compatibility with legacy tests
    data = kwargs.get("data")
    if data:
        if claims:
            claims.update(data)
        else:
            claims = data
        if not subject and "sub" in data:
            subject = data["sub"]

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    # Generate unique JWT ID for revocation
    jti = str(uuid.uuid4())

    to_encode = {
        "sub": str(subject) if subject is not None else "",
        "exp": expire,
        "jti": jti,
        "type": "refresh"
    }

    if claims:
        to_encode.update(claims)

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> dict:
    """Decode and validate JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise ValueError("Invalid token")
