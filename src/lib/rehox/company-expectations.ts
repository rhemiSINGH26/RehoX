import { z } from "zod";
import rawCompanyExpectations from "./company-expectations.json?raw";
import { CATEGORY_ORDER, type CompetencyLevels, type TalentCheckCategoryCode } from "./types";

const LevelSchema = z.number().int().min(1).max(10);
const WeightSchema = z.number().min(0.1).max(5);
const CategoryLevelMapSchema = z.record(z.string().min(1), LevelSchema);
const WeightMapSchema = z.record(z.string().min(1), WeightSchema);
const MandatoryCompetenciesSchema = z.array(
  z.enum(CATEGORY_ORDER as [TalentCheckCategoryCode, ...TalentCheckCategoryCode[]]),
);

const CompanyExpectationEntrySchema = z
  .object({
    required_levels: CategoryLevelMapSchema.optional(),
    weights: WeightMapSchema.optional(),
    mandatory_competencies: MandatoryCompetenciesSchema.optional(),
  })
  .passthrough();

const CompanyExpectationsSchema = z.record(z.string().min(1), CompanyExpectationEntrySchema);

export interface CompanyExpectation {
  required_levels: CompetencyLevels;
  weights: Partial<Record<TalentCheckCategoryCode, number>>;
  mandatory_competencies: TalentCheckCategoryCode[];
}

function parseCompanyExpectationEntry(
  company: string,
  entry: z.infer<typeof CompanyExpectationEntrySchema>,
): CompanyExpectation {
  const rawLevels = entry.required_levels ?? entry;
  const parsedLevels = CategoryLevelMapSchema.safeParse(rawLevels);
  if (!parsedLevels.success) {
    throw new Error(`Company expectations for ${company} are missing valid competency levels.`);
  }

  const required_levels = {} as CompetencyLevels;
  for (const category of CATEGORY_ORDER) {
    const level = parsedLevels.data[category];
    if (level === undefined) {
      throw new Error(`Company expectations for ${company} are missing ${category}.`);
    }
    required_levels[category] = level;
  }

  const parsedWeights = WeightMapSchema.safeParse(entry.weights ?? {});
  if (!parsedWeights.success) {
    throw new Error(`Company weights for ${company} must be numeric values between 0.1 and 5.`);
  }

  const weights = {} as Partial<Record<TalentCheckCategoryCode, number>>;
  for (const category of CATEGORY_ORDER) {
    const weight = parsedWeights.data[category];
    if (weight !== undefined) {
      weights[category] = weight;
    }
  }

  const parsedMandatorys = MandatoryCompetenciesSchema.safeParse(
    entry.mandatory_competencies ?? [],
  );
  if (!parsedMandatorys.success) {
    throw new Error(
      `Mandatory competencies for ${company} must be a valid list of RADIX categories.`,
    );
  }

  return {
    required_levels,
    weights,
    mandatory_competencies:
      parsedMandatorys.data.length > 0 ? parsedMandatorys.data : ["COD", "DSA"],
  };
}

function loadCompanyExpectations(): Record<string, CompanyExpectation> {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawCompanyExpectations);
  } catch {
    throw new Error("Company expectations snapshot contains invalid JSON.");
  }

  const parsed = CompanyExpectationsSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error("Company expectations snapshot does not match the RADIX level contract.");
  }

  return Object.fromEntries(
    Object.entries(parsed.data).map(([company, entry]) => [
      company,
      parseCompanyExpectationEntry(company, entry),
    ]),
  );
}

export const COMPANY_EXPECTATIONS = loadCompanyExpectations();
export const COMPANIES = Object.keys(COMPANY_EXPECTATIONS);
export type Company = string;

export function resolveCompanyName(company: string): string | null {
  if (!company) return null;
  const normalizedCompany = company.trim().toLowerCase();
  return COMPANIES.find((candidate) => candidate.toLowerCase() === normalizedCompany) ?? null;
}

const DEFAULT_DYNAMIC_EXPECTATION: CompanyExpectation = {
  required_levels: {
    COD: 8,
    DSA: 8,
    OOD: 7,
    APTI: 7,
    COMM: 7,
    AI: 6,
    CLOUD: 7,
    SQL: 7,
    SWE: 8,
    SYSD: 8,
    NETW: 6,
    OS: 7,
  },
  weights: {
    COD: 1.2,
    DSA: 1.2,
    SYSD: 1.2,
    SWE: 1.1,
  },
  mandatory_competencies: ["COD", "DSA"],
};

export function getCompanyExpectation(company: string): CompanyExpectation {
  const resolvedCompany = resolveCompanyName(company);
  if (resolvedCompany && COMPANY_EXPECTATIONS[resolvedCompany]) {
    return COMPANY_EXPECTATIONS[resolvedCompany];
  }
  return DEFAULT_DYNAMIC_EXPECTATION;
}

export function getCompanyRequiredLevels(company: string): CompetencyLevels {
  return getCompanyExpectation(company).required_levels;
}

export function getCompanyWeights(
  company: string,
): Partial<Record<TalentCheckCategoryCode, number>> {
  return getCompanyExpectation(company).weights;
}

export function getMandatoryCompetencies(company: string): TalentCheckCategoryCode[] {
  return getCompanyExpectation(company).mandatory_competencies;
}
