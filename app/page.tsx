import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { EndriyaLanding } from "@/components/landing/EndriyaLanding";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ENDRIYA — Digital Wedding Experience",
  description:
    "One complete wedding platform with 2D, 2.5D, and 3D visual experiences.",
};

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user) redirect("/dashboard");

  return <EndriyaLanding />;
}
