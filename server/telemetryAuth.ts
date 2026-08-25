import { timingSafeEqual } from "node:crypto";

export function isTelemetryBridgeAuthorized(token: string | undefined) {
  const expected = process.env.SMARTPUMP_TELEMETRY_BRIDGE_TOKEN;
  if (!expected || !token) return false;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(token);
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
