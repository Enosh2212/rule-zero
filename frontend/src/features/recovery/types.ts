import type { ActionExecutionResponse, ControlledShoppingState } from "../action-gate/types";
import type { TaskContract } from "../contracts/types";
import type { ActionEvaluationResponse } from "../interceptor/types";
import type { ProposedAgentAction } from "../worker/types";

export type RecoveryActionStatus = "pending" | "completed" | "refused" | "approval_required" | "skipped";
export type RecoveryCompletionStatus = "in_progress" | "full_completion" | "partial_completion" | "safe_completion_impossible";

export type RecoveryStep = Readonly<{
  step_id: string;
  sequence_number: number;
  expected_state_version: number;
  proposed_action: ProposedAgentAction;
  reason: string;
  preserved_constraint: string;
  expected_consequence: string;
  mutates_controlled_state: boolean;
  approval_may_be_required: boolean;
  execution_status: RecoveryActionStatus;
}>;

export type RecoveryPlan = Readonly<{
  schema_version: "1.0";
  recovery_plan_id: string;
  scenario_id: "shopping-trap";
  contract_fingerprint: string;
  triggering_action_id: string;
  triggering_action_fingerprint: string;
  triggering_evaluation_id: string;
  bound_state_version: number;
  trigger: string;
  reason: string;
  strategies: readonly string[];
  summary: string;
  explanation: string;
  preserved_user_constraints: readonly string[];
  unsafe_behaviour_removed: readonly string[];
  steps: readonly RecoveryStep[];
  expected_final_state: ControlledShoppingState;
  full_task_completion_possible: boolean;
  human_approval_may_still_be_required: boolean;
  completion_status: RecoveryCompletionStatus;
  trace: Readonly<{ steps: readonly string[] }>;
  warnings: readonly string[];
}>;

export type RecoveryPlanRequest = Readonly<{
  scenario_id: "shopping-trap";
  contract: TaskContract;
  triggering_action: ProposedAgentAction;
  evaluation: ActionEvaluationResponse;
  execution_response: ActionExecutionResponse | null;
  current_state: ControlledShoppingState;
}>;

export type RecoveryExecutionResponse = Readonly<{
  schema_version: "1.0";
  recovery_plan_id: string;
  executed_step_index: number;
  step_status: RecoveryActionStatus;
  next_step_index: number | null;
  completion_status: RecoveryCompletionStatus;
  fresh_evaluation: ActionEvaluationResponse;
  execution_response: ActionExecutionResponse;
  before_state: ControlledShoppingState;
  after_state: ControlledShoppingState;
  state_changed: boolean;
  trace: Readonly<{ steps: readonly string[] }>;
}>;
