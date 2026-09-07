import { cleanText, isUuid } from "@/lib/commerce/validation";

export const PAYMENT_STATUSES = ["unpaid", "partial", "paid", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PRODUCTION_STATUSES = [
  "new",
  "waiting_data",
  "in_progress",
  "preview_ready",
  "revision",
  "approved",
  "published",
  "completed",
  "cancelled",
] as const;
export type ProductionStatus = (typeof PRODUCTION_STATUSES)[number];

export type CustomerInput = {
  name: string;
  phone: string;
  email: string | null;
  notes: string;
};

export type OrderInput = {
  customerId: string;
  weddingId: string | null;
  packageName: string;
  templateId: string;
  priceAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  productionStatus: ProductionStatus;
  revisionCount: number;
  notes: string;
};

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return typeof value === "string" && PAYMENT_STATUSES.includes(value as PaymentStatus);
}

export function isProductionStatus(value: unknown): value is ProductionStatus {
  return typeof value === "string" && PRODUCTION_STATUSES.includes(value as ProductionStatus);
}

export function parseCustomerInput(value: unknown):
  | { ok: true; value: CustomerInput }
  | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "Invalid customer payload" };
  }
  const body = value as Record<string, unknown>;
  const name = cleanText(body.name, 160, true);
  const phone = cleanText(body.phone, 64, true);
  const email = cleanText(body.email, 254, false) || null;
  const notes = cleanText(body.notes, 5000, false) || "";

  if (!name) return { ok: false, error: "Customer name is required" };
  if (!phone || phone.length < 3) return { ok: false, error: "Customer phone/WhatsApp is required" };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Customer email is invalid" };
  }

  return { ok: true, value: { name, phone, email, notes } };
}

function parseNonNegativeInteger(value: unknown, field: string):
  | { ok: true; value: number }
  | { ok: false; error: string } {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return { ok: false, error: `${field} must be a non-negative integer` };
  }
  return { ok: true, value: parsed };
}

export function parseOrderInput(value: unknown):
  | { ok: true; value: OrderInput }
  | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "Invalid order payload" };
  }
  const body = value as Record<string, unknown>;

  if (!isUuid(body.customer_id)) return { ok: false, error: "Valid customer_id is required" };

  let weddingId: string | null = null;
  if (body.wedding_id != null && body.wedding_id !== "") {
    if (!isUuid(body.wedding_id)) return { ok: false, error: "wedding_id must be a valid UUID" };
    weddingId = body.wedding_id;
  }

  const packageName = cleanText(body.package_name, 80, true);
  const templateId = cleanText(body.template_id, 120, true);
  if (!packageName) return { ok: false, error: "Package is required" };
  if (!templateId) return { ok: false, error: "Template is required" };

  const price = parseNonNegativeInteger(body.price_amount ?? 0, "price_amount");
  if (!price.ok) return price;

  const revision = parseNonNegativeInteger(body.revision_count ?? 0, "revision_count");
  if (!revision.ok) return revision;

  const currency = (cleanText(body.currency, 3, false) || "IDR").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return { ok: false, error: "currency must be a 3-letter code" };

  const paymentStatus = body.payment_status ?? "unpaid";
  if (!isPaymentStatus(paymentStatus)) return { ok: false, error: "Invalid payment_status" };

  const productionStatus = body.production_status ?? "new";
  if (!isProductionStatus(productionStatus)) return { ok: false, error: "Invalid production_status" };

  return {
    ok: true,
    value: {
      customerId: body.customer_id,
      weddingId,
      packageName,
      templateId,
      priceAmount: price.value,
      currency,
      paymentStatus,
      productionStatus,
      revisionCount: revision.value,
      notes: cleanText(body.notes, 5000, false) || "",
    },
  };
}

export function formatProductionStatus(value: ProductionStatus): string {
  return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export function formatPaymentStatus(value: PaymentStatus): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
