export interface TestFixture {
  id: string;
  name: string;
  community: 'maori-nz' | 'aboriginal-torres-strait-islander' | 'first-nations-metis-inuit-canada' | 'fiji' | 'samoa' | 'tonga';
  type: 'general' | 'workplace';
  content: string;
  expectedScoreRange: {
    min: number;
    max: number;
  };
}

export const fixtures: TestFixture[] = [
  {
    id: 'maori-strong',
    name: 'Strong Māori Health Policy',
    community: 'maori-nz',
    type: 'general',
    content: `
      # Regional Health Strategy
      This strategy was developed in partnership with the iwi of the Tainui waka. 
      We recognize the mana whenua authority of Waikato-Tainui over this rohe.
      Our goal is to give effect to the principles of Te Tiriti o Waitangi, specifically Tino Rangatiratanga.
      We have adopted the CARE principles for data governance and have budgeted for professional fees for all iwi representatives involved in the steering group.
      We have obtained Free, Prior and Informed Consent (FPIC) from the iwi involved.
    `,
    expectedScoreRange: { min: 4.5, max: 5.0 }
  },
  {
    id: 'maori-weak',
    name: 'Weak Māori Marketing Plan',
    community: 'maori-nz',
    type: 'general',
    content: `
      # New Product Launch
      We want to use some Maori words like 'Kia Ora' and 'Aroha' to make our brand feel local.
      We will consult with some Maori people once the designs are finished.
      This will help us meet our diversity goals.
    `,
    expectedScoreRange: { min: 0.0, max: 2.0 }
  },
  {
    id: 'aboriginal-strong',
    name: 'Strong Aboriginal Land Management',
    community: 'aboriginal-torres-strait-islander',
    type: 'general',
    content: `
      # Country Management Plan
      This plan acknowledges the Eora people as the Traditional Owners of this Country.
      We have engaged with the local Land Council and Elders to ensure Sorry Business protocols are respected.
      The project is led by an Aboriginal-owned consultancy and includes a direct profit-sharing model with the community.
      We have obtained Free, Prior and Informed Consent (FPIC) from the Traditional Owners.
    `,
    expectedScoreRange: { min: 4.5, max: 5.0 }
  },
  {
    id: 'fiji-strong',
    name: 'Strong Fiji Community Project',
    community: 'fiji',
    type: 'general',
    content: `
      # Vanua Development Initiative
      This project is built on the foundation of the Vanua, recognizing the living connection between the land and the people.
      We have engaged in deep Talanoa with the traditional leadership and obtained Free, Prior and Informed Consent (FPIC).
      The project acknowledges the vastness of our oceanic relational spaces and ensures that the benefits are shared equitably.
    `,
    expectedScoreRange: { min: 4.5, max: 5.0 }
  },
  {
    id: 'samoa-strong',
    name: 'Strong Samoa Village Strategy',
    community: 'samoa',
    type: 'general',
    content: `
      # Village Empowerment Strategy
      This strategy is rooted in Fa'asamoa and respects the Fa'amatai (chiefly system).
      We have nurtured the Va (Teu le va) through long-term relational reciprocity.
      Free, Prior and Informed Consent (FPIC) has been obtained from the village council.
      The project ensures that Samoan self-determination is at the forefront of all decision-making.
    `,
    expectedScoreRange: { min: 4.5, max: 5.0 }
  },
  {
    id: 'tonga-strong',
    name: 'Strong Tonga Educational Program',
    community: 'tonga',
    type: 'general',
    content: `
      # Kakala Educational Framework
      This framework uses the Kakala methodology (Toli, Tui, Luva) to ensure the work has a lasting fragrance for the community.
      We have practiced Faka'apa'apa (respect) for Tongan traditional knowledge throughout the process.
      Free, Prior and Informed Consent (FPIC) was obtained from the community leaders.
      The program is designed to empower Tongan students while respecting their cultural heritage.
    `,
    expectedScoreRange: { min: 4.5, max: 5.0 }
  }
];
