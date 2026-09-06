"use client";

import { Copy, Gift, MapPin, QrCode } from "lucide-react";
import { toast } from "sonner";
import { useInvitation } from "@/components/InvitationContext";
import { getGiftPresentation } from "@/lib/commerce/gift";

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the legacy selection fallback.
  }

  try {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(area);
    return copied;
  } catch {
    return false;
  }
}

export default function GiftSection() {
  const invitation = useInvitation();
  const gift = getGiftPresentation(invitation?.content);
  if (!gift.enabled || !gift.hasContent) return null;

  async function copyAccount(value: string) {
    const copied = await copyText(value);
    if (copied) toast.success("Nomor rekening disalin.");
    else toast.error("Nomor rekening belum bisa disalin. Silakan salin manual.");
  }

  return (
    <section id="gift" className="bg-gradient-to-b from-white to-rose-50/40 px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <Gift className="mx-auto mb-4 size-12 text-rose-500" aria-hidden />
          <h2 className="font-serif text-4xl font-bold text-gray-800 md:text-5xl">Amplop Digital</h2>
          {gift.intro && (
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-600">{gift.intro}</p>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {gift.bankAccounts.map((account) => (
            <article
              key={account.id}
              className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm"
            >
              <p className="text-sm uppercase tracking-[0.18em] text-gray-400">
                {account.bankName}
              </p>
              <p className="mt-4 break-all font-mono text-2xl font-semibold text-gray-800">
                {account.accountNumber}
              </p>
              <p className="mt-2 text-sm text-gray-600">a.n. {account.accountHolder}</p>
              <button
                type="button"
                onClick={() => copyAccount(account.accountNumber)}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
                aria-label={`Salin nomor rekening ${account.label}`}
              >
                <Copy className="size-4" aria-hidden /> Salin rekening
              </button>
            </article>
          ))}

          {gift.qrisImageUrl && (
            <article className="rounded-2xl border border-rose-100 bg-white p-6 text-center shadow-sm">
              <div className="mb-4 flex items-center justify-center gap-2 text-sm uppercase tracking-[0.18em] text-gray-400">
                <QrCode className="size-4" aria-hidden /> QRIS
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gift.qrisImageUrl}
                alt="QRIS hadiah pernikahan"
                loading="lazy"
                decoding="async"
                className="mx-auto max-h-72 max-w-full rounded-xl object-contain"
              />
            </article>
          )}
        </div>

        {gift.shippingAddress && (
          <div className="mt-6 rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 size-5 shrink-0 text-rose-500" aria-hidden />
              <div>
                <p className="font-semibold text-gray-800">Kirim hadiah fisik</p>
                <p className="mt-2 whitespace-pre-line leading-7 text-gray-600">
                  {gift.shippingAddress}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
