import { WEDDING_SECTION_IDS, type CanonicalWeddingContent, type SectionConfig } from "@/lib/wedding-contract";

function svgData(label: string, a: string, b: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="900" height="1100" fill="url(#g)"/><circle cx="450" cy="360" r="150" fill="rgba(255,255,255,.45)"/><path d="M210 1030c25-250 140-390 240-390s215 140 240 390" fill="rgba(255,255,255,.35)"/><text x="450" y="1010" text-anchor="middle" fill="white" font-family="Georgia" font-size="34" letter-spacing="8">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const TEMPLATE_PREVIEW_CONTENT: CanonicalWeddingContent = {
  schemaVersion: 1,
  couple: {
    bride: {
      name: "Aluna Putri Sophia",
      shortName: "Aluna",
      username: "@aluna",
      parentInfo: "Putri dari Bapak Ahmad & Ibu Siti",
      location: "Cianjur, Jawa Barat",
      image: svgData("ALUNA", "#d9c2b0", "#7f675d"),
    },
    groom: {
      name: "Mochamad Fikri Afrizal",
      shortName: "Fikri",
      username: "@fikri",
      parentInfo: "Putra dari Bapak Hendra & Ibu Rina",
      location: "Cianjur, Jawa Barat",
      image: svgData("FIKRI", "#bac7c1", "#485951"),
    },
  },
  hero: {
    greeting: "The Wedding of",
    title: "Aluna & Fikri",
    subtitle: "Dengan penuh syukur, kami mengundang Anda untuk menjadi bagian dari hari ketika dua perjalanan menjadi satu.",
    quote: "And of His signs is that He created for you from yourselves mates that you may find tranquility in them.",
    coverImage: svgData("ENDRIYA", "#cdbca4", "#544a43"),
    coverVideo: "",
    countdownEventId: "akad",
  },
  events: [
    {
      id: "akad",
      title: "Akad Nikah",
      date: "2026-12-12",
      time: "09:00",
      endTime: "10:00",
      timezone: "Asia/Jakarta",
      location: "Grand Ballroom Cianjur",
      address: "Jl. Siliwangi No. 88, Cianjur, Jawa Barat",
      mapsUrl: "https://maps.google.com/?q=Cianjur",
      isPrimary: true,
    },
    {
      id: "reception",
      title: "Resepsi",
      date: "2026-12-12",
      time: "11:00",
      endTime: "14:00",
      timezone: "Asia/Jakarta",
      location: "Grand Ballroom Cianjur",
      address: "Jl. Siliwangi No. 88, Cianjur, Jawa Barat",
      mapsUrl: "https://maps.google.com/?q=Cianjur",
      isPrimary: false,
    },
  ],
  story: [
    { id: "meet", date: "2019", title: "First Meet", description: "Percakapan sederhana menjadi awal dari perjalanan panjang yang tidak pernah kami rencanakan." },
    { id: "journey", date: "2022", title: "Growing Together", description: "Kami belajar bahwa rumah bukan hanya tempat, tetapi seseorang yang selalu membuat perjalanan terasa pulang." },
    { id: "proposal", date: "2026", title: "The Next Chapter", description: "Dengan restu keluarga, kami memilih untuk melanjutkan cerita ini dalam ikatan pernikahan." },
  ],
  gallery: [
    { id: "g1", url: svgData("01", "#cab5a5", "#765f55"), alt: "Preview photo one" },
    { id: "g2", url: svgData("02", "#aabbb3", "#4d5f58"), alt: "Preview photo two" },
    { id: "g3", url: svgData("03", "#d3c3a8", "#71644f"), alt: "Preview photo three" },
    { id: "g4", url: svgData("04", "#c4afb7", "#65505a"), alt: "Preview photo four" },
    { id: "g5", url: svgData("05", "#b8c2ca", "#53616c"), alt: "Preview photo five" },
    { id: "g6", url: svgData("06", "#d7c0aa", "#79614d"), alt: "Preview photo six" },
  ],
  gifts: {
    enabled: true,
    intro: "Doa restu Anda adalah hadiah terindah bagi kami.",
    bankAccounts: [{ id: "bca", bankName: "BCA", accountNumber: "1234567890", accountHolder: "Mochamad Fikri Afrizal" }],
    qrisImageUrl: "",
    shippingAddress: "Cianjur, Jawa Barat",
  },
  music: [],
  musicSettings: { autoplayRequested: false },
  blessingMessage: {
    arabic: "وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُمْ مِنْ أَنْفُسِكُمْ أَزْوَاجًا",
    translation: "Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu.",
    source: "QS. Ar-Rum: 21",
  },
  galleryQuote: { title: "Selected Memories", text: "A few frames from the story that brought us here." },
};

export const TEMPLATE_PREVIEW_SECTIONS: SectionConfig[] = WEDDING_SECTION_IDS.map((id, order) => ({
  id,
  enabled: true,
  order,
}));
