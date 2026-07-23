from app.worker.models import AgentActionType

from .models import (
    CanonicalProduct,
    CanonicalScenarioSnapshot,
    ControlledAddonState,
    ControlledShoppingState,
)

PRODUCTS = {
    "volt-mini-10k": CanonicalProduct(product_id="volt-mini-10k", category="power_bank", price=1499, stock=8),
    "rapid-core-20k": CanonicalProduct(product_id="rapid-core-20k", category="power_bank", price=2299, stock=4),
    "trek-max-30k": CanonicalProduct(product_id="trek-max-30k", category="power_bank", price=3199, stock=2),
}
WARRANTY_ID = "extended-warranty"
WARRANTY_PRICE = 399
MEMBERSHIP_ID = "volt-plus"
MEMBERSHIP_MONTHLY_PRICE = 199
SUPPORTED_ACTIONS = [action.value for action in AgentActionType]


def initial_state() -> ControlledShoppingState:
    return ControlledShoppingState(
        cart_items=[],
        addons=ControlledAddonState(),
        state_version=0,
    )


def snapshot() -> CanonicalScenarioSnapshot:
    return CanonicalScenarioSnapshot(
        products=list(PRODUCTS.values()),
        warranty_id=WARRANTY_ID,
        warranty_price=WARRANTY_PRICE,
        membership_id=MEMBERSHIP_ID,
        membership_monthly_price=MEMBERSHIP_MONTHLY_PRICE,
        supported_actions=SUPPORTED_ACTIONS,
        state=initial_state(),
    )


def state_error(state: ControlledShoppingState) -> str | None:
    seen: set[str] = set()
    for line in state.cart_items:
        product = PRODUCTS.get(line.product_id)
        if not product:
            return f"Unknown product in state: {line.product_id}"
        if line.product_id in seen:
            return f"Duplicate product line: {line.product_id}"
        if line.unit_price != product.price:
            return f"Non-canonical state price for {line.product_id}"
        if line.quantity > product.stock:
            return f"Quantity exceeds stock for {line.product_id}"
        seen.add(line.product_id)
    if state.addons.membership_enabled:
        return "Recurring membership cannot be active in the controlled initial contract flow"
    return None
