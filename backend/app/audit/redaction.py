import re
from typing import Any

SENSITIVE_KEYS = re.compile(
    r"password|passcode|otp|one.?time|cvv|cvc|card|aadhaar|aadhar|api.?key|authorization|signing.?key|secret|token|sensitive",
    re.IGNORECASE,
)
AADHAAR = re.compile(r"\b\d{4}[ -]?\d{4}[ -]?\d{4}\b")
CARD = re.compile(r"\b(?:\d[ -]*?){13,19}\b")
BEARER = re.compile(r"(?i)bearer\s+[a-z0-9._~+/=-]+")


def _redact_text(value: str) -> str:
    value = re.sub(r"<[^>]+>", "[OMITTED_HTML]", value)
    value = AADHAAR.sub("[REDACTED_IDENTITY]", value)
    value = CARD.sub("[REDACTED_PAYMENT_CARD]", value)
    return BEARER.sub("[REDACTED_AUTHORIZATION]", value)


def redact(value: Any, key: str = "") -> Any:
    if SENSITIVE_KEYS.search(key):
        return "[REDACTED]"
    if isinstance(value, dict):
        return {str(name): redact(item, str(name)) for name, item in sorted(value.items())}
    if isinstance(value, list):
        return [redact(item) for item in value]
    if isinstance(value, str):
        return _redact_text(value)
    if isinstance(value, (int, float, bool)) or value is None:
        return value
    return _redact_text(str(value))
