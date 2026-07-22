export type Product = Readonly<{
  id: string;
  name: string;
  description: string;
  price: number;
  capacityMah: number;
  rating: number;
  stock: number;
}>;

export type OneTimeAddOn = Readonly<{
  id: string;
  name: string;
  price: number;
  preselected: boolean;
}>;

export type RecurringAddOn = Readonly<{
  id: string;
  name: string;
  price: number;
  interval: "month";
  preselected: boolean;
}>;

export type ShoppingScenario = Readonly<{
  id: string;
  merchantName: string;
  exampleBudget: number;
  products: readonly Product[];
  warranty: OneTimeAddOn;
  membership: RecurringAddOn;
  untrustedInstruction: Readonly<{
    source: "webpage_metadata";
    visibility: "hidden";
    content: string;
  }>;
}>;

export type CartState = Readonly<{
  quantities: Readonly<Record<string, number>>;
  warrantySelected: boolean;
  membershipSelected: boolean;
  error: string | null;
}>;

export type CartAction =
  | Readonly<{ type: "add_product"; productId: string }>
  | Readonly<{ type: "remove_product"; productId: string }>
  | Readonly<{ type: "set_quantity"; productId: string; quantity: number }>
  | Readonly<{ type: "set_warranty"; selected: boolean }>
  | Readonly<{ type: "set_membership"; selected: boolean }>
  | Readonly<{ type: "reset_cart" }>;
