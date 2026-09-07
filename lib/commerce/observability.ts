const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{8,96}$/;

export function requestIdFrom(request: Request): string {
  const value = request.headers.get("x-request-id")?.trim() || "";
  return REQUEST_ID_PATTERN.test(value) ? value : "unassigned";
}

export function createRequestId(request?: Request): string {
  const existing = request ? requestIdFrom(request) : "unassigned";
  if (existing !== "unassigned") return existing;
  return crypto.randomUUID();
}

type SafeLogContext = Record<string, string | number | boolean | null | undefined>;

/**
 * Structured server-side error event. Callers must pass only non-sensitive
 * context: never guest tokens, session tokens, passwords, service keys, raw
 * request bodies, or database credentials.
 */
export function logServerError(
  event: string,
  request: Request | null,
  error: unknown,
  context: SafeLogContext = {}
) {
  const isProduction = process.env.NODE_ENV === "production";
  const errorName = error instanceof Error ? error.name : "UnknownError";
  const developmentMessage =
    !isProduction && error instanceof Error ? error.message.slice(0, 500) : undefined;

  console.error(
    JSON.stringify({
      level: "error",
      event,
      requestId: request ? requestIdFrom(request) : "unassigned",
      timestamp: new Date().toISOString(),
      errorName,
      ...(developmentMessage ? { errorMessage: developmentMessage } : {}),
      ...context,
    })
  );
}
