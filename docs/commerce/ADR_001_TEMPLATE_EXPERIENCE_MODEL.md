# ADR-001 — Template Experience Model

**Status:** Accepted
**Date:** 2026-09-05
**Branch:** `develop/commerce-foundation`

## Context

Platform menggunakan satu shared wedding data model dan satu shared business core untuk banyak undangan. Pertanyaan arsitektur yang harus diputuskan adalah apakah semua template harus mengikuti struktur visual yang hampir sama, atau apakah template boleh memiliki pengalaman yang sangat berbeda termasuk 2D, 2.5D, dan 3D.

Jika semua template dipaksa memakai layout visual yang sama, produksi template memang sederhana tetapi katalog akan cepat terasa repetitif dan nilai komersialnya rendah.

Jika setiap template membangun ulang seluruh business logic, variasi visual meningkat tetapi keamanan, maintainability, RSVP, guest management, publishing, dan data consistency menjadi sulit dikendalikan.

## Decision

Kami memilih model:

> **Shared semantic core, independent visual experience.**

Wedding content, guest, RSVP, wishes, gift, publish, security, dan business rules tetap shared. Template hanya bertanggung jawab pada presentation/composition dan pengalaman interaksi.

Template dapat memiliki salah satu experience level:

- `standard-2d`
- `motion-2d`
- `2.5d`
- `immersive-3d`

Level tersebut bukan batas hierarki kualitas; template 2D dapat tetap merupakan produk premium. Experience level menjelaskan teknologi dan interaction profile.

## Consequences

### Positive

- satu wedding dapat berpindah template tanpa input data ulang,
- katalog dapat memiliki visual diversity nyata,
- RSVP/guest/security logic tidak terduplikasi,
- 3D dapat dijual sebagai pengalaman khusus tanpa membebani semua template,
- family/category template dapat berkembang tanpa hard cap,
- package pricing dapat dipisah dari visual technology.

### Trade-offs

- canonical content schema harus cukup semantic dan stabil,
- template compatibility perlu divalidasi,
- template testing menjadi bagian penting dari CI/QA,
- 2.5D/3D memerlukan performance budget dan fallback,
- template authors harus mengikuti contract shared core.

## Constraints

1. Tidak ada template yang boleh bergantung pada 3D untuk menyampaikan detail acara penting.
2. Immersive 3D harus menyediakan fallback/skip experience.
3. 3D runtime hanya dimuat ketika template membutuhkannya.
4. `prefers-reduced-motion` harus dihormati.
5. Variasi warna/font saja dianggap theme variant, bukan template terpisah, kecuali ada perbedaan pengalaman/desain yang substantif.
6. Business logic tenant-sensitive tidak boleh di-copy ke template.
7. Mobile usability adalah constraint utama seluruh template.

## Example

Wedding yang sama:

```text
Fikri & Aluna
├── couple data
├── events
├── gallery
├── guests
├── RSVP
├── wishes
└── gifts
```

Dapat dirender sebagai:

```text
Sunda Floral Priangan 2D
Sunda Royal Motion
Sunda Garden 2.5D
Sunda Immersive Gate 3D
Modern Editorial 2D
Luxury Cinematic Motion
```

tanpa menduplikasi wedding data.

## Related Documents

- `PRD_V1.md`
- `TECHNICAL_ARCHITECTURE_V1.md`
- `TEMPLATE_EXPERIENCE_STRATEGY.md`
