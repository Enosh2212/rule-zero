import os

PRODUCTION_ENVIRONMENTS = {"production", "prod"}
LOCAL_ORIGINS = ["http://localhost:3000"]
WEAK_KEY_MARKERS = (
    "replace-for-",
    "change-me",
    "changeme",
    "placeholder",
    "rule-zero-local-",
)


def environment() -> str:
    return os.getenv("ENVIRONMENT", "development").strip().lower()


def is_production() -> bool:
    return environment() in PRODUCTION_ENVIRONMENTS


def cors_origins() -> list[str]:
    configured = os.getenv("CORS_ORIGINS", "").strip()
    if not configured:
        if is_production():
            raise RuntimeError("CORS_ORIGINS is required in production")
        return LOCAL_ORIGINS
    origins = [origin.strip().rstrip("/") for origin in configured.split(",") if origin.strip()]
    if not origins:
        raise RuntimeError("CORS_ORIGINS must contain at least one origin")
    if is_production() and any(origin == "*" for origin in origins):
        raise RuntimeError("CORS_ORIGINS cannot use a wildcard in production")
    if is_production() and any("localhost" in origin or "127.0.0.1" in origin for origin in origins):
        raise RuntimeError("CORS_ORIGINS cannot use localhost in production")
    return origins


def signing_key(name: str, development_default: str) -> bytes:
    configured = os.getenv(name, "").strip()
    if not configured:
        if is_production():
            raise RuntimeError(f"{name} is required in production")
        return development_default.encode()
    lowered = configured.lower()
    if is_production() and (
        len(configured) < 32 or any(marker in lowered for marker in WEAK_KEY_MARKERS)
    ):
        raise RuntimeError(f"{name} must be a strong non-placeholder value in production")
    return configured.encode()
