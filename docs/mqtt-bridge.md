# ESP32 / MQTT Bridge Deployment Boundary

SmartPump-X accepts **one-way telemetry** at `POST /api/telemetry/ingest`. The endpoint exists to receive a broker-to-HTTP bridge or a gateway service; it is not an MQTT subscriber and it does not publish MQTT topics. This avoids running a permanent broker client inside the current managed application process.

The bridge must subscribe to `smartpump/{assetTag}/telemetry`, map the approved payload fields to the HTTP body, and send the configured `x-smartpump-telemetry-token` header. A valid request contains `assetTag`, `sensorKey`, `metric`, `value`, `unit`, `capturedAt` as Unix milliseconds, and `calibrationRevision`; `quality` is optional. Any control-shaped field such as `command`, `start`, `stop`, `speed`, `setpoint`, or `actuator` is rejected.

The endpoint returns `202` only after the bridge token, payload schema, timestamp window, active calibration revision, unit, and calibration range all pass. It returns `412` when calibration is missing or mismatched. Every response includes `actuation: false`.

Before connecting a physical broker, configure a TLS-capable broker, deploy a bridge that can authenticate to it, map the topic to this endpoint, and provide a calibrated sensor register. The existing shared bridge token must be stored only in the bridge configuration and transmitted in the request header; never embed it in ESP32 source code or browser JavaScript.
