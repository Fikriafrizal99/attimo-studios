"use client";

import { Copy, Gift, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useInvitation } from "@/components/InvitationContext";

export default function GiftSection() {
  const invitation = useInvitation();
  const gifts = invitation?.content.gifts;
  if (!gifts?.enabled) return null;
  const hasContent = (gifts.bankAccounts?.length ?? 0) > 0 || gifts.qrisImageUrl || gifts.shippingAddress;
  if (!hasContent) return null;

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    toast.success("Nomor rekening disalin.");
  }

  return (
    <section id="gift" className="bg-gradient-to-b from-white to-rose-50/40 px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <Gift className="mx-auto mb-4 size-12 text-rose-500" />
          <h2 className="font-serif text-4xl font-bold text-gray-800 md:text-5xl">Amplop Digital</h2>
          {gifts.intro && <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-600">{gifts.intro}</p>}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {gifts.bankAccounts.map((account) => (
            <article key={account.id} className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.18em] text-gray-400">{account.bankName}</p>
              <p className="mt-4 break-all font-mono text-2xl font-semibold text-gray-800">{account.accountNumber}</p>
              <p className="mt-2 text-sm text-gray-600">a.n. {account.accountHolder}</p>
              <button
                type="button"
                onClick={() => copy(account.accountNumber)}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white"
              >
                <Copy className="size-4" /> Salin rekening
              </button>
            </article>
          ))}

          {gifts.qrisImageUrl && (
            <article className="rounded-2xl border border-rose-100 bg-white p-6 text-center shadow-sm">
              <p className="mb-4 text-sm uppercase tracking-[0.18em] text-gray-400">QRIS</p>
              <img
                src={gifts.qrisImageUrl}
                alt="QRIS hadiah pernikahan"
                loading="lazy"
                className="mx-auto max-h-72 max-w-full rounded-xl object-contain"
              />
            </article>
          )}
        </div>

        {gifts.shippingAddress && (
          <div className="mt-6 rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 size-5 shrink-0 text-rose-500" />
              <div>
                <p className="font-semibold text-gray-800">Kirim hadiah fisik</p>
                <p className="mt-2 whitespace-pre-line leading-7 text-gray-600">{gifts.shippingAddress}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
