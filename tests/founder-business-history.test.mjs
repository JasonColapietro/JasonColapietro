import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("founder biography reflects two decades running businesses", () => {
  for (const file of ["README.md", "docs/Jason Colapietro.md"]) {
    const source = readFileSync(new URL("../" + file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /(?:built|ran|sold)[^.\n]{0,55}call centers/i, file);
    assert.match(source, /two decades building and running businesses/i, file);
  }
});
