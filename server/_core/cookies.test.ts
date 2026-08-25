import { describe, expect, it } from "vitest";
import { getSessionCookieOptions } from "./cookies";

describe("getSessionCookieOptions", () => {
  it("uses a browser-accepted Lax cookie on plain localhost development", () => {
    const options = getSessionCookieOptions({ protocol: "http", hostname: "localhost", headers: {} } as never);
    expect(options).toMatchObject({ httpOnly: true, path: "/", sameSite: "lax", secure: false });
  });

  it("preserves the secure cross-site cookie policy behind an HTTPS proxy", () => {
    const options = getSessionCookieOptions({ protocol: "http", hostname: "preview.manus.computer", headers: { "x-forwarded-proto": "https" } } as never);
    expect(options).toMatchObject({ sameSite: "none", secure: true });
  });
});
