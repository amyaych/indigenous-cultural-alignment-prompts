/**
 * Test Fixtures
 * These are sample documents used as inputs to the prompt evaluator.
 * Each fixture has an expected minimum score range per dimension
 * so we can assert the prompt is performing as intended.
 *
 * Fixtures represent three quality tiers:
 *   - STRONG: A document doing most things well — should score 3–5 across dimensions
 *   - MIXED: A document with genuine effort but significant gaps — mixed scores expected
 *   - WEAK: A document with minimal or tokenistic engagement — should score 0–2 across most dimensions
 */

export const FIXTURES = {
  /**
   * STRONG FIXTURE
   * A housing development proposal that explicitly names mana whenua,
   * references an iwi management plan, has paid engagement, and defines
   * community benefit clearly.
   */
  strong: {
    label: "Strong — Housing development proposal with genuine engagement",
    expectedMinAverageScore: 3.5,
    document: `
HOUSING DEVELOPMENT PROPOSAL — ŌTAUTAHI (CHRISTCHURCH)
Prepared by: Community Housing Trust

MANA WHENUA ENGAGEMENT
This proposal has been developed in partnership with Ngāi Tūāhuriri, the principal hapū of Ngāi Tahu
with mana whenua over Ōtautahi. Engagement was initiated in April 2024 through a formal hui at
Tuahiwi Marae. Ngāi Tūāhuriri representatives were engaged as paid cultural advisors throughout
the design process at a rate of $150/hour, with all travel costs covered.

The Ngāi Tahu iwi management plan (Te Rūnanga o Ngāi Tahu, 2023) has been reviewed and this
proposal is designed to align with its housing and papakāinga principles. Specifically, the plan's
guidance on maintaining wāhi tapu (sacred sites) and protecting awa (waterways) has shaped the
site selection and design.

TE TIRITI O WAITANGI
This proposal acknowledges our obligations under Te Tiriti o Waitangi. The partnership principle
is reflected in the co-design process with Ngāi Tūāhuriri. The protection principle has guided our
approach to environmental impact assessment.

COMMUNITY BENEFIT
Ngāi Tūāhuriri will have right of first refusal on 20% of housing units at cost price. The iwi will
receive 5% of net proceeds from any future sale of the development. All research data collected
during community consultation will be held jointly by the Trust and Ngāi Tūāhuriri, governed by
a data sharing agreement that reflects Te Mana Raraunga principles — Māori data sovereignty
is acknowledged and the community retains authority over how data about them is used.

TE REO MĀORI
This document uses te reo Māori throughout with macrons (tohutō). Te reo usage has been reviewed
by a fluent speaker from Ngāi Tūāhuriri to ensure accuracy and appropriate contextualisation.

TIKANGA
Karakia were conducted at the opening of all hui. Tikanga protocols for site visits were
established with guidance from kaumātua. The marae provided guidance on appropriate kawa
for all formal engagement processes.
    `,
  },

  /**
   * MIXED FIXTURE
   * A technology product brief that mentions Māori users, uses some te reo,
   * but has no identified mana whenua, no compensation, and vague benefit claims.
   */
  mixed: {
    label: "Mixed — Tech product brief with tokenistic cultural references",
    expectedMinAverageScore: 1.5,
    expectedMaxAverageScore: 3.0,
    document: `
PRODUCT BRIEF — DIGITAL WELLBEING APP
Te Ora — A Wellness App for New Zealanders

OVERVIEW
Te Ora is a wellness app designed for New Zealanders, with features that celebrate Māori culture
and wellbeing concepts. The app incorporates te reo Māori phrases and references to hauora
(health) and whanaungatanga (relationships).

CULTURAL APPROACH
We want to be respectful of Māori culture. We consulted with a Māori staff member internally
to review the cultural content. The app uses words like whānau, hauora, and manaakitanga.

TARGET AUDIENCE
Our target audience is all New Zealanders, including Māori communities who we hope will
connect with the cultural elements of the app.

COMMUNITY BENEFIT
We believe this app will benefit Māori communities by making wellness more accessible and
by celebrating Māori culture in a digital context.

DATA
User data will be collected in line with New Zealand Privacy Act requirements. We will collect
anonymised usage data to improve the product.

NEXT STEPS
We will do a soft launch and gather feedback from users including Māori users.
    `,
  },

  /**
   * WEAK FIXTURE
   * A policy document that makes no reference to Māori, Treaty obligations,
   * or cultural considerations despite operating in a context where these are relevant.
   */
  weak: {
    label: "Weak — Policy document with no cultural or Treaty consideration",
    expectedMaxAverageScore: 1.5,
    document: `
PROCUREMENT POLICY — REGIONAL COUNCIL SERVICES
Effective Date: January 2025

PURPOSE
This policy governs the procurement of goods and services by the Regional Council.
All procurement decisions will be made on the basis of value for money, quality, and
supplier capability.

SCOPE
This policy applies to all procurement activities valued over $10,000.

SUPPLIER SELECTION
Suppliers will be evaluated on price, quality, delivery capability, and financial stability.
Preference will be given to local suppliers where pricing is competitive.

CONTRACT MANAGEMENT
All contracts will include standard performance KPIs, payment terms of 20 working days,
and dispute resolution processes.

APPROVAL THRESHOLDS
Procurement under $50,000: Manager approval
Procurement $50,000–$500,000: Executive approval
Procurement over $500,000: Council approval

REVIEW
This policy will be reviewed every three years.
    `,
  },
};
