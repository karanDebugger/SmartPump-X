# SmartPump-X Implementation Acceptance Criteria

This release is a **software demonstrator**. Its acceptance criteria deliberately separate verified software behavior from future physical-rig validation.

| ID | Requirement | Verification method | Acceptance condition | Current status |
|---|---|---|---|---|
| AC-01 | Every telemetry-facing value must disclose its origin and quality. | API contract and dashboard review. | Snapshot contains `origin` and `quality`; UI states synthetic/calculated provenance. | Implemented |
| AC-02 | The hydraulic twin must compute a physically coherent operating point. | Unit test. | Flow, head, hydraulic power, and electrical input are positive; electrical input exceeds hydraulic power; efficiency remains between 0% and 100%. | Implemented |
| AC-03 | A healthy scenario must remain in the healthy band. | Unit test. | The normal snapshot has `health.band = healthy` and no maintenance recommendation. | Implemented |
| AC-04 | A bearing-related signature must materially change condition evidence. | Unit test and API contract test. | Vibration rises above baseline, health drops, a bearing-related probable condition is returned, and a maintenance recommendation exists. | Implemented |
| AC-05 | Sensor drift must be differentiated from a mechanical failure. | Unit test. | The affected channel and overall synthetic state are flagged `suspect`; the probable condition identifies calibration drift. | Implemented |
| AC-06 | Dashboard data must be accessible only to an authenticated operator. | Router test. | Snapshot, trend, engineering preview, and maintenance data use protected procedures. | Implemented |
| AC-07 | A controlled simulation action must be engineer/admin-only. | Router test and database audit write. | Viewers are forbidden; engineer/admin contexts can create a preview-only audit record. No actuator or MQTT control path exists. | Implemented |
| AC-08 | The simulator must be deterministic and auditable. | Dataset contract review. | A fixed epoch, seed label, scenario ID, and generation method are documented. | Implemented |
| AC-09 | A physical-rig claim requires separate evidence. | Release gate. | No screen, API, or report represents present synthetic data as measured, calibrated, or predictive-maintenance validated. | Implemented boundary |
| AC-10 | Hardware integration may begin only after a documented design point and calibration plan exist. | Engineering review. | Pump curve, system curve, test matrix, sensor range/accuracy, sampling plan, and fault protocol are approved. | Future gate |
