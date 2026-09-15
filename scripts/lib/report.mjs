// Shared reporting for the audit scripts.
//
// These run in two places with different readers: a terminal, where colour and
// alignment matter, and a GitHub Actions job, where the useful artifact is the
// step summary. Both get the same findings.

import { appendFileSync } from "node:fs";

const SEVERITY = { pass: 0, warn: 1, fail: 2 };
const MARK = { pass: "PASS", warn: "WARN", fail: "FAIL" };

export class Report {
  #findings = [];

  constructor(title) {
    this.title = title;
  }

  add(severity, subject, detail = "") {
    this.#findings.push({ severity, subject, detail });
    return this;
  }

  pass(subject, detail) { return this.add("pass", subject, detail); }
  warn(subject, detail) { return this.add("warn", subject, detail); }
  fail(subject, detail) { return this.add("fail", subject, detail); }

  get findings() { return [...this.#findings]; }

  counts() {
    const totals = { pass: 0, warn: 0, fail: 0 };
    for (const finding of this.#findings) totals[finding.severity] += 1;
    return totals;
  }

  /** The worst severity seen, which is what the process exit code reflects. */
  worst() {
    return this.#findings.reduce(
      (acc, finding) => (SEVERITY[finding.severity] > SEVERITY[acc] ? finding.severity : acc),
      "pass",
    );
  }

  toText({ quiet = true } = {}) {
    const lines = [`\n${this.title}`, "=".repeat(this.title.length)];
    for (const { severity, subject, detail } of this.#findings) {
      // A clean run of several hundred links is noise; the failures are the
      // report. Pass `quiet: false` to see everything.
      if (quiet && severity === "pass") continue;
      lines.push(`  ${MARK[severity].padEnd(4)}  ${subject}${detail ? `\n          ${detail}` : ""}`);
    }
    const { pass, warn, fail } = this.counts();
    lines.push("", `  ${pass} passed, ${warn} warnings, ${fail} failures`);
    return lines.join("\n");
  }

  toMarkdown() {
    const { pass, warn, fail } = this.counts();
    const lines = [
      `## ${this.title}`,
      "",
      `${pass} passed · ${warn} warnings · ${fail} failures`,
      "",
    ];
    const notable = this.#findings.filter((finding) => finding.severity !== "pass");
    if (notable.length === 0) {
      lines.push("Everything checked is clean.");
    } else {
      lines.push("| | Subject | Detail |", "|---|---|---|");
      for (const { severity, subject, detail } of notable) {
        // Pipes inside a URL or a message would otherwise break the table.
        const cell = (value) => String(value).replaceAll("|", "\\|");
        lines.push(`| ${MARK[severity]} | ${cell(subject)} | ${cell(detail)} |`);
      }
    }
    return lines.join("\n");
  }

  /**
   * Emit to the terminal and, under Actions, to the job summary. Returns the
   * exit code: failures fail the job, warnings do not.
   */
  emit({ quiet = true } = {}) {
    console.log(this.toText({ quiet }));
    const summary = process.env.GITHUB_STEP_SUMMARY;
    if (summary) {
      try {
        appendFileSync(summary, `${this.toMarkdown()}\n\n`);
      } catch (error) {
        console.error(`could not write the job summary: ${error.message}`);
      }
    }
    return this.worst() === "fail" ? 1 : 0;
  }
}
