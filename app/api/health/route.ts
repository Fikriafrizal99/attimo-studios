export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      status: "ok",
      service: "wedding-invitation",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
