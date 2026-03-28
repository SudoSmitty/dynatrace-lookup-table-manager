/**
 * api/platformFetch.ts
 * ---------------------------------------------------------------------------
 * Thin wrapper around the platform `fetch` that automatically targets the
 * current Dynatrace environment and includes required headers.
 *
 * In Dynatrace AppEngine applications the global `fetch` is already
 * scoped to the environment URL. We just make sure the right headers
 * and error handling are applied consistently.
 */

const BASE_PATH = "/platform/storage/resource-store/v1";
const QUERY_PATH = "/platform/storage/query/v1/query:execute";

export interface PlatformRequestInit extends RequestInit {
  /** If true the response body is returned as-is (Blob/ReadableStream). */
  rawBody?: boolean;
}

/**
 * Execute a fetch against a Dynatrace platform path.
 * Throws a descriptive error when the response is not OK.
 */
export async function platformFetch<T = unknown>(
  path: string,
  init?: PlatformRequestInit
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.error?.message ?? body?.message ?? JSON.stringify(body);
    } catch {
      detail = await response.text().catch(() => "");
    }
    throw new Error(
      `Platform API error ${response.status}: ${detail || response.statusText}`
    );
  }

  // Some callers need raw body (e.g., file download)
  if (init?.rawBody) {
    return response as unknown as T;
  }

  // Return parsed JSON or empty object for 204 No Content
  if (response.status === 204) {
    return {} as T;
  }
  return response.json() as Promise<T>;
}

/** Shortcut for Resource Store paths. */
export function resourceStoreFetch<T = unknown>(
  subPath: string,
  init?: PlatformRequestInit
): Promise<T> {
  return platformFetch<T>(`${BASE_PATH}${subPath}`, init);
}

/**
 * Execute a DQL query via query:execute and poll until results are ready.
 *
 * The query:execute API is asynchronous:
 *   1. POST the query → get back { state, requestToken, result?, ... }
 *   2. If state !== "SUCCEEDED", poll with the requestToken until it is.
 *
 * Returns the full response body (caller extracts records).
 */
export async function queryFetch<T = unknown>(body: object): Promise<T> {
  // Initial request
  let data = await platformFetch<Record<string, unknown>>(QUERY_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  console.log("[queryFetch] Initial response state:", data.state, "keys:", Object.keys(data));

  // Poll if the query is not yet complete
  const token = data.requestToken as string | undefined;
  let attempts = 0;
  while (
    token &&
    data.state !== "SUCCEEDED" &&
    data.state !== "FAILED" &&
    data.state !== "CANCELLED" &&
    attempts < 30
  ) {
    attempts++;
    await new Promise((r) => setTimeout(r, 500));
    data = await platformFetch<Record<string, unknown>>(
      `${QUERY_PATH}?request-token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    console.log("[queryFetch] Poll attempt", attempts, "state:", data.state);
  }

  if (data.state === "FAILED" || data.state === "CANCELLED") {
    throw new Error(`DQL query ${data.state}: ${JSON.stringify(data.error ?? data.progress ?? "")}`);
  }

  console.log("[queryFetch] Final keys:", Object.keys(data));
  if (data.result) {
    console.log("[queryFetch] result keys:", Object.keys(data.result as Record<string, unknown>));
  }

  return data as T;
}
