// Pure validation for the x402 resource manifest and the A2A agent card.
//
// Kept separate from the fetching so it can be tested against fixtures. The
// canary that uses it runs against the live host, which not every environment
// can reach; the rules themselves should still be covered by the test suite.

/**
 * Locate the resource list without over-fitting to one serialization.
 *
 * The x402 discovery document has moved between a bare array, a top-level
 * `resources` key, and a paginated `items` key across draft revisions. Guessing
 * wrong should read as "shape not recognised", not as "the manifest is empty" —
 * an empty-looking manifest would silently pass a canary that only iterates.
 */
export const resourcesOf = (manifest) => {
  if (Array.isArray(manifest)) return { resources: manifest, shape: "array" };
  if (Array.isArray(manifest?.resources)) return { resources: manifest.resources, shape: "resources" };
  if (Array.isArray(manifest?.items)) return { resources: manifest.items, shape: "items" };
  return { resources: null, shape: "unrecognised" };
};

/** The payment terms attached to a resource, under either spelling. */
export const acceptsOf = (resource) => {
  if (Array.isArray(resource?.accepts)) return resource.accepts;
  if (Array.isArray(resource?.paymentRequirements)) return resource.paymentRequirements;
  return [];
};

/** The absolute URL a resource entry points at, under any of its spellings. */
export const resourceUrl = (resource) => {
  const candidate =
    (typeof resource?.resource === "string" && resource.resource) ||
    (typeof resource?.url === "string" && resource.url) ||
    (typeof resource?.path === "string" && resource.path) ||
    acceptsOf(resource).find((entry) => typeof entry?.resource === "string")?.resource;
  return typeof candidate === "string" ? candidate : null;
};

// Fields an x402 payment requirement needs before a client can act on it. A
// requirement missing any of these advertises a price nobody can pay. The
// amount is checked separately because it is spelled differently across
// protocol versions.
const REQUIRED_ACCEPT_FIELDS = ["scheme", "network", "payTo", "asset"];

/**
 * The atomic-unit price, under either spelling.
 *
 * v1 calls this `maxAmountRequired`; v2 carries `amount`. Reading only the v1
 * name would mark every valid v2 requirement as having no price, and — worse,
 * because it fails open rather than loud — would leave compareTerms unable to
 * see v2 price drift at all, which is the single thing this canary exists to
 * catch. Suede's own SDK shipped a v2 client in August 2026, so this is a live
 * concern rather than a hypothetical one.
 */
export const amountOf = (accept) => {
  for (const key of ["maxAmountRequired", "amount"]) {
    const value = accept?.[key];
    if (value !== undefined && value !== null && value !== "") return { value, key };
  }
  return { value: undefined, key: "maxAmountRequired" };
};

/** The HTTP method a resource advertises, defaulting to GET. */
export const methodOf = (resource) => {
  const candidates = [resource?.method, resource?.httpMethod, ...acceptsOf(resource).map((a) => a?.method)];
  const found = candidates.find((m) => typeof m === "string" && m.trim() !== "");
  return found ? found.trim().toUpperCase() : "GET";
};

/** Findings for one payment-requirement entry. */
export const validateAccept = (accept, label) => {
  const problems = [];
  if (!accept || typeof accept !== "object") {
    return [{ severity: "fail", message: `${label}: payment requirement is not an object` }];
  }

  for (const field of REQUIRED_ACCEPT_FIELDS) {
    if (accept[field] === undefined || accept[field] === null || accept[field] === "") {
      problems.push({ severity: "fail", message: `${label}: missing ${field}` });
    }
  }

  // Amounts are atomic-unit strings in x402. A number here is a precision bug
  // waiting to happen, and a non-numeric string cannot be charged at all.
  const { value: amount, key: amountKey } = amountOf(accept);
  if (amount === undefined) {
    problems.push({ severity: "fail", message: `${label}: missing maxAmountRequired (or its v2 spelling, amount)` });
  } else if (typeof amount === "number") {
    problems.push({ severity: "warn", message: `${label}: ${amountKey} is a number; x402 expects an atomic-unit string` });
  } else if (typeof amount === "string" && !/^\d+$/.test(amount)) {
    problems.push({ severity: "fail", message: `${label}: ${amountKey} is not an atomic-unit integer string: ${amount}` });
  }

  for (const field of ["payTo", "asset"]) {
    const value = accept[field];
    if (typeof value === "string" && value.startsWith("0x") && !/^0x[0-9a-fA-F]{40}$/.test(value)) {
      problems.push({ severity: "fail", message: `${label}: ${field} is not a well-formed address: ${value}` });
    }
  }

  return problems;
};

/** Findings for the manifest as a whole. */
export const validateManifest = (manifest) => {
  const problems = [];
  const { resources, shape } = resourcesOf(manifest);

  if (shape === "unrecognised" || !resources) {
    return {
      resources: [],
      problems: [{ severity: "fail", message: "manifest has no recognisable resource list (expected an array, or a `resources` or `items` key)" }],
    };
  }

  if (resources.length === 0) {
    problems.push({ severity: "fail", message: "manifest advertises no resources" });
  }

  const version = manifest?.x402Version ?? resources[0]?.x402Version;
  if (version === undefined) {
    problems.push({ severity: "warn", message: "manifest does not state an x402Version" });
  }

  const seen = new Set();
  for (const [index, resource] of resources.entries()) {
    const url = resourceUrl(resource);
    const label = url ?? `resource[${index}]`;

    if (!url) {
      problems.push({ severity: "fail", message: `resource[${index}] has no resource URL` });
    } else if (seen.has(url)) {
      problems.push({ severity: "warn", message: `${url} is advertised more than once` });
    } else {
      seen.add(url);
    }

    const accepts = acceptsOf(resource);
    if (accepts.length === 0) {
      problems.push({ severity: "fail", message: `${label}: no payment requirements attached` });
    }
    for (const [j, accept] of accepts.entries()) {
      problems.push(...validateAccept(accept, `${label} accepts[${j}]`));
    }
  }

  return { resources, problems };
};

// Fields the A2A specification requires of an agent card. A card missing these
// is not discoverable by a conforming client even when it parses.
const REQUIRED_CARD_FIELDS = ["name", "description", "url", "version"];

/** Findings for an A2A agent card. */
export const validateAgentCard = (card) => {
  const problems = [];
  if (!card || typeof card !== "object") {
    return [{ severity: "fail", message: "agent card is not an object" }];
  }

  for (const field of REQUIRED_CARD_FIELDS) {
    if (!card[field]) problems.push({ severity: "fail", message: `agent card is missing ${field}` });
  }

  if (card.url && !/^https:\/\//.test(card.url)) {
    problems.push({ severity: "fail", message: `agent card url is not https: ${card.url}` });
  }

  if (!Array.isArray(card.skills) || card.skills.length === 0) {
    problems.push({ severity: "warn", message: "agent card advertises no skills" });
  } else {
    for (const [index, skill] of card.skills.entries()) {
      for (const field of ["id", "name", "description"]) {
        if (!skill?.[field]) problems.push({ severity: "warn", message: `skills[${index}] is missing ${field}` });
      }
    }
  }

  if (!card.capabilities) {
    problems.push({ severity: "warn", message: "agent card states no capabilities block" });
  }

  return problems;
};

/**
 * Compare what the manifest advertises for a resource against the terms the
 * live 402 response actually returns.
 *
 * This is the whole point of the canary: the profile docs say, twice, that "a
 * manifest entry documents what is advertised, not that a call will succeed".
 * Price or network drift between the two is invisible to anyone reading either
 * one alone.
 */
export const compareTerms = (advertised, live, label) => {
  const problems = [];
  const pick = (entry) => ({
    scheme: entry?.scheme,
    network: entry?.network,
    asset: entry?.asset,
    amount: String(amountOf(entry).value ?? ""),
  });

  const want = pick(advertised);
  const got = pick(live);

  for (const field of ["scheme", "network", "asset", "amount"]) {
    if (want[field] && got[field] && want[field] !== got[field]) {
      problems.push({
        severity: "fail",
        message: `${label}: manifest advertises ${field} ${want[field]} but the live 402 returns ${got[field]}`,
      });
    }
  }

  return problems;
};
