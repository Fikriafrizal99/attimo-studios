"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/image-upload";
import { DEFAULT_EVENT_TIME_ZONE } from "@/lib/wedding-contract";
import type {
  WeddingContent,
  WeddingContentEvent,
  WeddingContentGalleryImage,
  WeddingContentHero,
  WeddingContentStoryItem,
  WeddingGiftAccount,
  WeddingGiftContent,
} from "@/lib/wedding-defaults";

const emptyPerson = () => ({ name: "", shortName: "", username: "", parentInfo: "", location: "", image: "" });
const uid = (prefix: string) => `${prefix}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`}`;

export function ContentForm({ weddingId, initialContent }: { weddingId: string; initialContent: WeddingContent }) {
  const [content, setContent] = useState<WeddingContent>({ schemaVersion: 1, ...initialContent });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = "min-h-[42px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-[#BFA14A]";
  const textarea = `${input} min-h-[96px] resize-y`;
  const card = "space-y-4 rounded-md border border-white/10 bg-white/[0.025] p-4";
  const label = "mb-1 block text-xs font-medium uppercase tracking-wider text-neutral-400";
  const button = "rounded-md border border-white/10 px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-white/5";

  const couple = content.couple ?? { bride: emptyPerson(), groom: emptyPerson() };
  const hero: WeddingContentHero = content.hero ?? {};
  const events = content.events ?? [];
  const story = content.story ?? [];
  const gallery = content.gallery ?? [];
  const gifts: WeddingGiftContent = content.gifts ?? { enabled: true, bankAccounts: [] };
  const music = content.music ?? [];

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const brideName = couple.bride.name.trim();
    const groomName = couple.groom.name.trim();
    if (!brideName && !groomName) {
      setError("Isi minimal satu nama pasangan.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/weddings/${weddingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: { ...content, schemaVersion: 1 } }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Failed to save content");
      setContent(payload.content ?? content);
      toast.success("Content saved.");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to save content";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function updatePerson(side: "bride" | "groom", field: string, value: string) {
    setContent((current) => {
      const currentCouple = current.couple ?? { bride: emptyPerson(), groom: emptyPerson() };
      return {
        ...current,
        couple: {
          ...currentCouple,
          [side]: { ...currentCouple[side], [field]: value },
        },
      };
    });
  }

  function updateEvent(index: number, patch: Partial<WeddingContentEvent>) {
    setContent((current) => ({
      ...current,
      events: (current.events ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    }));
  }

  function addEvent() {
    const first = events.length === 0;
    setContent((current) => ({
      ...current,
      events: [
        ...(current.events ?? []),
        { id: uid("event"), title: "", date: "", time: "", endTime: "", timezone: DEFAULT_EVENT_TIME_ZONE, location: "", address: "", mapsUrl: "", isPrimary: first },
      ],
    }));
  }

  function removeEvent(index: number) {
    setContent((current) => ({ ...current, events: (current.events ?? []).filter((_, itemIndex) => itemIndex !== index) }));
  }

  function setPrimary(index: number) {
    setContent((current) => ({
      ...current,
      events: (current.events ?? []).map((item, itemIndex) => ({ ...item, isPrimary: itemIndex === index })),
      hero: { ...current.hero, countdownEventId: current.events?.[index]?.id ?? "" },
    }));
  }

  function addStory() {
    setContent((current) => ({
      ...current,
      story: [...(current.story ?? []), { id: uid("story"), date: "", title: "", description: "", image: "" }],
    }));
  }

  function updateStory(index: number, patch: Partial<WeddingContentStoryItem>) {
    setContent((current) => ({ ...current, story: (current.story ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  }

  function addGallery() {
    setContent((current) => ({ ...current, gallery: [...(current.gallery ?? []), { id: uid("gallery"), url: "", alt: "" }] }));
  }

  function updateGallery(index: number, patch: Partial<WeddingContentGalleryImage>) {
    setContent((current) => ({ ...current, gallery: (current.gallery ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  }

  function addAccount() {
    setContent((current) => ({
      ...current,
      gifts: {
        enabled: current.gifts?.enabled ?? true,
        intro: current.gifts?.intro ?? "",
        qrisImageUrl: current.gifts?.qrisImageUrl ?? "",
        shippingAddress: current.gifts?.shippingAddress ?? "",
        bankAccounts: [...(current.gifts?.bankAccounts ?? []), { id: uid("account"), bankName: "", accountNumber: "", accountHolder: "" }],
      },
    }));
  }

  function updateAccount(index: number, patch: Partial<WeddingGiftAccount>) {
    setContent((current) => ({
      ...current,
      gifts: {
        enabled: current.gifts?.enabled ?? true,
        intro: current.gifts?.intro ?? "",
        qrisImageUrl: current.gifts?.qrisImageUrl ?? "",
        shippingAddress: current.gifts?.shippingAddress ?? "",
        bankAccounts: (current.gifts?.bankAccounts ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
      },
    }));
  }

  return (
    <form onSubmit={save} className="space-y-10" noValidate>
      <div>
        <h2 className="text-lg font-semibold text-neutral-50">Wedding Content</h2>
        <p className="mt-1 text-sm text-neutral-400">Satu schema data ini dapat dipakai oleh seluruh family template.</p>
      </div>
      {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      <section className={card}>
        <h3 className="text-base font-semibold text-neutral-100">Opening / Hero</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className={label}>Greeting</label><input className={input} value={hero.greeting ?? ""} onChange={(e) => setContent({ ...content, hero: { ...hero, greeting: e.target.value } })} placeholder="The Wedding of" /></div>
          <div><label className={label}>Subtitle</label><input className={input} value={hero.subtitle ?? ""} onChange={(e) => setContent({ ...content, hero: { ...hero, subtitle: e.target.value } })} /></div>
          <div className="md:col-span-2"><label className={label}>Opening quote</label><textarea className={textarea} value={hero.quote ?? ""} onChange={(e) => setContent({ ...content, hero: { ...hero, quote: e.target.value } })} /></div>
          <div className="md:col-span-2">
            <label className={label}>Cover image</label>
            <ImageUpload id="hero-cover" value={hero.coverImage ?? ""} onChange={(url) => setContent({ ...content, hero: { ...hero, coverImage: url } })} uploadUrl={`/api/weddings/${weddingId}/upload`} />
          </div>
          <div className="md:col-span-2">
            <label className={label}>Countdown event</label>
            <select className={input} value={hero.countdownEventId ?? ""} onChange={(e) => setContent({ ...content, hero: { ...hero, countdownEventId: e.target.value } })}>
              <option value="">Use primary/first event</option>
              {events.map((event, index) => <option key={event.id ?? index} value={event.id ?? ""}>{event.title || `Event ${index + 1}`}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className={card}>
        <h3 className="text-base font-semibold text-neutral-100">Couple</h3>
        <div className="grid gap-8 md:grid-cols-2">
          {(["bride", "groom"] as const).map((side) => {
            const person = couple[side];
            return (
              <div key={side} className="space-y-3">
                <p className="text-sm font-medium capitalize text-neutral-300">{side}</p>
                <div><label className={label}>Full name</label><input className={input} value={person.name} onChange={(e) => updatePerson(side, "name", e.target.value)} /></div>
                <div><label className={label}>Short name</label><input className={input} value={person.shortName ?? ""} onChange={(e) => updatePerson(side, "shortName", e.target.value)} /></div>
                <div><label className={label}>Instagram / username</label><input className={input} value={person.username} onChange={(e) => updatePerson(side, "username", e.target.value)} /></div>
                <div><label className={label}>Parent info</label><textarea className={textarea} value={person.parentInfo} onChange={(e) => updatePerson(side, "parentInfo", e.target.value)} /></div>
                <div><label className={label}>Origin / location</label><input className={input} value={person.location} onChange={(e) => updatePerson(side, "location", e.target.value)} /></div>
                <div><label className={label}>Photo</label><ImageUpload id={`${side}-photo`} value={person.image ?? ""} onChange={(url) => updatePerson(side, "image", url)} uploadUrl={`/api/weddings/${weddingId}/upload`} /></div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={card}>
        <div className="flex items-center justify-between"><h3 className="text-base font-semibold text-neutral-100">Events</h3><button type="button" className={button} onClick={addEvent}>+ Add event</button></div>
        {events.length === 0 && <p className="text-sm text-neutral-500">Tambahkan akad, resepsi, atau acara lainnya.</p>}
        {events.map((event, index) => (
          <div key={event.id ?? index} className="space-y-4 rounded-md border border-white/10 p-4">
            <div className="flex justify-between"><strong className="text-sm text-neutral-300">Event {index + 1}</strong><button type="button" className="text-xs text-red-300" onClick={() => removeEvent(index)}>Remove</button></div>
            <div className="grid gap-3 md:grid-cols-2">
              <div><label className={label}>Title</label><input className={input} value={event.title} onChange={(e) => updateEvent(index, { title: e.target.value })} /></div>
              <label className="flex items-center gap-2 pt-6 text-sm text-neutral-300"><input type="radio" name="primary-event" checked={Boolean(event.isPrimary)} onChange={() => setPrimary(index)} /> Primary event</label>
              <div><label className={label}>Date</label><input type="date" className={input} value={event.date} onChange={(e) => updateEvent(index, { date: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2"><div><label className={label}>Start</label><input type="time" className={input} value={event.time} onChange={(e) => updateEvent(index, { time: e.target.value })} /></div><div><label className={label}>End</label><input type="time" className={input} value={event.endTime ?? ""} onChange={(e) => updateEvent(index, { endTime: e.target.value })} /></div></div>
              <div className="md:col-span-2">
                <label className={label}>Event timezone</label>
                <input list={`event-timezones-${index}`} className={input} value={event.timezone || DEFAULT_EVENT_TIME_ZONE} onChange={(e) => updateEvent(index, { timezone: e.target.value })} placeholder="Asia/Jakarta" />
                <datalist id={`event-timezones-${index}`}>
                  <option value="Asia/Jakarta">WIB · Jakarta</option>
                  <option value="Asia/Makassar">WITA · Makassar</option>
                  <option value="Asia/Jayapura">WIT · Jayapura</option>
                  <option value="Asia/Singapore">Singapore</option>
                  <option value="Asia/Kuala_Lumpur">Kuala Lumpur</option>
                  <option value="Australia/Perth">Perth</option>
                </datalist>
                <p className="mt-1 text-xs text-neutral-500">Gunakan nama IANA timezone. Ini membuat countdown tetap benar walau tamu membuka undangan dari zona waktu berbeda.</p>
              </div>
              <div><label className={label}>Venue</label><input className={input} value={event.location} onChange={(e) => updateEvent(index, { location: e.target.value })} /></div>
              <div><label className={label}>Maps URL</label><input type="url" className={input} value={event.mapsUrl ?? ""} onChange={(e) => updateEvent(index, { mapsUrl: e.target.value })} /></div>
              <div className="md:col-span-2"><label className={label}>Address</label><textarea className={textarea} value={event.address} onChange={(e) => updateEvent(index, { address: e.target.value })} /></div>
              <div><label className={label}>Latitude (optional)</label><input type="number" step="any" className={input} value={event.latitude ?? ""} onChange={(e) => updateEvent(index, { latitude: e.target.value === "" ? undefined : Number(e.target.value) })} /></div>
              <div><label className={label}>Longitude (optional)</label><input type="number" step="any" className={input} value={event.longitude ?? ""} onChange={(e) => updateEvent(index, { longitude: e.target.value === "" ? undefined : Number(e.target.value) })} /></div>
            </div>
          </div>
        ))}
      </section>

      <section className={card}>
        <div className="flex items-center justify-between"><h3 className="text-base font-semibold text-neutral-100">Love Story</h3><button type="button" className={button} onClick={addStory}>+ Add story</button></div>
        {story.map((item, index) => (
          <div key={item.id} className="grid gap-3 rounded-md border border-white/10 p-4 md:grid-cols-2">
            <div><label className={label}>Date / year</label><input className={input} value={item.date ?? ""} onChange={(e) => updateStory(index, { date: e.target.value })} /></div>
            <div><label className={label}>Title</label><input className={input} value={item.title} onChange={(e) => updateStory(index, { title: e.target.value })} /></div>
            <div className="md:col-span-2"><label className={label}>Description</label><textarea className={textarea} value={item.description} onChange={(e) => updateStory(index, { description: e.target.value })} /></div>
            <div className="md:col-span-2"><ImageUpload id={`story-${item.id}`} value={item.image ?? ""} onChange={(url) => updateStory(index, { image: url })} uploadUrl={`/api/weddings/${weddingId}/upload`} /></div>
            <button type="button" className="justify-self-start text-xs text-red-300" onClick={() => setContent({ ...content, story: story.filter((_, i) => i !== index) })}>Remove story</button>
          </div>
        ))}
      </section>

      <section className={card}>
        <div className="flex items-center justify-between"><h3 className="text-base font-semibold text-neutral-100">Gallery</h3><button type="button" className={button} onClick={addGallery}>+ Add photo</button></div>
        <div className="grid gap-4 md:grid-cols-2">
          {gallery.map((image, index) => (
            <div key={image.id} className="space-y-3 rounded-md border border-white/10 p-4">
              <ImageUpload id={`gallery-${image.id}`} value={image.url} onChange={(url) => updateGallery(index, { url })} uploadUrl={`/api/weddings/${weddingId}/upload`} />
              <input className={input} placeholder="Alt / description" value={image.alt} onChange={(e) => updateGallery(index, { alt: e.target.value })} />
              <button type="button" className="text-xs text-red-300" onClick={() => setContent({ ...content, gallery: gallery.filter((_, i) => i !== index) })}>Remove photo</button>
            </div>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div><label className={label}>Gallery title</label><input className={input} value={content.galleryQuote?.title ?? "Gallery"} onChange={(e) => setContent({ ...content, galleryQuote: { title: e.target.value, text: content.galleryQuote?.text ?? "" } })} /></div>
          <div><label className={label}>Gallery quote</label><input className={input} value={content.galleryQuote?.text ?? ""} onChange={(e) => setContent({ ...content, galleryQuote: { title: content.galleryQuote?.title ?? "Gallery", text: e.target.value } })} /></div>
        </div>
      </section>

      <section className={card}>
        <div className="flex items-center justify-between"><h3 className="text-base font-semibold text-neutral-100">Digital Gift / Amplop</h3><label className="flex items-center gap-2 text-sm text-neutral-300"><input type="checkbox" checked={gifts.enabled} onChange={(e) => setContent({ ...content, gifts: { ...gifts, enabled: e.target.checked } })} /> Enabled</label></div>
        <div><label className={label}>Intro</label><textarea className={textarea} value={gifts.intro ?? ""} onChange={(e) => setContent({ ...content, gifts: { ...gifts, intro: e.target.value } })} /></div>
        <div className="flex justify-end"><button type="button" className={button} onClick={addAccount}>+ Add bank account</button></div>
        {gifts.bankAccounts.map((account, index) => (
          <div key={account.id} className="grid gap-3 rounded-md border border-white/10 p-4 md:grid-cols-3">
            <input className={input} placeholder="Bank" value={account.bankName} onChange={(e) => updateAccount(index, { bankName: e.target.value })} />
            <input className={input} placeholder="Account number" value={account.accountNumber} onChange={(e) => updateAccount(index, { accountNumber: e.target.value })} />
            <input className={input} placeholder="Account holder" value={account.accountHolder} onChange={(e) => updateAccount(index, { accountHolder: e.target.value })} />
            <button type="button" className="justify-self-start text-xs text-red-300" onClick={() => setContent({ ...content, gifts: { ...gifts, bankAccounts: gifts.bankAccounts.filter((_, i) => i !== index) } })}>Remove account</button>
          </div>
        ))}
        <div><label className={label}>QRIS image</label><ImageUpload id="gift-qris" value={gifts.qrisImageUrl ?? ""} onChange={(url) => setContent({ ...content, gifts: { ...gifts, qrisImageUrl: url } })} uploadUrl={`/api/weddings/${weddingId}/upload`} /></div>
        <div><label className={label}>Physical gift shipping address</label><textarea className={textarea} value={gifts.shippingAddress ?? ""} onChange={(e) => setContent({ ...content, gifts: { ...gifts, shippingAddress: e.target.value } })} /></div>
      </section>

      <section className={card}>
        <div className="flex items-center justify-between"><h3 className="text-base font-semibold text-neutral-100">Music</h3><button type="button" className={button} onClick={() => setContent({ ...content, music: [...music, { id: uid("music"), title: "", artist: "", url: "" }] })}>+ Add track</button></div>
        {music.map((track, index) => (
          <div key={track.id} className="grid gap-3 rounded-md border border-white/10 p-4 md:grid-cols-3">
            <input className={input} placeholder="Title" value={track.title} onChange={(e) => setContent({ ...content, music: music.map((item, i) => i === index ? { ...item, title: e.target.value } : item) })} />
            <input className={input} placeholder="Artist" value={track.artist} onChange={(e) => setContent({ ...content, music: music.map((item, i) => i === index ? { ...item, artist: e.target.value } : item) })} />
            <input className={input} placeholder="Licensed / owned audio URL" value={track.url} onChange={(e) => setContent({ ...content, music: music.map((item, i) => i === index ? { ...item, url: e.target.value } : item) })} />
            <button type="button" className="justify-self-start text-xs text-red-300" onClick={() => setContent({ ...content, music: music.filter((_, i) => i !== index) })}>Remove track</button>
          </div>
        ))}
        <label className="flex items-center gap-2 text-sm text-neutral-300"><input type="checkbox" checked={Boolean(content.musicSettings?.autoplayRequested)} onChange={(e) => setContent({ ...content, musicSettings: { autoplayRequested: e.target.checked } })} /> Request autoplay after browser/user gesture allows it</label>
      </section>

      <section className={card}>
        <h3 className="text-base font-semibold text-neutral-100">Quote / Blessing</h3>
        <div><label className={label}>Arabic / original text (optional)</label><textarea className={textarea} value={content.blessingMessage?.arabic ?? ""} onChange={(e) => setContent({ ...content, blessingMessage: { arabic: e.target.value, translation: content.blessingMessage?.translation ?? "", source: content.blessingMessage?.source ?? "" } })} /></div>
        <div><label className={label}>Translation / message</label><textarea className={textarea} value={content.blessingMessage?.translation ?? ""} onChange={(e) => setContent({ ...content, blessingMessage: { arabic: content.blessingMessage?.arabic ?? "", translation: e.target.value, source: content.blessingMessage?.source ?? "" } })} /></div>
        <div><label className={label}>Source</label><input className={input} value={content.blessingMessage?.source ?? ""} onChange={(e) => setContent({ ...content, blessingMessage: { arabic: content.blessingMessage?.arabic ?? "", translation: content.blessingMessage?.translation ?? "", source: e.target.value } })} /></div>
      </section>

      <div className="sticky bottom-4 z-20 flex justify-end rounded-xl border border-white/10 bg-[#0E0E10]/90 p-3 backdrop-blur">
        <button type="submit" disabled={saving} className="rounded-md bg-neutral-100 px-6 py-3 text-sm font-semibold text-neutral-950 disabled:opacity-50">{saving ? "Saving…" : "Save all content"}</button>
      </div>
    </form>
  );
}
