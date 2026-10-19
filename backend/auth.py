from datetime import datetime, timedelta
import os
import secrets

from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv

load_dotenv()

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

SECRET_KEY = os.getenv("SECRET_KEY", "")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")

# Refuse to start with missing or example secrets. A guessable SECRET_KEY lets anyone
# forge an admin token, and a default password lets anyone log in.
_PLACEHOLDERS = {"", "password", "change_me_please", "fallback-secret-key", "generate_a_long_random_string_here"}
if SECRET_KEY in _PLACEHOLDERS or ADMIN_PASSWORD in _PLACEHOLDERS:
    raise RuntimeError(
        "Set SECRET_KEY and ADMIN_PASSWORD in backend/.env before starting the server. "
        "Generate a key with: python -c \"import secrets; print(secrets.token_urlsafe(48))\""
    )

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/login")


def verify_password(plain_password: str) -> bool:
    # Constant-time comparison, so response timing doesn't leak the password.
    return secrets.compare_digest(plain_password.encode(), ADMIN_PASSWORD.encode())


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str = Depends(oauth2_scheme)) -> str:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username != ADMIN_USERNAME:
            raise credentials_exception
        return username
    except JWTError:
        raise credentials_exception
