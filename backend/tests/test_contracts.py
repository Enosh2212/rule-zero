from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

DEFAULT_INSTRUCTION = (
    "Buy a power bank under ₹1,500. Do not add subscriptions. "
    "Do not share personal information. Stop before payment."
)


def parse(instruction: str = DEFAULT_INSTRUCTION) -> dict:
    response = client.post(
        "/api/contracts/parse",
        json={"instruction": instruction, "scenario_id": "shopping-trap"},
    )
    assert response.status_code == 200
    return response.json()["contract"]


def warning_codes(contract: dict) -> set[str]:
    return {warning["code"] for warning in contract["parse_warnings"]}


def test_parses_rupee_budget_and_power_bank_category() -> None:
    contract = parse()
    assert contract["budget"] == {
        "maximum_amount": 1500,
        "currency": "INR",
        "comparison": "less_than_or_equal",
    }
    assert contract["allowed_item_categories"] == ["power_bank"]


def test_parses_rs_budget_notation() -> None:
    contract = parse("Buy a power-bank up to Rs 1500")
    assert contract["budget"]["maximum_amount"] == 1500


def test_payment_is_prohibited() -> None:
    contract = parse("Buy a power bank below ₹1500. Do not make payment.")
    assert "initiate_payment" in contract["permissions"]["prohibited_actions"]


def test_stop_before_payment_is_explicitly_represented() -> None:
    contract = parse()
    assert contract["permissions"]["stop_before_payment"] is True
    assert "initiate_payment" in contract["permissions"]["prohibited_actions"]


def test_subscription_is_prohibited() -> None:
    contract = parse("Buy a power bank maximum 1500. No subscriptions.")
    assert "activate_subscription" in contract["permissions"]["prohibited_actions"]
    assert "SUBSCRIPTION_DEFAULTED_PROHIBITED" not in warning_codes(contract)


def test_recurring_payments_are_prohibited() -> None:
    contract = parse("Buy a power bank under Rs. 1500. Do not allow recurring payments.")
    assert "activate_recurring_payment" in contract["permissions"]["prohibited_actions"]
    assert "RECURRING_PAYMENT_DEFAULTED_PROHIBITED" not in warning_codes(contract)


def test_sensitive_data_sharing_is_prohibited() -> None:
    contract = parse("Buy a power bank under ₹1,500. Never share sensitive data.")
    assert "share_sensitive_data" in contract["permissions"]["prohibited_actions"]
    assert contract["sensitive_data_policy"]["sharing_allowed"] is False
    assert contract["sensitive_data_policy"]["restriction_source"] == "explicit_instruction"


def test_missing_budget_returns_visible_warning() -> None:
    contract = parse("Buy a power bank")
    assert contract["budget"]["maximum_amount"] is None
    assert "MISSING_BUDGET" in warning_codes(contract)


def test_ambiguous_instruction_uses_safest_budget_and_warns() -> None:
    contract = parse("Buy a power bank under ₹1,500 or maximum ₹2,000")
    assert contract["budget"]["maximum_amount"] == 1500
    assert contract["parser_completeness"] == "ambiguous"
    assert "AMBIGUOUS_BUDGET" in warning_codes(contract)


def test_malformed_requests_are_rejected() -> None:
    empty = client.post(
        "/api/contracts/parse",
        json={"instruction": "", "scenario_id": "shopping-trap"},
    )
    extra = client.post(
        "/api/contracts/parse",
        json={"instruction": DEFAULT_INSTRUCTION, "scenario_id": "shopping-trap", "execute": True},
    )
    assert empty.status_code == 422
    assert extra.status_code == 422


def test_response_structure_is_stable() -> None:
    response = client.post(
        "/api/contracts/parse",
        json={"instruction": DEFAULT_INSTRUCTION, "scenario_id": "shopping-trap"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert list(payload) == ["scenario_id", "contract"]
    assert list(payload["contract"]) == [
        "schema_version",
        "original_instruction",
        "normalized_intent",
        "allowed_item_categories",
        "budget",
        "permissions",
        "sensitive_data_policy",
        "parse_warnings",
        "parser_completeness",
        "parser_confidence",
    ]
    assert payload["contract"]["schema_version"] == "1.0"


def test_deny_by_default_permissions() -> None:
    contract = parse("Find a power bank")
    assert set(contract["permissions"]["prohibited_actions"]) >= {
        "initiate_payment",
        "submit_order",
        "submit_form",
        "activate_subscription",
        "activate_recurring_payment",
        "share_sensitive_data",
    }
    assert contract["permissions"]["actions_requiring_human_approval"] == ["navigate_external"]
    assert contract["sensitive_data_policy"]["restriction_source"] == "deny_by_default"


def test_form_submission_and_external_navigation_rules_are_recognized() -> None:
    contract = parse(
        "Buy a power bank below Rs 1500. Do not submit forms. Ask before leaving the site."
    )
    codes = warning_codes(contract)
    assert "submit_form" in contract["permissions"]["prohibited_actions"]
    assert "FORM_SUBMISSION_DEFAULTED_PROHIBITED" not in codes
    assert contract["permissions"]["actions_requiring_human_approval"] == ["navigate_external"]
    assert "EXTERNAL_NAVIGATION_REQUIRES_APPROVAL" not in codes
