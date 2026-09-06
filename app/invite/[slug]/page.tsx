import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { InvitationRenderer } from "@/components/invitation/InvitationRenderer";
import {
  loadPublicInvitation,
  loadReleasedWeddingBySlug,
} from "@/lib/commerce/public-invitation";
import { buildPublicInvitationMetadata } from "@/lib/commerce/public-metadata";
import {
  buildInvitationUrl,
  getInvitationMode,
} from "@/lib/commerce/url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
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

export default async function PublicInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ guest?: string | string[] }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const guestToken = typeof query.guest === "string" ? query.guest : undefined;

  const invitation = await loadPublicInvitation(slug, guestToken);
  if (!invitation) notFound();

  if (getInvitationMode() === "subdomain") {
    permanentRedirect(
      buildInvitationUrl({
        slug: invitation.slug,
        guestToken: invitation.guest?.token,
      })
    );
  }

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
