import { requireDbPool } from "@/lib/db";
import { logServerError, requestIdFrom } from "@/lib/commerce/observability";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const requestId = requestIdFrom(request);
  try {
    const result = await requireDbPool().query<{
      weddings_table: string | null;
      auth_user_table: string | null;
      auth_rate_limit_table: string | null;
      public_rate_limit_table: string | null;
    }>(`
      SELECT
        to_regclass('public.weddings')::text AS weddings_table,
        to_regclass('public."user"')::text AS auth_user_table,
        to_regclass('public."rateLimit"')::text AS auth_rate_limit_table,
        to_regclass('app_private.public_rate_limits')::text AS public_rate_limit_table
    `);

    const row = result.rows[0];
    const schemaReady = Boolean(
      row?.weddings_table &&
      row?.auth_user_table &&
      row?.auth_rate_limit_table &&
      row?.public_rate_limit_table
    );

    if (!schemaReady) {
      return Response.json(
        {
          status: "not_ready",
          service: "endriya",
          check: "readiness",
          reason: "database_schema_incomplete",
          requestId,
          timestamp: new Date().toISOString(),
        },
        {
          status: 503,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    return Response.json(
      {
        status: "ready",
        service: "endriya",
        check: "readiness",
        database: "ok",
        latencyMs: Date.now() - startedAt,
        requestId,
        timestamp: new Date().toISOString(),
      },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (error) {
    logServerError("readiness_check_failed", request, error);
    return Response.json(
      {
        status: "not_ready",
        service: "endriya",
        check: "readiness",
        reason: "database_unavailable",
        requestId,
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }
}
