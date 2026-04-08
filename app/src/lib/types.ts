export type Region =
  | 'maori-aotearoa'
  | 'aboriginal-torres-strait-islander-australia'
  | 'first-nations-metis-inuit-canada'
  | 'fiji'
  | 'samoa'
  | 'tonga';

export type ReviewType = 'general' | 'workplace';

export type AnnotationType = 'positive' | 'observation' | 'provocation' | 'action';

export const REGIONS: { id: Region; label: string }[] = [
  { id: 'maori-aotearoa', label: 'Māori' },
  { id: 'aboriginal-torres-strait-islander-australia', label: 'Aboriginal & Torres Strait Islander' },
  { id: 'first-nations-metis-inuit-canada', label: 'First Nations, Métis & Inuit' },
  { id: 'fiji', label: 'iTaukei' },
  { id: 'samoa', label: 'Samoa' },
  { id: 'tonga', label: 'Tonga' },
];

export interface Annotation {
  id: string;
  type: AnnotationType;
  quote: string;
  comment: string;
  reference?: string;
}

export interface ReviewResult {
  overallScore: number;
  summary: string;
  annotations: Annotation[];
  region: Region;
  reviewType: ReviewType;
}

export type DocumentInputValue =
  | { kind: 'text'; content: string }
  | { kind: 'file'; file: File };

export interface IntakeFields {
  role: string;
  sector: string;
  localGroup: string;
  iwiContext: string;
}
