import { GUIDED_STAGES, type GuidedStage, type GuidedState } from "./types";

export const initialGuidedState: GuidedState = {
  started:false, stage:1, completed:[], snapshot:null, controlledState:null, contract:null,
  safeProposal:null, safeEvaluation:null, safeExecution:null, attackProposal:null, attackEvaluation:null,
  recoveryPlan:null, recoveryExecution:null, checkoutProposal:null, checkoutEvaluation:null, checkoutExecution:null,
  paymentProposal:null, paymentEvaluation:null, finishProposal:null, finishEvaluation:null, finishExecution:null,
  auditSession:null, auditVerification:null, pendingAudit:null, busy:null, error:null, auditWarning:null,
};

export type GuidedAction = { type: "patch"; value: Partial<GuidedState> } | { type: "reset" } | { type: "visit"; stage: GuidedStage };
export function guidedReducer(state: GuidedState, action: GuidedAction): GuidedState {
  if (action.type === "reset") return initialGuidedState;
  if (action.type === "patch") return { ...state, ...action.value };
  return canVisit(state, action.stage) ? { ...state, stage: action.stage } : state;
}
export function canVisit(state: GuidedState, stage: GuidedStage): boolean {
  if (stage === 1) return true;
  return state.completed.includes(stage) || state.completed.includes((stage - 1) as GuidedStage);
}
export function stageLabel(stage: GuidedStage) { return GUIDED_STAGES[stage - 1]; }
