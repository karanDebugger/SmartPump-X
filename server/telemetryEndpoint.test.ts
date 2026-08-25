import { describe, expect, it, vi } from "vitest";
import { handleTelemetryIngest } from "./telemetryEndpoint";
import type { Request, Response } from "express";

function responseMock() {
  const response = { status: vi.fn(), json: vi.fn() };
  response.status.mockReturnValue(response);
  return response;
}

describe("REST telemetry ingestion endpoint", () => {
  it("rejects requests without the configured bridge token before touching telemetry storage", async () => {
    const response = responseMock();
    const request = { header: () => undefined, body: {} } as unknown as Request;
    await handleTelemetryIngest(request, response as unknown as Response);
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ accepted: false, code: "UNAUTHORIZED", actuation: false });
  });

  it("rejects a valid-token payload when it contains an unapproved control field", async () => {
    const response = responseMock();
    const request = {
      header: (name: string) => name === "x-smartpump-telemetry-token" ? process.env.SMARTPUMP_TELEMETRY_BRIDGE_TOKEN : undefined,
      body: { assetTag: "P-101", sensorKey: "FT-101", metric: "flow", value: 42, unit: "L/min", capturedAt: Date.now(), calibrationRevision: "CAL-01", start: true },
    } as unknown as Request;
    await handleTelemetryIngest(request, response as unknown as Response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ accepted: false, code: "INVALID_PAYLOAD", actuation: false });
  });
});
