#!/usr/bin/env python3
"""
Generate a secure SECRET_KEY for JWT token signing.

Usage:
    python scripts/generate-secret-key.py

Output:
    SECRET_KEY=<random_secure_32_char_string>

To add to .env:
    python scripts/generate-secret-key.py >> .env
"""

import secrets

if __name__ == "__main__":
    secret_key = secrets.token_urlsafe(48)  # 48 bytes = 64 characters (URL-safe base64)
    print(f"SECRET_KEY={secret_key}")
    print(f"\n# Generated: {len(secret_key)} characters", file=__import__("sys").stderr)
    print(f"# Copy the line above to your .env file", file=__import__("sys").stderr)
