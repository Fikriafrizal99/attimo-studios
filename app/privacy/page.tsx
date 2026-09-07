import Link from "next/link";

export const metadata = {
  title: "Privacy & Guest Data Notice — ENDRIYA",
  description: "Informasi dasar mengenai data tamu dan penggunaan layanan undangan digital ENDRIYA.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F7F4ED] px-5 py-16 text-[#24231F]">
      <article className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#927A3D]">ENDRIYA</p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">Privacy & Guest Data Notice</h1>
        <p className="mt-4 text-sm leading-7 text-black/60">Terakhir diperbarui: 7 September 2026</p>

        <div className="mt-10 space-y-9 text-sm leading-7 text-black/70">
          <section>
            <h2 className="font-serif text-2xl text-black/90">Data yang dapat diproses</h2>
            <p className="mt-3">Untuk menyediakan undangan digital, data dapat mencakup nama pasangan, detail acara, foto/media yang diberikan pemesan, nama tamu, batas jumlah tamu, status RSVP, pesan RSVP, serta ucapan yang dikirim melalui halaman undangan.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-black/90">Tujuan penggunaan</h2>
            <p className="mt-3">Data digunakan untuk menampilkan undangan, membuat link tamu personal, mencatat RSVP, menampilkan atau memoderasi ucapan, membantu operator mengelola acara, menjaga keamanan layanan, dan menangani gangguan teknis.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-black/90">Link tamu personal</h2>
            <p className="mt-3">Link personal dapat memuat token yang mengidentifikasi undangan tamu tertentu. Jangan membagikan link tersebut secara publik jika pemilik acara menghendaki RSVP tetap terkait dengan tamu yang dituju.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-black/90">Ucapan dan RSVP</h2>
            <p className="mt-3">Ucapan yang berstatus terlihat dapat ditampilkan kepada pengunjung undangan. Pemilik/operator acara dapat menyembunyikan atau menandai ucapan sebagai spam. Data RSVP tidak dimaksudkan sebagai daftar publik dan digunakan untuk kebutuhan pengelolaan kehadiran acara.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-black/90">Penyimpanan dan keamanan</h2>
            <p className="mt-3">ENDRIYA menerapkan pemisahan data per wedding/tenant, kontrol akses operator, pembatasan akses penyimpanan, pembatasan permintaan publik, dan logging server yang dirancang untuk tidak mencatat token atau secret sensitif. Tidak ada sistem yang dapat menjamin keamanan absolut.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-black/90">Permintaan terkait data</h2>
            <p className="mt-3">Tamu dapat menghubungi pasangan atau operator yang mengirimkan undangan untuk meminta koreksi atau penghapusan data yang terkait dengan acara tersebut. Prosedur operasional final dan periode retensi akan ditetapkan sebelum peluncuran komersial.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-black/90">Status dokumen</h2>
            <p className="mt-3">Dokumen ini adalah baseline produk sebelum peluncuran dan bukan pengganti peninjauan hukum yang diperlukan untuk model bisnis, wilayah operasi, dan kebijakan retensi final ENDRIYA.</p>
          </section>
        </div>

        <div className="mt-12 border-t border-black/10 pt-6 text-sm">
          <Link href="/terms" className="underline underline-offset-4">Terms of Service</Link>
        </div>
      </article>
    </main>
  );
}
