/**
 * Indigenous Data and Cultural Sovereignty Rubric
 * Scored 0-5
 */

export interface RubricDimension {
  name: string;
  description: string;
  criteria: {
    [score: number]: string;
  };
}

export const rubric: RubricDimension[] = [
  {
    name: "Tino Rangatiratanga / Self-determination",
    description: "Does the work uphold Indigenous authority and decision-making power?",
    criteria: {
      0: "Absent or actively harmful to Indigenous authority.",
      1: "Minimal evidence; treats Indigenous people as passive subjects.",
      2: "Acknowledges rights but lacks practical application.",
      3: "Developing; identifies areas for improvement but incomplete.",
      4: "Strong; explicitly centers Indigenous authority and decision-making.",
      5: "Exceptional; models a partnership where Indigenous authority is primary."
    }
  },
  {
    name: "Mana Whenua Recognition",
    description: "Are the right people (Traditional Owners/Custodians) identified and centered?",
    criteria: {
      0: "No recognition of specific land or community authority.",
      1: "Generic or incorrect identification.",
      2: "Identifies community but lacks depth or protocol.",
      3: "Developing; identifies mana whenua but misses key protocols.",
      4: "Strong; correctly identifies and centers mana whenua/Traditional Owners.",
      5: "Exceptional; provides deep context on community authority and protocols."
    }
  },
  {
    name: "Engagement Quality",
    description: "What level of the participation spectrum is this work operating at?",
    criteria: {
      0: "No engagement; decisions made in isolation.",
      1: "Tokenistic; Māori/Indigenous people informed after the fact.",
      2: "Consultation; feedback asked for but not necessarily acted upon.",
      3: "Developing; moving toward collaboration but still top-down.",
      4: "Strong; evidence of genuine collaboration and shared shaping.",
      5: "Exceptional; Indigenous-led or shared authority model."
    }
  },
  {
    name: "Engagement Authenticity",
    description: "Who is doing the engaging and what relationships underpin it?",
    criteria: {
      0: "No relationships; purely transactional.",
      1: "Intermediary with no cultural expertise.",
      2: "Māori/Indigenous consultant hired but disconnected from community.",
      3: "Developing; some relationship evidence but lacks continuity.",
      4: "Strong; built on existing, respectful relationships.",
      5: "Exceptional; deep, long-term reciprocal relationships."
    }
  },
  {
    name: "Data Sovereignty",
    description: "Does data management follow CARE/OCAP/Te Mana Raraunga principles?",
    criteria: {
      0: "No consideration of data sovereignty.",
      1: "Generic privacy mention only.",
      2: "Acknowledges principles but lacks implementation plan.",
      3: "Developing; identifies data risks but incomplete safeguards.",
      4: "Strong; clear alignment with Indigenous data sovereignty frameworks.",
      5: "Exceptional; models best practice in Indigenous data governance."
    }
  },
  {
    name: "Tikanga Alignment",
    description: "Is cultural protocol handled with genuine understanding?",
    criteria: {
      0: "Actively ignores or violates cultural protocol.",
      1: "Superficial or incorrect application of protocol.",
      2: "Basic alignment but lacks nuance.",
      3: "Developing; correct in parts but misses broader context.",
      4: "Strong; deep alignment with relevant protocols (tikanga, fa'asamoa, etc.).",
      5: "Exceptional; protocol is woven into the core of the work."
    }
  },
  {
    name: "Te Reo Māori / Language",
    description: "Is language used correctly, consistently, and with depth?",
    criteria: {
      0: "No use of language or disrespectful usage.",
      1: "Tokenistic usage; frequent errors.",
      2: "Basic usage; some errors or missing macrons.",
      3: "Developing; mostly correct but lacks depth or consistency.",
      4: "Strong; correct, consistent, and respectful usage.",
      5: "Exceptional; language is used with deep cultural and conceptual accuracy."
    }
  },
  {
    name: "Reciprocity — Cultural Load",
    description: "Is there acknowledgment and compensation for cultural labor?",
    criteria: {
      0: "Expects cultural labor for free with no acknowledgment.",
      1: "Minimal acknowledgment; no mention of compensation.",
      2: "Acknowledges load but lacks clear compensation model.",
      3: "Developing; mentions koha/fees but lacks detail.",
      4: "Strong; explicit provision for fair compensation and load management.",
      5: "Exceptional; models a sustainable, professional partnership model."
    }
  },
  {
    name: "Reciprocity — Social Impact",
    description: "Does the community materially benefit from this work?",
    criteria: {
      0: "No benefit to community; purely extractive.",
      1: "Vague or aspirational benefits only.",
      2: "Identifies benefits but community has no say in them.",
      3: "Developing; clear benefits but lacks community governance.",
      4: "Strong; tangible, community-defined benefits.",
      5: "Exceptional; community owns or co-governs the benefits."
    }
  },
  {
    name: "Te Tiriti / Rights Alignment",
    description: "Are Treaty principles or Indigenous rights embedded?",
    criteria: {
      0: "Ignores Treaty/rights obligations.",
      1: "Mentioned as a footnote only.",
      2: "Basic alignment with principles (Partnership, etc.).",
      3: "Developing; identifies obligations but lacks implementation.",
      4: "Strong; Treaty/rights are a foundational lens for the work.",
      5: "Exceptional; work actively gives effect to Treaty/rights obligations."
    }
  }
];

export const PASSING_SCORE_PER_DIMENSION = 4;
export const PASSING_AVERAGE = 4.0;
