# Prompt Evaluation Test Suite
### Indigenous Cultural Alignment Prompts — Māori / Aotearoa New Zealand

This test suite evaluates the cultural alignment prompts against a structured rubric of indigenous values and principles. It uses the Anthropic API to both run the prompts and evaluate their outputs — a pattern known as **LLM-as-evaluator**.

---

## What This Tests

Standard software tests check whether a function returns the right answer. Prompt testing is different — the outputs are generative and vary each run. So instead of asserting exact output, this suite asserts **output quality across defined dimensions**.

Each prompt response is scored 0–5 across ten dimensions:

| Dimension | What it measures |
|---|---|
| Tino Rangatiratanga | Does the response uphold Māori self-determination and authority? |
| Mana Whenua Recognition | Are specific iwi and hapū identified and centred? |
| Engagement Quality | What level of the participation spectrum is the work operating at? |
| Engagement Authenticity | Who is engaging, and do they have genuine relationships? |
| Data Sovereignty | Are CARE principles and Te Mana Raraunga applied? |
| Tikanga Alignment | Is cultural protocol handled with genuine understanding? |
| Te Reo Māori | Is language used correctly, consistently, and with depth? |
| Reciprocity — Cultural Load | Is community engagement compensated fairly? Is cultural burden acknowledged? |
| Reciprocity — Social Impact | Does the community materially benefit? Do they have access to outputs? |
| Te Tiriti Alignment | Are Treaty principles structurally embedded, not just named? |

**Scoring scale:**
- 0 = Absent or actively harmful
- 1 = Minimal — awareness only
- 2 = Emerging — some effort but significant gaps
- 3 = Developing — present and genuine but incomplete *(passing threshold)*
- 4 = Strong — well-considered and mostly complete
- 5 = Exemplary — could serve as a model

**Passing thresholds:**
- Per dimension: ≥ 3
- Overall average: ≥ 3.0

---

## How It Works

```
Test fixture (sample document)
        ↓
Loaded into the prompt (general or workplace version)
        ↓
Claude runs the review and returns a response
        ↓
A second Claude call evaluates the response against each rubric dimension
        ↓
Scores + reasoning printed to terminal
        ↓
Full JSON report saved to /tests/reports/
```

This two-call pattern (generate → evaluate) is standard in LLM evaluation frameworks like DeepEval and PromptFoo.

---

## Setup

**1. Clone the repository**
```bash
git clone https://github.com/your-username/indigenous-cultural-alignment-prompts.git
cd indigenous-cultural-alignment-prompts/tests
```

**2. Install dependencies**
```bash
npm install
```

**3. Add your Anthropic API key**
```bash
cp .env.example .env
# Edit .env and add your key
```

Or export it directly:
```bash
export ANTHROPIC_API_KEY=your_key_here
```

You can get an API key at: https://console.anthropic.com

---

## Running Tests

**Run all fixtures against all prompts:**
```bash
npm test
```

**Run a single fixture:**
```bash
npm run test:strong    # document doing most things well
npm run test:mixed     # document with tokenistic engagement
npm run test:weak      # document with no cultural consideration
```

**Run a single prompt:**
```bash
npm run test:general    # Māori NZ general review prompt
npm run test:workplace  # Māori NZ workplace review prompt
```

**Run one specific combination:**
```bash
node run-tests.js --fixture strong --prompt maori_general
```

---

## Test Fixtures

Three sample documents are included in `fixtures.js`:

| Fixture | Description | Expected range |
|---|---|---|
| `strong` | Housing proposal with paid mana whenua engagement, iwi management plan reference, data sovereignty agreement, defined community benefit | Average ≥ 3.5 |
| `mixed` | Tech app brief with internal Māori staff consulted, no mana whenua identified, vague benefit claims | Average 1.5–3.0 |
| `weak` | Regional council procurement policy with no cultural or Treaty consideration | Average ≤ 1.5 |

---

## Output

**Terminal report** — printed after each test run:
- Overall pass/fail with average score
- Per-dimension score with progress bar
- Reasoning and evidence for each score
- Lowest-scoring dimensions highlighted

**JSON report** — saved to `tests/reports/`:
```json
{
  "meta": { "timestamp": "...", "prompt": "...", "fixture": "..." },
  "summary": { "averageScore": 3.8, "overallPass": true, "dimensionsPassed": 9 },
  "dimensions": {
    "tino_rangatiratanga": {
      "score": 4,
      "passed": true,
      "reasoning": "...",
      "evidence": "..."
    }
  }
}
```

---

## Adding Your Own Test Documents

To test your own document, add it to `fixtures.js`:

```javascript
export const FIXTURES = {
  // ... existing fixtures ...

  my_document: {
    label: "My organisation's policy document",
    document: `paste your document text here`,
    // Optional: set expected score ranges
    expectedMinAverageScore: 2.0,
  },
};
```

Then run:
```bash
node run-tests.js --fixture my_document
```

---

## Cost Note

Each full test run makes approximately 12 API calls (1 prompt run + 10 evaluations + 1 summary). At current Claude Sonnet pricing this costs roughly USD $0.05–0.15 per fixture. Running all three fixtures against both prompts costs approximately USD $0.30–0.90.

---

## The Rubric as a Standalone Resource

The rubric in `rubric.js` is designed to be useful independently of the test suite. The ten dimensions — particularly the engagement quality ladder, the engagement authenticity dimension, and the two-part reciprocity dimension — can be used as a manual review framework for any professional context.

The reciprocity dimensions were deliberately designed to capture two distinct things that are often conflated:
- **Cultural load and compensation**: Whether communities are being fairly paid for the time, expertise, and emotional labour that engagement requires
- **Social impact and community benefit**: Whether the community materially benefits from what is produced, and whether they have a say in how those benefits are distributed

These are different questions and both matter.

---

*This evaluation suite was built as part of the [Indigenous Cultural Alignment Prompts](../README.md) project.*
