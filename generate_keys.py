import secrets

# Generate a 32-byte (256-bit) secret key
secret_key = secrets.token_hex(32)
print(f"SECRET_KEY={secret_key}")

# Generate another 32-byte (256-bit) secret key for JWT
jwt_secret_key = secrets.token_hex(32)
print(f"JWT_SECRET_KEY={jwt_secret_key}")
