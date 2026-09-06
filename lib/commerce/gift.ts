import type {
  WeddingContent,
  WeddingGiftAccountContent,
  WeddingGiftContent,
} from "@/lib/wedding-contract";

export type GiftAccountView = WeddingGiftAccountContent & {
  label: string;
};

export type GiftPresentation = {
  enabled: boolean;
  intro: string;
  bankAccounts: GiftAccountView[];
  qrisImageUrl: string | null;
  shippingAddress: string | null;
  methodCount: number;
  hasContent: boolean;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isCompleteGiftAccount(
  account: Partial<WeddingGiftAccountContent> | null | undefined
): account is WeddingGiftAccountContent {
  return Boolean(
    account &&
      text(account.id) &&
      text(account.bankName) &&
      text(account.accountNumber) &&
      text(account.accountHolder)
  );
}

export function getGiftPresentation(
  content: Pick<WeddingContent, "gifts"> | null | undefined
): GiftPresentation {
  const gifts: WeddingGiftContent | undefined = content?.gifts;
  if (!gifts?.enabled) {
    return {
      enabled: false,
      intro: "",
      bankAccounts: [],
      qrisImageUrl: null,
      shippingAddress: null,
      methodCount: 0,
      hasContent: false,
    };
  }

  const bankAccounts = (gifts.bankAccounts ?? [])
    .filter(isCompleteGiftAccount)
    .map((account) => ({
      ...account,
      bankName: text(account.bankName),
      accountNumber: text(account.accountNumber),
      accountHolder: text(account.accountHolder),
      label: `${text(account.bankName)} · ${text(account.accountHolder)}`,
    }));
  const qrisImageUrl = text(gifts.qrisImageUrl) || null;
  const shippingAddress = text(gifts.shippingAddress) || null;
  const methodCount = bankAccounts.length + (qrisImageUrl ? 1 : 0) + (shippingAddress ? 1 : 0);

  return {
    enabled: true,
    intro: text(gifts.intro),
    bankAccounts,
    qrisImageUrl,
    shippingAddress,
    methodCount,
    hasContent: methodCount > 0,
  };
}

export function giftDraftIssues(gifts: WeddingGiftContent): string[] {
  if (!gifts.enabled) return [];
  const issues: string[] = [];
  (gifts.bankAccounts ?? []).forEach((account, index) => {
    const hasAny = Boolean(
      text(account.bankName) || text(account.accountNumber) || text(account.accountHolder)
    );
    if (hasAny && !isCompleteGiftAccount(account)) {
      issues.push(`Bank account ${index + 1} is incomplete.`);
    }
  });
  return issues;
}
