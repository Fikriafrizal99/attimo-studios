import assert from "node:assert/strict";
import { normalizeWeddingContent } from "@/lib/commerce/content";
import { buildPublicInvitationMetadata } from "@/lib/commerce/public-metadata";
import { resolveWeddingSubdomainSlug } from "@/lib/commerce/subdomain";
import { buildInvitationUrl } from "@/lib/commerce/url";
import { defaultContent } from "@/lib/wedding-defaults";

const originalBaseUrl = process.env.PUBLIC_INVITATION_BASE_URL;
const originalMode = process.env.PUBLIC_INVITATION_MODE;

try {
  process.env.PUBLIC_INVITATION_BASE_URL = "https://wedding.example.com";
  process.env.PUBLIC_INVITATION_MODE = "path";

  assert.equal(
    buildInvitationUrl({ slug: "fikri-aluna", guestToken: "guest-token" }),
    "https://wedding.example.com/invite/fikri-aluna?guest=guest-token"
  );

  const content = normalizeWeddingContent({
    ...defaultContent,
    couple: {
      bride: { ...defaultContent.couple.bride, name: "Aluna" },
      groom: { ...defaultContent.couple.groom, name: "Fikri" },
    },
    hero: {
      ...defaultContent.hero,
      subtitle: "Kami mengundang Anda untuk merayakan hari bahagia kami.",
      coverImage: "https://cdn.example.com/hero.jpg",
    },
  });

  const metadata = buildPublicInvitationMetadata({ slug: "fikri-aluna", content });
  assert.equal(metadata.title, "Aluna & Fikri");
  assert.equal(
    String(metadata.alternates?.canonical),
    "https://wedding.example.com/invite/fikri-aluna"
  );
  assert.equal(metadata.robots && typeof metadata.robots === "object" ? metadata.robots.index : null, true);

  process.env.PUBLIC_INVITATION_MODE = "subdomain";
  assert.equal(
    buildInvitationUrl({ slug: "fikri-aluna", guestToken: "guest-token" }),
    "https://fikri-aluna.wedding.example.com/?guest=guest-token"
  );

  assert.equal(
    resolveWeddingSubdomainSlug({
      requestHost: "fikri-aluna.wedding.example.com:443",
      baseUrl: "https://wedding.example.com",
    }),
    "fikri-aluna"
  );

  assert.equal(
    resolveWeddingSubdomainSlug({
      requestHost: "fikri-aluna.wedding.example.com, internal-proxy.local",
      baseUrl: "https://wedding.example.com",
    }),
    "fikri-aluna"
  );

  assert.equal(
    resolveWeddingSubdomainSlug({
      requestHost: "foo.bar.wedding.example.com",
      baseUrl: "https://wedding.example.com",
    }),
    null
  );

  assert.equal(
    resolveWeddingSubdomainSlug({
      requestHost: "admin.wedding.example.com",
      baseUrl: "https://wedding.example.com",
    }),
    null
  );

  assert.equal(
    resolveWeddingSubdomainSlug({
      requestHost: "wedding.example.com",
      baseUrl: "https://wedding.example.com",
    }),
    null
  );

  const subdomainMetadata = buildPublicInvitationMetadata({ slug: "fikri-aluna", content });
  assert.equal(
    String(subdomainMetadata.alternates?.canonical),
    "https://fikri-aluna.wedding.example.com/"
  );

  console.log("Phase 4.2 public routing verification passed");
} finally {
  if (originalBaseUrl === undefined) delete process.env.PUBLIC_INVITATION_BASE_URL;
  else process.env.PUBLIC_INVITATION_BASE_URL = originalBaseUrl;

  if (originalMode === undefined) delete process.env.PUBLIC_INVITATION_MODE;
  else process.env.PUBLIC_INVITATION_MODE = originalMode;
}
