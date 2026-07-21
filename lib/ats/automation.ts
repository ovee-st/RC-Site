export type AutomationTrigger = "stage_entered" | "offer_accepted" | "assessment_completed";
export type AutomationAction = "create_task" | "move_stage" | "notify_recruiter";

export type AutomationRule = {
  id: string;
  triggerEvent: AutomationTrigger;
  triggerConfig: Record<string, unknown>;
  actionType: AutomationAction;
  actionConfig: Record<string, unknown>;
  enabled: boolean;
};

export function ruleMatches(rule: AutomationRule, event: AutomationTrigger, payload: Record<string, unknown>) {
  if (!rule.enabled || rule.triggerEvent !== event) return false;
  return Object.entries(rule.triggerConfig).every(([key, value]) => value === undefined || payload[key] === value);
}

export function defaultAutomationRules(pipelineId: string, interviewStageId: string, hiredStageId: string) {
  return [
    {
      pipeline_id: pipelineId,
      name: "Prepare interview",
      trigger_event: "stage_entered",
      trigger_config: { stage_id: interviewStageId },
      action_type: "create_task",
      action_config: { title: "Schedule candidate interview", task_type: "schedule_interview", due_in_hours: 24 },
      enabled: true
    },
    {
      pipeline_id: pipelineId,
      name: "Accepted offer to hired",
      trigger_event: "offer_accepted",
      trigger_config: {},
      action_type: "move_stage",
      action_config: { stage_id: hiredStageId },
      enabled: true
    },
    {
      pipeline_id: pipelineId,
      name: "Assessment completion alert",
      trigger_event: "assessment_completed",
      trigger_config: {},
      action_type: "notify_recruiter",
      action_config: { title: "Assessment completed" },
      enabled: true
    }
  ];
}
