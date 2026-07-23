import type { ActionExecutionResponse, ControlledShoppingState, ScenarioSnapshot } from "../action-gate/types";
import type { AuditArtifact, AuditSession, AuditVerification } from "../audit/types";
import type { TaskContract } from "../contracts/types";
import type { ActionEvaluationResponse } from "../interceptor/types";
import type { RecoveryExecutionResponse, RecoveryPlan } from "../recovery/types";
import type { ProposedAgentAction } from "../worker/types";

export const GUIDED_STAGES = ["Your Mission", "Safety Rules", "Safe Product Action", "Hidden Subscription Attack", "Safe Recovery", "Payment Boundary", "Payment Boundary", "Verified Outcome", "Verified Outcome"] as const;
export type GuidedStage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type GuidedState = {
  started: boolean; stage: GuidedStage; completed: GuidedStage[];
  snapshot: ScenarioSnapshot | null; controlledState: ControlledShoppingState | null;
  contract: TaskContract | null;
  safeProposal: ProposedAgentAction | null; safeEvaluation: ActionEvaluationResponse | null; safeExecution: ActionExecutionResponse | null;
  attackProposal: ProposedAgentAction | null; attackEvaluation: ActionEvaluationResponse | null;
  recoveryPlan: RecoveryPlan | null; recoveryExecution: RecoveryExecutionResponse | null;
  checkoutProposal: ProposedAgentAction | null; checkoutEvaluation: ActionEvaluationResponse | null; checkoutExecution: ActionExecutionResponse | null;
  paymentProposal: ProposedAgentAction | null; paymentEvaluation: ActionEvaluationResponse | null;
  finishProposal: ProposedAgentAction | null; finishEvaluation: ActionEvaluationResponse | null; finishExecution: ActionExecutionResponse | null;
  auditSession: AuditSession | null; auditVerification: AuditVerification | null;
  pendingAudit: AuditArtifact | null; busy: string | null; error: string | null; auditWarning: string | null;
};
