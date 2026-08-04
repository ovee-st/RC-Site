import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("authentication state consistency", () => {
  it("uses AuthProvider as the shared navigation and login source", () => {
    const login = read("app/(auth)/login/page.tsx");
    const callback = read("app/auth/callback/page.tsx");
    const navbar = read("components/layout/Navbar.tsx");

    expect(login).toContain("const { refreshAuth } = useAuth()");
    expect(callback).toContain("const { refreshAuth } = useAuth()");
    expect(navbar).toContain("const { user, role, loading, refreshAuth } = useAuth()");
    expect(`${login}\n${callback}`).not.toContain("useUserStore");
  });

  it("never renders guest actions until session resolution completes", () => {
    const navbar = read("components/layout/Navbar.tsx");

    expect(navbar).toContain("!loading && !user");
    expect(navbar).toContain("!loading && user ? notificationBell : null");
    expect(navbar).toContain("const showRoleNotifications = Boolean(user)");
  });

  it("guards auth hydration against stale async results", () => {
    const provider = read("context/AuthProvider.jsx");

    expect(provider).toContain("let authRevision = 0");
    expect(provider).toContain("revision === authRevision");
    expect(provider).toContain("refreshAuthRef.current = hydrate");
    expect(provider).toContain("await supabase.auth.getUser()");
    expect(provider).toContain("if (userError || !userData?.user)");
  });
});
