import { COOKIE_NAME, decodeOAuthState, OAUTH_STATE_COOKIE, ONE_YEAR_MS } from "../../shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

const LOCAL_DEMO_OPEN_ID = "local_demo_viewer";
const LOCAL_DEMO_SESSION_MS = 8 * 60 * 60 * 1000;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function isLocalDemoRequest(req: Request) {
  const remoteAddress = req.socket.remoteAddress ?? "";
  const isLoopback = remoteAddress === "127.0.0.1" || remoteAddress === "::1" || remoteAddress === "::ffff:127.0.0.1";
  return !ENV.isProduction && LOCAL_HOSTS.has(req.hostname.toLowerCase()) && isLoopback;
}

function safeReturnPath(value: string | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/auth/local-demo", async (req: Request, res: Response) => {
    // Local-only test access still uses a normal signed, httpOnly session. The
    // endpoint is intentionally unavailable on preview and production hosts.
    if (!isLocalDemoRequest(req)) {
      res.status(404).end();
      return;
    }

    try {
      await db.upsertUser({
        openId: LOCAL_DEMO_OPEN_ID,
        name: "Local Demo Operator",
        email: "local-demo@smartpump-x.test",
        loginMethod: "local-demo",
        role: "viewer",
        lastSignedIn: new Date(),
      });
      const sessionToken = await sdk.createSessionToken(LOCAL_DEMO_OPEN_ID, {
        name: "Local Demo Operator",
        expiresInMs: LOCAL_DEMO_SESSION_MS,
      });
      res.cookie(COOKIE_NAME, sessionToken, {
        ...getSessionCookieOptions(req),
        maxAge: LOCAL_DEMO_SESSION_MS,
      });
      res.redirect(302, safeReturnPath(getQueryParam(req, "returnTo")));
    } catch (error) {
      console.error("[Auth] Local demo session creation failed", error);
      res.status(500).json({ error: "local demo session creation failed" });
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
