import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { InvitationRenderer } from "@/components/invitation/InvitationRenderer";
import {
  loadPublicInvitation,
  loadReleasedWeddingBySlug,
} from "@/lib/commerce/public-invitation";
import { buildPublicInvitationMetadata } from "@/lib/commerce/public-metadata";

async function getSubdomainSlug(): Promise<string | null> {
  const requestHeaders = await headers();
  return requestHeaders.get("x-wedding-slug")?.trim().toLowerCase() || null;
}

export async function generateMetadata(): Promise<Metadata> {
  const slug = await getSubdomainSlug();
  if (!slug) {
    return {
      title: "Invitation not found",
      robots: { index: false, follow: false },
    };
  }

  const wedding = await loadReleasedWeddingBySlug(slug);
  if (!wedding) {
    return {
      title: "Invitation not found",
      robots: { index: false, follow: false },
    };
  }

  return buildPublicInvitationMetadata({
    slug: wedding.slug,
    content: wedding.content,
  });
}

/**
 * Internal route targeted by the optional subdomain proxy rewrite.
 * Path-based production invitations use /invite/[slug].
 */
export default async function InvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ guest?: string | string[] }>;
}) {
  const slug = await getSubdomainSlug();
  if (!slug) notFound();

  const query = await searchParams;
  const guestToken = typeof query.guest === "string" ? query.guest : undefined;
  const invitation = await loadPublicInvitation(slug, guestToken);
  if (!invitation) notFound();

  return (
    <InvitationRenderer
      weddingId={invitation.id}
      publicSlug={invitation.slug}
      templateId={invitation.templateId}
      content={invitation.content}
      sections={invitation.sections}
      theme={invitation.theme}
      guest={invitation.guest}
    />
  );
}
