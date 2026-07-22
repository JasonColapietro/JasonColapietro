import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("profile documents keep Jason canonical and publish both aliases", async () => {
  const [readme, identity, links] = await Promise.all([
    read("README.md"),
    read("docs/Jason Colapietro.md"),
    read("docs/Public Links.md"),
  ]);

  assert.match(readme, /^# Jason Colapietro/m);
  assert.match(readme, /Jay Colapietro/);
  assert.match(readme, /Johnny Suede/);
  assert.match(readme, /https:\/\/jasoncolapietro\.com/);
  assert.match(readme, /https:\/\/johnnysuede\.com/);

  assert.match(identity, /\| Canonical name \| Jason Colapietro \|/);
  assert.match(identity, /\| Public alias \| Jay Colapietro \|/);
  assert.match(identity, /\| Creative alias \| Johnny Suede \|/);
  assert.match(links, /https:\/\/jasoncolapietro\.com/);
  assert.match(links, /https:\/\/johnnysuede\.com/);
});
