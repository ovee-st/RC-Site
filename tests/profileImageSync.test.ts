import { afterEach, describe, expect, it } from "vitest";
import { getBestAvatarUrl } from "@/lib/authUserSync";
import { normalizeProfileImageUrl } from "@/lib/profileImageSync";

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
});

describe("profile media URL resolution", () => {
  it("converts stored profile-photo paths into public URLs", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    expect(normalizeProfileImageUrl("profile-photos/user/avatar.jpg")).toBe(
      "https://project.supabase.co/storage/v1/object/public/profile-photos/user/avatar.jpg"
    );
  });

  it("resolves profile-photo paths from avatar records", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    expect(getBestAvatarUrl({ avatar_url: "profile-photos/user/avatar.webp" })).toBe(
      "https://project.supabase.co/storage/v1/object/public/profile-photos/user/avatar.webp"
    );
  });

  it("repairs legacy bare profile-photo object paths", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    const path = "7388f3fe-e1ed-4bcb-88dc-1007e58b4c62/1777194368867.png";
    expect(normalizeProfileImageUrl(path)).toBe(
      `https://project.supabase.co/storage/v1/object/public/profile-photos/${path}`
    );
    expect(getBestAvatarUrl({ photo_url: path })).toBe(
      `https://project.supabase.co/storage/v1/object/public/profile-photos/${path}`
    );
  });

  it("preserves public and inline image URLs", () => {
    expect(normalizeProfileImageUrl("https://cdn.example.com/avatar.png")).toBe("https://cdn.example.com/avatar.png");
    expect(normalizeProfileImageUrl("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
  });
});
