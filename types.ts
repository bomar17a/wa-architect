
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

/** The five parts of a Most Meaningful expansion, in reading order (H-CART). */
export type MmeBeat = 'moment' | 'challenge' | 'action' | 'change' | 'forward';

export type MmeSelfCheckKey = 'notJustImpressive' | 'specificMoment' | 'changedYou' | 'tenMinutes';
export type MmeSelfCheckAnswer = 'yes' | 'unsure' | 'no';

/**
 * Private working state behind one Most Meaningful essay. None of it is exported or
 * pasted into AMCAS; it is the applicant's own brainstorming, in their own words.
 */
export interface MmeWorkshop {
  selfCheck?: Partial<Record<MmeSelfCheckKey, MmeSelfCheckAnswer>>;
  throughline?: string;
  notes?: Partial<Record<MmeBeat, string>>;
  final?: { readAloud?: boolean; tenMinutes?: boolean };
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
  mmeWorkshop?: MmeWorkshop;
  competencies: string[];
  dueDate?: string; // ISO Date string YYYY-MM-DD
  tags?: string[];
  notes?: string;
  sortOrder?: number | null;
}

export type View = 'LANDING' | 'DASHBOARD' | 'EDITOR';

export type RewriteType = 'CONCISE' | 'IMPACT' | 'REFLECTION';

export interface ArchitectAnalysis {
  generalFeedback: string;
  keepers: string[];
  trimmers: string[];
  suggestedCompetencies: string[];
  frameworkAlignment?: {
    context: string;
    impact: string;
    reflection: string;
  };
}

export interface InterviewQuestion {
  question: string;
  whyAsked: string;
}

export interface StoryAnalysis {
  applicationArchetype: string;
  coreNarrative: string;
  missingChapter: string;
  redundancies: { activityIds: number[]; explanation: string }[];
  strengths: { title: string; activityIds: number[]; explanation: string }[];
}

export interface Profile {
  id: string;
  onboarded: boolean;
  applicationType: ApplicationType | null;
  cycleYear: number | null;      // null = "auto" (track nearest upcoming AMCAS opening)
  schoolTier: string | null;
  gpaRange: string | null;
  mcatRange: string | null;
  northStarArchetypes: string[];
  targetSchoolIds: string[];
  /** One line on the personal statement's main story, used to spot an MME that repeats it. */
  psSummary: string | null;
}

export interface SchoolAlignment {
  schoolName: string;
  fit: 'strong' | 'moderate' | 'weak';
  rationale: string;
  suggestedSentence: string;
}

export interface AiNarrativeQuality {
  specificity: number;
  quantification: number;
  reflection: number;
  voiceAuthenticity: number;
  summary: string;
  topFix: string;
}
