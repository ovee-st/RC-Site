import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("public homepage regressions", () => {
  it("keeps the hero headline on word boundaries", () => {
    const hero = read("components/home/HeroSection.tsx");

    expect(hero).not.toContain("max-w-4xl break-words");
    expect(hero).toContain("[word-break:normal]");
    expect(hero).toContain("xl:grid-cols-[minmax(29rem,0.84fr)_minmax(0,1.16fr)]");
    expect(hero).toContain('xl:whitespace-nowrap">for ');
  });

  it("keeps guest login visible without crowding authenticated navigation", () => {
    const navbar = read("components/layout/Navbar.tsx");

    expect(navbar).toContain('resolvedRole === "guest" ? "lg:flex" : "xl:flex"');
    expect(navbar).toContain("!loading && !user");
    expect(navbar).toContain('<LinkButton href="/login"');
    expect(navbar).toContain("!loading && user ? notificationBell : null");
  });
});
