// HTTP for the live checks.
//
// These scripts are meant to run in GitHub Actions, which has open egress. They
// are also going to be run by hand from environments that do not — a sandboxed
// agent session, a locked-down laptop — and a policy denial there must read as
// "this environment cannot reach the host", never as "the host is down". A
// canary that cries wolf gets muted, and a muted canary is worse than none.

const USER_AGENT =
  "suede-profile-canary/1.0 (+https://github.com/JasonColapietro/JasonColapietro)";

/**
 * A policy denial can arrive two ways, and both must read as "this environment
 * cannot reach the host" rather than as a verdict about the host:
 *
 *   - as a thrown error, when the proxy refuses the CONNECT tunnel;
 *   - as an ordinary HTTP response, when the proxy answers the request itself.
 *
 * The second is the dangerous one. A gateway that returns 403 with its own
 * explanatory body is indistinguishable from the origin returning 403 unless
 * something identifies the responder — so check for the deny header these
 * proxies set, and fall back to the shape of the body.
 */
const isDeniedResponse = (response, body) => {
  if (response.headers.has("x-deny-reason")) return true;
  if (response.status !== 403 && response.status !== 407) return false;
  return /not in allowlist|egress|blocked by|proxy denied/i.test(body ?? "");
};

/** Errors that mean the environment, not the destination, said no. */
const isEgressDenial = (error) => {
  const text = `${error?.message ?? ""} ${error?.cause?.message ?? ""}`.toLowerCase();
  return (
    text.includes("egress") ||
    text.includes("blocked") ||
    text.includes("403 to connect") ||
    text.includes("tunnel") ||
    text.includes("proxy")
  );
};

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch with a timeout and bounded retries.
 *
 * Returns a plain result rather than throwing, because every caller wants to
 * record the outcome and carry on rather than abort the whole sweep on the
 * first dead link.
 */
export async function probe(url, { method = "GET", timeoutMs = 15000, retries = 2, headers = {} } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (attempt > 0) await sleep(500 * 2 ** (attempt - 1));

    try {
      const response = await fetch(url, {
        method,
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
        headers: { "user-agent": USER_AGENT, ...headers },
      });

      if (RETRYABLE_STATUS.has(response.status) && attempt < retries) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }

      // Peek at a 403/407 body before handing the response on. Cloning keeps
      // the body readable by the caller, which still needs it for a real 402.
      if (response.status === 403 || response.status === 407) {
        let body = "";
        try {
          body = await response.clone().text();
        } catch {
          // An unreadable body just means we fall back to the header check.
        }
        if (isDeniedResponse(response, body)) {
          return {
            ok: false,
            status: response.status,
            finalUrl: url,
            redirected: false,
            contentType: "",
            error: new Error(response.headers.get("x-deny-reason") ?? "egress policy denial"),
            blocked: true,
          };
        }
      }

      return {
        ok: response.ok,
        status: response.status,
        // Compared against the requested URL to surface silent redirects: a
        // link that 301s somewhere else still "works" and still misdocuments
        // where the canonical surface lives.
        finalUrl: response.url,
        redirected: response.redirected,
        contentType: response.headers.get("content-type") ?? "",
        response,
      };
    } catch (error) {
      lastError = error;
      if (isEgressDenial(error)) break;
    }
  }

  return {
    ok: false,
    status: 0,
    finalUrl: url,
    redirected: false,
    contentType: "",
    error: lastError,
    blocked: isEgressDenial(lastError),
  };
}

/** Fetch and parse JSON, keeping parse failure distinct from transport failure. */
export async function probeJson(url, options = {}) {
  const result = await probe(url, { ...options, headers: { accept: "application/json", ...options.headers } });
  if (!result.ok) return { ...result, json: null };

  try {
    return { ...result, json: await result.response.json() };
  } catch (error) {
    return { ...result, ok: false, json: null, parseError: error };
  }
}

/**
 * True when the process should treat a blocked environment as "cannot audit"
 * rather than "audit failed". Actions sets CI; a denial there is a real one.
 */
export const toleratesBlocking = () => !process.env.CI;
