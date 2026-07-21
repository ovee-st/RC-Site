import { describe, expect, it } from "vitest";
import { defaultAutomationRules, ruleMatches } from "@/lib/ats/automation";
import { applyOptimisticStageMove, canDeleteStage, canPerformAtsAction, createDefaultStageRows, isTaskOverdue, legacyStatusToStage, validateOfferTransition, validateStageMove } from "@/lib/ats/workflowEngine";
import { DEFAULT_PIPELINE_STAGE_NAMES } from "@/types/ats";

describe("enterprise recruitment workflow", () => {
  it("creates the ordered twelve-stage default pipeline", () => {
    const stages = createDefaultStageRows("pipeline-1");
    expect(stages.map((stage) => stage.name)).toEqual([...DEFAULT_PIPELINE_STAGE_NAMES]);
    expect(stages.map((stage) => stage.position)).toEqual([...Array(12).keys()]);
    expect(stages.filter((stage) => stage.is_terminal).map((stage) => stage.name)).toEqual(["Hired", "Rejected", "Archived"]);
  });

  it("maps legacy application states without losing workflow meaning", () => {
    expect(legacyStatusToStage("under_review")).toBe("Shortlisted");
    expect(legacyStatusToStage("phone-screening")).toBe("Phone Screening");
    expect(legacyStatusToStage("offer accepted")).toBe("Offer");
    expect(legacyStatusToStage("unknown legacy value")).toBe("Applied");
  });

  it("validates stage movement and protects terminal decisions", () => {
    expect(validateStageMove({ currentStageId: "a", targetStageId: "b", targetArchived: false, actorRole: "employer" }).allowed).toBe(true);
    expect(validateStageMove({ currentStageId: "a", targetStageId: "b", targetArchived: true, actorRole: "employer" }).allowed).toBe(false);
    expect(validateStageMove({ currentStageId: "a", targetStageId: "b", targetArchived: false, currentTerminal: true, actorRole: "employer" }).allowed).toBe(false);
    expect(validateStageMove({ currentStageId: "a", targetStageId: "b", targetArchived: false, currentTerminal: true, actorRole: "admin" }).allowed).toBe(true);
  });

  it("prevents deletion of stages with active candidates", () => {
    expect(canDeleteStage(0).allowed).toBe(true);
    expect(canDeleteStage(1)).toEqual({ allowed: false, reason: "Move active candidates before deleting this stage." });
  });

  it("applies drag-and-drop moves without mutating other cards", () => {
    const candidates = [{ applicationId: "a", stageId: "applied", stageName: "Applied", name: "A" }, { applicationId: "b", stageId: "applied", stageName: "Applied", name: "B" }];
    const moved = applyOptimisticStageMove(candidates, ["a"], "interview", "Interview");
    expect(moved[0]).toMatchObject({ stageId: "interview", stageName: "Interview" });
    expect(moved[1]).toBe(candidates[1]);
    expect(candidates[0].stageId).toBe("applied");
  });

  it("enforces offer lifecycle transitions", () => {
    expect(validateOfferTransition("draft", "sent").allowed).toBe(true);
    expect(validateOfferTransition("sent", "accepted").allowed).toBe(true);
    expect(validateOfferTransition("accepted", "draft").allowed).toBe(false);
    expect(validateOfferTransition("declined", "accepted").allowed).toBe(false);
  });

  it("marks only incomplete past-due tasks as overdue", () => {
    const now = new Date("2026-07-21T10:00:00Z");
    expect(isTaskOverdue("pending", "2026-07-21T09:00:00Z", now)).toBe(true);
    expect(isTaskOverdue("completed", "2026-07-21T09:00:00Z", now)).toBe(false);
    expect(isTaskOverdue("pending", "2026-07-21T11:00:00Z", now)).toBe(false);
  });

  it("matches automation rules only when trigger configuration agrees", () => {
    const rule = { id: "rule-1", triggerEvent: "stage_entered" as const, triggerConfig: { stage_id: "interview" }, actionType: "create_task" as const, actionConfig: {}, enabled: true };
    expect(ruleMatches(rule, "stage_entered", { stage_id: "interview" })).toBe(true);
    expect(ruleMatches(rule, "stage_entered", { stage_id: "offer" })).toBe(false);
    expect(ruleMatches({ ...rule, enabled: false }, "stage_entered", { stage_id: "interview" })).toBe(false);
  });

  it("seeds the requested workflow automations", () => {
    const rules = defaultAutomationRules("pipeline", "interview", "hired");
    expect(rules.map((rule) => rule.trigger_event)).toEqual(["stage_entered", "offer_accepted", "assessment_completed"]);
    expect(rules.find((rule) => rule.trigger_event === "offer_accepted")?.action_config).toEqual({ stage_id: "hired" });
  });

  it("enforces collaborative hiring permissions", () => {
    expect(canPerformAtsAction("viewer", "pipeline", false)).toBe(true);
    expect(canPerformAtsAction("viewer", "pipeline", true)).toBe(false);
    expect(canPerformAtsAction("interviewer", "interviews", true)).toBe(true);
    expect(canPerformAtsAction("interviewer", "offers", true)).toBe(false);
    expect(canPerformAtsAction("recruiter", "offers", true, { offers: false })).toBe(false);
    expect(canPerformAtsAction("recruiter", "offers", true, { offers: true })).toBe(true);
  });
});
