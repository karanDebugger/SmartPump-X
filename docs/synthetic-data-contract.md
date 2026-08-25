# Synthetic Data Contract

SmartPump-X uses an explicitly synthetic, deterministic demonstration dataset until a calibrated mechanical rig is commissioned. The dataset is intended for UI, API, workflow, and test validation; it is not sensor validation, warranty evidence, or a basis for remaining-useful-life claims.

| Field | Contract |
|---|---|
| Seed label | `smartpump-x-v1` |
| Time anchor | 2025-01-01T00:00:00.000Z |
| Generator | Deterministic pump-curve/system-resistance simulation in `server/pumpEngine.ts` |
| Scenario identifiers | `normal`, `bearing`, `impellerBlockage`, `valveRestriction`, `cavitationLike`, `motorOverheat`, `sensorDrift`, `reducedFlow` |
| Origin | `synthetic` for scenario data and `calculated` for formula-derived quantities |
| Quality semantics | `good`, `degraded`, `suspect`, or `missing` at channel and snapshot level |
| Persistence boundary | The current data artifact is version-controlled source data. Engineer/admin requests to review a scenario are persisted as `preview_only` audit records; no physical event or actuator state is persisted. |

Future hardware ingestion must preserve timestamp, asset ID, sensor ID, units, calibration revision, source origin, quality state, and raw-versus-derived distinction. The simulator should remain available as a separate mode after physical telemetry is introduced.
