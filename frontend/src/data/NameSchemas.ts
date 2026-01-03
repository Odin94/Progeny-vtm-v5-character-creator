// This file exists to break issues with circular imports
// Re-export from shared for backwards compatibility
export {
  clanNameSchema,
  disciplineNameSchema,
  predatorTypeNameSchema,
  type ClanName,
  type DisciplineName,
  type PredatorTypeName,
} from "@progeny/shared"
