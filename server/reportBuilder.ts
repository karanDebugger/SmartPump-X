type FaultTestRequestForReport = {
  id: number;
  assetTag: string;
  scenario: string;
  status: string;
  riskLevel: string;
  scheduledAt: number;
  objective: string;
  approvalNote: string | null;
};

type FaultTestEventForReport = { createdAt: Date; eventType: string };

export function buildFaultTestReport(request: FaultTestRequestForReport, events: FaultTestEventForReport[]) {
  return `# SmartPump-X Controlled Fault-Test Record\n\n| Field | Value |\n|---|---|\n| Request ID | ${request.id} |\n| Asset | ${request.assetTag} |\n| Scenario | ${request.scenario} |\n| Status | ${request.status} |\n| Risk level | ${request.riskLevel} |\n| Scheduled time | ${new Date(request.scheduledAt).toISOString()} |\n| Hardware actuation | Prohibited — evidence workflow only |\n\n## Objective\n\n${request.objective}\n\n## Approval\n\n${request.approvalNote ?? "Pending administrator decision."}\n\n## Audit history\n\n${events.map(event => `- ${event.createdAt.toISOString()} — **${event.eventType}**`).join("\n") || "- No events recorded."}\n`;
}
