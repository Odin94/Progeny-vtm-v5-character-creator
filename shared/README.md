# Shared Schemas

This package contains shared Zod schemas used by both the frontend and backend.

## Structure

- `src/schemas/` - All Zod schema definitions
  - `Attributes.ts` - Character attributes schema
  - `Skills.ts` - Character skills schema
  - `NameSchemas.ts` - Clan, discipline, and predator type name schemas
  - `Specialties.ts` - Skill specialties schema
  - `Disciplines.ts` - Power and ritual schemas
  - `Character.ts` - Main character schema and related types

## Usage

### Frontend
```typescript
import { characterSchema, type Character } from "@progeny/shared"
```

### Backend
```typescript
import { characterDataSchema } from "@progeny/shared/schemas/Character.js"
```

## Installation

The shared package is referenced via TypeScript path aliases. No npm installation needed - it's part of the monorepo structure.
