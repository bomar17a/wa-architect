
export enum ApplicationType {
  AMCAS = 'AMCAS',
  AACOMAS = 'AACOMAS',
}

export enum ActivityStatus {
  EMPTY = 'Empty',
  DRAFT = 'Draft',
  REFINED = 'Polished',
  FINAL = 'Final',
}

export interface DateRange {
  id: string;
  startDateMonth: string;
  startDateYear: string;
  endDateMonth: string;
  endDateYear: string;
  hours: string;
  isAnticipated?: boolean;
}

export interface Activity {
  id: number;
  title: string;
  organization: string;
  experienceType: string;
  city: string;
  country: string;
  dateRanges: DateRange[];
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  status: ActivityStatus;
  isMostMeaningful: boolean;
  description: string;
  mmeAction: string;
  mmeResult: string;
  mmeEssay: string;
  competencies: string[];
  dueDate?: string; // ISO Date string YYYY-MM-DD
}

export type View = 'LANDING' | 'DASHBOARD' | 'EDITOR';

export type RewriteType = 'CONCISE' | 'IMPACT' | 'REFLECTION';

export interface ArchitectAnalysis {
  generalFeedback: string;
  keepers: string[];
  trimmers: string[];
  suggestedCompetencies: string[];
}

export interface CompetencyAnalysis {
  competency: string;
  relatedActivityIds: number[];
  summary: string;
}

export interface ThemeAnalysis {
  overallSummary: string;
  analysis: CompetencyAnalysis[];
}
