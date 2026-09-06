import type { Metadata } from "next";
import { buildInvitationUrl } from "@/lib/commerce/url";
import type { CanonicalWeddingContent } from "@/lib/wedding-contract";

function nonEmpty(...values: Array<string | undefined | null>): string | undefined {
  return values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim();
}

function getTitle(content: CanonicalWeddingContent): string {
  const coupleNames = [content.couple.bride.name, content.couple.groom.name]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" & ");
  return coupleNames || nonEmpty(content.hero.title) || "Wedding Invitation";
}

function getDescription(content: CanonicalWeddingContent, title: string): string {
  const primaryEvent = content.events.find((event) => event.isPrimary) ?? content.events[0];
  const eventSummary = primaryEvent
    ? [primaryEvent.title, primaryEvent.location].map((value) => value.trim()).filter(Boolean).join(" — ")
    : "";

  return (
    nonEmpty(content.hero.subtitle, content.hero.greeting, eventSummary) ||
    `Undangan pernikahan ${title}`
  );
}

function getPreviewImage(content: CanonicalWeddingContent): string | undefined {
  return nonEmpty(
    content.hero.coverImage,
    content.gallery[0]?.url,
    content.couple.bride.image,
    content.couple.groom.image
  );
}

export function buildPublicInvitationMetadata(options: {
  slug: string;
  content: CanonicalWeddingContent;
}): Metadata {
  const title = getTitle(options.content);
  const description = getDescription(options.content, title);
  const canonical = buildInvitationUrl({ slug: options.slug });
  const image = getPreviewImage(options.content);

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: "ENDRIYA",
      title,
      description,
      url: canonical,
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}
