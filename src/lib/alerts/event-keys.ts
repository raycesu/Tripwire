export type AlertEventKeyPair = {
  alertRuleId: string
  scoreSnapshotId: string
}

export const makeAlertEventKey = (alertRuleId: string, scoreSnapshotId: string): string =>
  `${alertRuleId}:${scoreSnapshotId}`
