import Link from "next/link";

export const metadata = {
  title: "Terms of Service — ENDRIYA",
  description: "Ketentuan dasar penggunaan layanan undangan digital ENDRIYA.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F7F4ED] px-5 py-16 text-[#24231F]">
      <article className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#927A3D]">ENDRIYA</p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">Terms of Service</h1>
        <p className="mt-4 text-sm leading-7 text-black/60">Terakhir diperbarui: 7 September 2026</p>

        <div className="mt-10 space-y-9 text-sm leading-7 text-black/70">
          <section>
            <h2 className="font-serif text-2xl text-black/90">Ruang lingkup layanan</h2>
            <p className="mt-3">ENDRIYA menyediakan pembuatan dan pengelolaan undangan pernikahan digital, termasuk halaman undangan, template, link tamu, RSVP, ucapan, informasi lokasi, galeri, dan fitur pendukung lain sesuai paket atau kesepakatan layanan.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-black/90">Konten pelanggan</h2>
            <p className="mt-3">Pemesan bertanggung jawab memastikan bahwa foto, ilustrasi, musik, nama, logo, teks, dan materi lain yang diserahkan untuk digunakan pada undangan dapat digunakan secara sah. ENDRIYA berhak menolak materi yang berisiko melanggar hak pihak lain atau hukum yang berlaku.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-black/90">Musik dan media pihak ketiga</h2>
            <p className="mt-3">Ketersediaan fitur musik tidak berarti ENDRIYA memberikan lisensi atas lagu komersial. Pemesan harus memiliki izin atau dasar penggunaan yang sesuai untuk media yang dipilih. ENDRIYA dapat menyediakan opsi musik yang hak penggunaannya telah diverifikasi secara terpisah.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-black/90">Link dan data tamu</h2>
            <p className="mt-3">Pemesan bertanggung jawab atas daftar tamu yang dimasukkan ke layanan dan cara link personal dibagikan. Tamu dilarang menyalahgunakan fitur RSVP, ucapan, atau endpoint publik untuk spam, otomatisasi berlebihan, atau upaya akses yang tidak sah.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-black/90">Perubahan dan ketersediaan</h2>
            <p className="mt-3">Fitur, template, atau detail operasional dapat berubah selama pengembangan dan pemeliharaan. Untuk pesanan berbayar, ruang lingkup final, revisi, jadwal, harga, dan kebijakan pembatalan mengikuti penawaran atau kesepakatan komersial yang berlaku pada pesanan tersebut.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-black/90">Batasan teknis</h2>
            <p className="mt-3">Layanan bergantung pada jaringan, browser, hosting, penyimpanan, domain, dan penyedia infrastruktur lain. ENDRIYA berupaya menjaga layanan tersedia dan aman, tetapi tidak menjamin layanan tanpa gangguan pada setiap perangkat atau jaringan.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-black/90">Status dokumen</h2>
            <p className="mt-3">Ketentuan ini adalah baseline produk pra-peluncuran. Ketentuan komersial final harus ditinjau kembali setelah identitas badan usaha, metode pembayaran, kebijakan refund, retensi data, dan wilayah layanan final ditetapkan.</p>
          </section>
        </div>

        <div className="mt-12 border-t border-black/10 pt-6 text-sm">
          <Link href="/privacy" className="underline underline-offset-4">Privacy & Guest Data Notice</Link>
        </div>
      </article>
    </main>
  );
}
