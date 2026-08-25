# Advanced Release Notes

## Public Engineering Insight Verification

The public guest dashboard now exposes a **synthetic operating-envelope assessment** and a **scenario impact comparison** alongside the editable simulation controls. In the verified baseline configuration, the dashboard reported a preferred synthetic envelope for flow, temperature, vibration, NPSH margin, and wire-to-water efficiency.

The comparison table evaluates the selected scenario against the normal synthetic baseline at the same browser-local inputs. It explicitly states that the comparison does not validate a field fault, determine root cause, or command hardware. Operational-readiness, commissioning, calibration, bridge, and controlled-test content remain restricted to authenticated users.

The managed preview displays the new **Scenario analysis** navigation entry and the engineering-insight panels without browser-console errors. The selected condition is supplied through the same public, bounded scenario contract used by the existing condition simulator.

The guest view was also checked at a narrow mobile viewport. The new operating-envelope and scenario-comparison sections remain in the document flow, with the comparison table retaining horizontal overflow behavior rather than obscuring its engineering values.

After the final chart-container safeguards, the managed guest preview loaded the full public synthetic control tower with no client-side console output. Protected operational-readiness and telemetry-quality panels did not appear for the guest viewer.

The guarded localhost demo-session route was used to verify the authenticated viewer layout. The sidebar exposed the Operational readiness, Commissioning, Telemetry bridge, and Test workflow anchors; the readiness panel correctly blocked physical-readiness claims when no commissioning evidence or valid calibration was recorded; and the telemetry-quality panel correctly showed zero accepted records while listing its ingestion safeguards. The authenticated dashboard was also captured at a narrow mobile viewport with all panels remaining in document flow.

The final authenticated accessibility check confirmed one main content landmark, a functional skip link, one labelled control-tower navigation landmark, two labelled advanced-engineering regions, and an explicit caption on the scenario-comparison table. The visual controls retain keyboard focus styling, while dynamic synthetic summaries use polite live announcements.

> The envelope thresholds are prototype guardrails used to explain the deterministic demonstrator model. They are not manufacturer limits, a permit-to-operate, or a replacement for physical safety engineering.
