
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

/** What the applicant has done about one review note. */
export type MmeNoteStatus = 'open' | 'done' | 'disagree';

/** A note about the essay as a whole: the story-level problems, biggest first. */
export interface MmeContentNote {
  id: string;
  category: string;
  note: string;
  question: string;
}

/** A note about one sentence. `quote` is always text taken from the applicant's own draft. */
export interface MmeLineNote {
  id: string;
  quote: string;
  category: string;
  note: string;
}

/**
 * One round of AI feedback, kept with the draft it was written against so a later round
 * can show what changed. The model never supplies replacement wording; see
 * services/mmeReviewFilter.ts for what is dropped before any of this is stored.
 */
export interface MmeReview {
  id: string;
  createdAt: string;
  /** The draft as it stood when the read was asked for. */
  draft: string;
  /** Scored locally by scoreMmeQuality, never by the model. */
  scores: { insight: number; evidence: number; distinctness: number; voice: number; total: number };
  strongest: string;
  biggestIssue: string;
  contentNotes: MmeContentNote[];
  lineNotes: MmeLineNote[];
  throughline: { lands: 'yes' | 'partly' | 'no'; note: string } | null;
  /** Material in the applicant's brainstorm notes that the draft leaves out. */
  fromYourNotes: string[];
  interviewQuestions: string[];
  /** What changed since the previous round, when there was one. */
  roundChange?: string;
  statuses: Record<string, MmeNoteStatus>;
}

/**
 * Private working state behind one Most Meaningful essay. None of it is exported or
 * pasted into AMCAS; it is the applicant's own brainstorming, in their own words.
 */
export interface MmeWorkshop {
  selfCheck?: Partial<Record<MmeSelfCheckKey, MmeSelfCheckAnswer>>;
  throughline?: string;
  notes?: Partial<Record<MmeBeat, string>>;
  /** Most recent last. Capped at MAX_MME_REVIEWS. */
  reviews?: MmeReview[];
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
