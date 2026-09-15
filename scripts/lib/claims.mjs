// Reading the numeric claims back out of the README.
//
// The guards in tests/ already check that these numbers agree with each other:
// the badge, the prose, the spelled-out form, and the split that has to sum.
// What they cannot check is whether the agreed-upon number is *true*. Five
// commits in this repository's history are manual reconciliations after the
// fact. This module extracts what the page claims so a scheduled job can
// compare it against what GitHub actually reports.

/** The upstream-merge claim: total PRs, distinct repos, and the split. */
export const upstreamClaim = (readme) => {
  const prs = readme.match(/upstream_merges-(\d+)_PRs/);
  const repos = readme.match(/upstream_merges-\d+_PRs_%2F_(\d+)_repos/);
  const split = readme.match(/(\d+) are fixes, features, tests, and docs; the other (\d+) are accepted listings/);

  if (!prs || !repos) return null;

  return {
    prs: Number(prs[1]),
    repos: Number(repos[1]),
    substantive: split ? Number(split[1]) : null,
    listings: split ? Number(split[2]) : null,
    // The page dates the claim; drift against a stale date is expected and
    // reads differently from drift against a fresh one.
    asOf: readme.match(/as of ([A-Z][a-z]+ \d{1,2}, \d{4})/)?.[1] ?? null,
  };
};

/** The open-source skills claim, carried by the badge. */
export const skillsClaim = (readme) => {
  const badge = readme.match(/open--source_skills-(\d+)-/);
  return badge ? Number(badge[1]) : null;
};

/** App-store claims, which are countable against the tables in the same file. */
export const appsClaim = (readme) => ({
  ios: Number(readme.match(/iOS_apps-(\d+)-/)?.[1] ?? NaN),
  android: Number(readme.match(/Android_apps-(\d+)-/)?.[1] ?? NaN),
});

/**
 * Describe the gap between a claim and reality in the direction that matters.
 *
 * Understating is a missed update; overstating is an inaccurate public claim,
 * and on a page whose whole purpose is verifiable evidence, the second is the
 * one worth raising louder.
 */
export const drift = (claimed, actual, label) => {
  if (claimed === null || claimed === undefined || !Number.isFinite(actual)) {
    return { severity: "warn", message: `${label}: could not compare (claimed ${claimed}, actual ${actual})` };
  }
  if (claimed === actual) {
    return { severity: "pass", message: `${label}: ${claimed}, matches GitHub` };
  }
  if (claimed < actual) {
    return {
      severity: "warn",
      message: `${label}: the page says ${claimed}, GitHub reports ${actual} — understated by ${actual - claimed}`,
    };
  }
  return {
    severity: "fail",
    message: `${label}: the page says ${claimed}, GitHub reports ${actual} — overstated by ${claimed - actual}`,
  };
};
