import { describe, expect, it } from "vitest";
import { pumpRouter } from "./routers/pump";
import type { TrpcContext } from "./_core/context";

const publicContext = { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;

describe("telemetry bridge secret", () => {
  it("authorizes the configured bridge token through the telemetry-only health endpoint", async () => {
    const configuredToken = process.env.SMARTPUMP_TELEMETRY_BRIDGE_TOKEN;
    expect(configuredToken).toBeTruthy();
    const caller = pumpRouter.createCaller(publicContext);
    await expect(caller.bridgeHealth({ bridgeToken: configuredToken! })).resolves.toEqual({ authorized: true, mode: "ingestion_only", actuation: false });
  });
});
