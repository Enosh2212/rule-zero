import re

from .models import (
    ActionName,
    AgentPermissions,
    BudgetConstraint,
    ParseWarning,
    SensitiveDataPolicy,
    TaskContract,
)

_BUDGET_PATTERN = re.compile(
    r"(?:under|below|maximum(?:\s+of)?|max(?:imum)?|up\s+to)\s*"
    r"(?:₹|rs\.?|inr)?\s*([0-9][0-9,]*)",
    re.IGNORECASE,
)
_POWER_BANK_PATTERN = re.compile(r"\bpower[\s-]?bank(?:s)?\b", re.IGNORECASE)
_PAYMENT_RESTRICTION = re.compile(
    r"(?:stop\s+before\s+(?:the\s+)?payment|do\s+not\s+(?:make|complete|initiate)?\s*pay(?:ment)?|"
    r"don['’]t\s+(?:make|complete|initiate)?\s*pay|no\s+payment)",
    re.IGNORECASE,
)
_STOP_BEFORE_PAYMENT = re.compile(r"stop\s+before\s+(?:the\s+)?payment", re.IGNORECASE)
_SUBSCRIPTION_RESTRICTION = re.compile(
    r"(?:do\s+not|don['’]t|no)\s+(?:add|activate|allow|start)?\s*subscriptions?",
    re.IGNORECASE,
)
_RECURRING_RESTRICTION = re.compile(
    r"(?:do\s+not|don['’]t|no)\s+(?:add|activate|allow|start)?\s*recurring(?:\s+payments?|\s+charges?)?",
    re.IGNORECASE,
)
_SENSITIVE_RESTRICTION = re.compile(
    r"(?:do\s+not|don['’]t|never|no)\s+(?:share|provide|enter|send)?\s*"
    r"(?:personal|sensitive|private)(?:\s+(?:data|information|details))?",
    re.IGNORECASE,
)
_FORM_RESTRICTION = re.compile(
    r"(?:do\s+not|don['’]t|never|no)\s+(?:submit|send)\s+(?:the\s+)?forms?",
    re.IGNORECASE,
)
_EXTERNAL_APPROVAL = re.compile(
    r"(?:ask|approval|confirm|permission).{0,30}(?:external|another\s+site|leav(?:e|ing)\s+(?:the\s+)?site)",
    re.IGNORECASE,
)


def _warning(code: str, field: str, message: str) -> ParseWarning:
    return ParseWarning(code=code, field=field, message=message)


def _normalize_instruction(instruction: str) -> str:
    return " ".join(instruction.strip().split())


def parse_task_contract(instruction: str) -> TaskContract:
    normalized_instruction = _normalize_instruction(instruction)
    warnings: list[ParseWarning] = []

    budget_matches = [int(value.replace(",", "")) for value in _BUDGET_PATTERN.findall(normalized_instruction)]
    distinct_budgets = sorted(set(budget_matches))
    maximum_amount = min(distinct_budgets) if distinct_budgets else None
    if not distinct_budgets:
        warnings.append(
            _warning(
                "MISSING_BUDGET",
                "budget.maximum_amount",
                "No maximum budget was recognized; spending remains unapproved.",
            )
        )
    elif len(distinct_budgets) > 1:
        warnings.append(
            _warning(
                "AMBIGUOUS_BUDGET",
                "budget.maximum_amount",
                f"Multiple budgets were found; the safest maximum ({maximum_amount} INR) was retained.",
            )
        )

    allowed_item_categories = ["power_bank"] if _POWER_BANK_PATTERN.search(normalized_instruction) else []
    if not allowed_item_categories:
        warnings.append(
            _warning(
                "UNKNOWN_ITEM_CATEGORY",
                "allowed_item_categories",
                "No supported item category was recognized; adding items remains unapproved.",
            )
        )

    allowed_actions: list[ActionName] = ["browse_catalogue", "inspect_product"]
    if allowed_item_categories:
        allowed_actions.extend(["add_item_to_cart", "remove_item_from_cart", "update_cart_quantity"])

    prohibited_actions: list[ActionName] = [
        "initiate_payment",
        "submit_order",
        "submit_form",
        "activate_subscription",
        "activate_recurring_payment",
        "share_sensitive_data",
    ]
    actions_requiring_approval: list[ActionName] = ["navigate_external"]

    payment_restricted = bool(_PAYMENT_RESTRICTION.search(normalized_instruction))
    stop_before_payment = bool(_STOP_BEFORE_PAYMENT.search(normalized_instruction))
    if not payment_restricted:
        warnings.append(
            _warning(
                "PAYMENT_DEFAULTED_PROHIBITED",
                "permissions.prohibited_actions",
                "Payment permission was not explicit; payment is prohibited by default.",
            )
        )

    subscription_restricted = bool(_SUBSCRIPTION_RESTRICTION.search(normalized_instruction))
    recurring_restricted = bool(_RECURRING_RESTRICTION.search(normalized_instruction))
    if not subscription_restricted:
        warnings.append(
            _warning(
                "SUBSCRIPTION_DEFAULTED_PROHIBITED",
                "permissions.prohibited_actions",
                "Subscription permission was not explicit; activation is prohibited by default.",
            )
        )
    if not recurring_restricted and not subscription_restricted:
        warnings.append(
            _warning(
                "RECURRING_PAYMENT_DEFAULTED_PROHIBITED",
                "permissions.prohibited_actions",
                "Recurring-payment permission was not explicit; recurring charges are prohibited by default.",
            )
        )

    sensitive_restricted = bool(_SENSITIVE_RESTRICTION.search(normalized_instruction))
    if not sensitive_restricted:
        warnings.append(
            _warning(
                "SENSITIVE_DATA_DEFAULTED_PROHIBITED",
                "sensitive_data_policy",
                "Sensitive-data permission was not explicit; sharing is prohibited by default.",
            )
        )

    if not _FORM_RESTRICTION.search(normalized_instruction):
        warnings.append(
            _warning(
                "FORM_SUBMISSION_DEFAULTED_PROHIBITED",
                "permissions.prohibited_actions",
                "Form or order submission permission was not explicit; submission is prohibited by default.",
            )
        )

    if not _EXTERNAL_APPROVAL.search(normalized_instruction):
        warnings.append(
            _warning(
                "EXTERNAL_NAVIGATION_REQUIRES_APPROVAL",
                "permissions.actions_requiring_human_approval",
                "External navigation was not authorized; human approval is required.",
            )
        )

    is_ambiguous = len(distinct_budgets) > 1
    completeness = "ambiguous" if is_ambiguous else ("complete_with_defaults" if warnings else "complete")
    confidence = 0.55 if is_ambiguous else max(0.5, round(1.0 - (0.06 * len(warnings)), 2))
    intent_category = allowed_item_categories[0] if allowed_item_categories else "unspecified_item"

    return TaskContract(
        original_instruction=instruction,
        normalized_intent=f"purchase:{intent_category}",
        allowed_item_categories=allowed_item_categories,
        budget=BudgetConstraint(maximum_amount=maximum_amount),
        permissions=AgentPermissions(
            allowed_actions=allowed_actions,
            prohibited_actions=prohibited_actions,
            actions_requiring_human_approval=actions_requiring_approval,
            stop_before_payment=stop_before_payment,
        ),
        sensitive_data_policy=SensitiveDataPolicy(
            prohibited_data_categories=[
                "personal_information",
                "government_identifier",
                "payment_card",
                "password",
                "one_time_password",
            ],
            restriction_source="explicit_instruction" if sensitive_restricted else "deny_by_default",
        ),
        parse_warnings=warnings,
        parser_completeness=completeness,
        parser_confidence=confidence,
    )
