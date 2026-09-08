export interface CreateOrderInput {
  amountCents: number;
  currency: string;
  extRef: string;
  metadata: Record<string, string>;
  redirectUrl?: string;
}

export interface RevolutOrder {
  id: string;
  state: string;
  merchantOrderExtRef: string | null;
  metadata: Record<string, unknown>;
  checkoutUrl: string | null;
  subscriptionId: string | null;
}

export interface CreateCustomerInput {
  fullName: string;
  email: string;
}

export interface CreateSubscriptionInput {
  planVariationId: string;
  customerId: string;
  externalReference: string;
  setupOrderRedirectUrl: string;
}

export interface RevolutSubscription {
  id: string;
  state: string;
  setupOrderId: string | null;
  customerId: string;
}
