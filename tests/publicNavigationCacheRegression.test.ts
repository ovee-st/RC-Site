import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("public navigation release consistency", () => {
  it("does not pin Next.js navigation bundles to a stale cache", () => {
    const worker = read("public/sw.js");

    expect(worker).toContain('const CACHE_NAME = "mxvl-shell-v2"');
    expect(worker).toContain('url.pathname.startsWith("/_next/")');
    expect(worker.indexOf("fetch(request)")).toBeLessThan(worker.indexOf("caches.match(request)", worker.indexOf('url.pathname.startsWith("/_next/")')));
  });

  it("checks for a fresh worker script on every production registration", () => {
    const registration = read("components/layout/ServiceWorkerRegister.tsx");

    expect(registration).toContain('updateViaCache: "none"');
    expect(registration).toContain("registration.update()");
  });

  it("keeps the shared navbar responsible for guest and authenticated actions", () => {
    const layout = read("components/layout/AppLayout.tsx");
    const navbar = read("components/layout/Navbar.tsx");

    expect(layout).toContain("<Navbar />");
    expect(navbar).toContain("!loading && !user");
    expect(navbar).toContain("!loading && user ? notificationBell : null");
  });
});
