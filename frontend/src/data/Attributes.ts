import { attributesSchema, attributesKeySchema, type Attributes, type AttributesKey } from "@progeny/shared"

// Re-export from shared for backwards compatibility
export { attributesSchema, attributesKeySchema, type Attributes, type AttributesKey }

// Page 152
export const attributeDescriptions: Record<AttributesKey, string> = {
    strength: "Anything related to muscles",
    dexterity: "Agility and coordination",
    stamina: "Toughness and resilience",
    charisma: "Charm and magnetism",
    manipulation: "Get others to do what you want",
    composure: "Self-control and staying calm",
    intelligence: "Memory and reasoning",
    wits: "Intuition and split-second decision making",
    resolve: "Focus and attention",
}
