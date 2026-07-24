import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { runTalentCheck } from "./compute";
import { CATEGORY_ORDER, type TalentCheckCategoryCode, type TalentCheckResult } from "./types";

const LevelSchema = z.number().int().min(1).max(10);

const CompetencyLevelsSchema = z
  .object(
    Object.fromEntries(CATEGORY_ORDER.map((category) => [category, LevelSchema])) as Record<
      TalentCheckCategoryCode,
      typeof LevelSchema
    >,
  )
  .strict();

const TalentCheckRequestSchema = z.object({
  company: z.string().min(1, "Selected company is required"),
  candidate_profile: z.object({
    competency_levels: CompetencyLevelsSchema,
  }),
});

export const checkTalent = createServerFn({ method: "POST" })
  .validator(TalentCheckRequestSchema)
  .handler(({ data }): TalentCheckResult =>
    runTalentCheck({ competency_levels: data.candidate_profile.competency_levels }, data.company),
  );
