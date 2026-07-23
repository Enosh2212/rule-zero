import os
import subprocess
import sys

import pytest

from app.config import cors_origins
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def run_import(extra_env: dict[str, str]) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    for name in ("CORS_ORIGINS", "APPROVAL_SIGNING_KEY", "RECOVERY_SIGNING_KEY", "AUDIT_SIGNING_KEY"):
        env.pop(name, None)
    env.update(extra_env)
    return subprocess.run(
        [sys.executable, "-c", "import app.main"],
        cwd=os.getcwd(),
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )


def test_development_cors_default_is_localhost(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    assert cors_origins() == ["http://localhost:3000"]


@pytest.mark.parametrize(
    "missing_name",
    ["CORS_ORIGINS", "APPROVAL_SIGNING_KEY", "RECOVERY_SIGNING_KEY", "AUDIT_SIGNING_KEY"],
)
def test_each_production_security_setting_is_required(missing_name: str) -> None:
    settings = {
        "ENVIRONMENT": "production",
        "CORS_ORIGINS": "https://rule-zero.example",
        "APPROVAL_SIGNING_KEY": "approval-production-key-32-characters-minimum",
        "RECOVERY_SIGNING_KEY": "recovery-production-key-32-characters-minimum",
        "AUDIT_SIGNING_KEY": "audit-production-key-value-32-characters",
    }
    settings.pop(missing_name)
    result = run_import(settings)
    assert result.returncode != 0
    assert missing_name in result.stderr


@pytest.mark.parametrize(
    ("name", "weak_value"),
    [
        ("APPROVAL_SIGNING_KEY", "replace-for-non-local-use"),
        ("RECOVERY_SIGNING_KEY", "short"),
        ("AUDIT_SIGNING_KEY", "rule-zero-local-audit-signing-key"),
    ],
)
def test_weak_production_signing_keys_are_rejected(name: str, weak_value: str) -> None:
    settings = {
        "ENVIRONMENT": "production",
        "CORS_ORIGINS": "https://rule-zero.example",
        "APPROVAL_SIGNING_KEY": "approval-production-key-32-characters-minimum",
        "RECOVERY_SIGNING_KEY": "recovery-production-key-32-characters-minimum",
        "AUDIT_SIGNING_KEY": "audit-production-key-value-32-characters",
        name: weak_value,
    }
    result = run_import(settings)
    assert result.returncode != 0
    assert name in result.stderr


def test_strong_production_configuration_imports() -> None:
    result = run_import(
        {
            "ENVIRONMENT": "production",
            "CORS_ORIGINS": "https://rule-zero.example",
            "APPROVAL_SIGNING_KEY": "approval-production-key-32-characters-minimum",
            "RECOVERY_SIGNING_KEY": "recovery-production-key-32-characters-minimum",
            "AUDIT_SIGNING_KEY": "audit-production-key-value-32-characters",
        }
    )
    assert result.returncode == 0, result.stderr


def test_production_wildcard_cors_is_rejected() -> None:
    result = run_import(
        {
            "ENVIRONMENT": "production",
            "CORS_ORIGINS": "*",
            "APPROVAL_SIGNING_KEY": "approval-production-key-32-characters-minimum",
            "RECOVERY_SIGNING_KEY": "recovery-production-key-32-characters-minimum",
            "AUDIT_SIGNING_KEY": "audit-production-key-value-32-characters",
        }
    )
    assert result.returncode != 0
    assert "wildcard" in result.stderr


def test_health_and_normal_validation_errors_expose_no_internal_secrets() -> None:
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"
    malformed = client.post("/api/contracts/parse", json={"instruction": ""})
    assert malformed.status_code == 422
    serialized = malformed.text.lower()
    assert "traceback" not in serialized
    assert "signing_key" not in serialized
    assert "rule-zero-local-" not in serialized


def test_openapi_schema_does_not_publish_signing_configuration() -> None:
    schema = client.get("/openapi.json")
    assert schema.status_code == 200
    serialized = schema.text
    assert "APPROVAL_SIGNING_KEY" not in serialized
    assert "RECOVERY_SIGNING_KEY" not in serialized
    assert "AUDIT_SIGNING_KEY" not in serialized
