
import { Activity, ActivityStatus, DateRange } from './types';

export const MAX_ACTIVITIES = 15;

export const DESC_LIMITS = {
  AMCAS: 700,
  AACOMAS: 600,
};

export const MME_LIMIT = 1325;

export const AMCAS_EXPERIENCE_TYPES = [
  "Artistic Endeavors",
  "Community Service/Volunteer - Medical/Clinical",
  "Community Service/Volunteer - Not Medical/Clinical",
  "Conferences Attended",
  "Extracurricular Activities",
  "Hobbies",
  "Honors/Awards/Recognitions",
  "Intercollegiate Athletics",
  "Leadership - Not Listed Elsewhere",
  "Military Service",
  "Other",
  "Paid Employment - Medical/Clinical",
  "Paid Employment - Not Medical/Clinical",
  "Physician Shadowing/Clinical Observation",
  "Presentations/Posters",
  "Publications",
  "Research/Lab",
  "Teaching/Tutoring/Teaching Assistant",
];

export const AACOMAS_EXPERIENCE_TYPES = [
    "Non-Healthcare Employment",
    "Non-Healthcare Volunteer",
    "Healthcare Experience",
    "Research",
    "Extracurricular Activities",
    "Leadership Experience",
    "Teaching Experience",
    "Achievements"
];

// Weighted values based on AdCom criteria for the Readiness Score
export const ACTIVITY_WEIGHTS: Record<string, number> = {
  "Community Service/Volunteer - Medical/Clinical": 3,
  "Community Service/Volunteer - Not Medical/Clinical": 3,
  "Physician Shadowing/Clinical Observation": 3,
  "Leadership - Not Listed Elsewhere": 3,
  "Paid Employment - Medical/Clinical": 3,
  "Research/Lab": 2.5,
  "Military Service": 2.5,
  "Paid Employment - Not Medical/Clinical": 2.5,
  "Extracurricular Activities": 2.5,
  "Artistic Endeavors": 2.5,
  "Hobbies": 2.5,
  "Other": 2.5,
  "Teaching/Tutoring/Teaching Assistant": 2,
  "Intercollegiate Athletics": 2,
  "Honors/Awards/Recognitions": 2,
  "Conferences Attended": 2,
  "Presentations/Posters": 2,
  "Publications": 2,
  "Healthcare Experience": 3,
  "Non-Healthcare Volunteer": 3,
  "Non-Healthcare Employment": 2.5,
  "Research": 2.5,
  "Leadership Experience": 3,
  "Teaching Experience": 2,
  "Achievements": 2,
};

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const getYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear + 6; i >= currentYear - 20; i--) {
    years.push(i.toString());
  }
  return years;
};

export const DEMO_ACTIVITIES: Activity[] = [
  {
    id: 1,
    title: 'Emergency Dept Volunteer',
    organization: 'City General Hospital',
    experienceType: 'Community Service/Volunteer - Medical/Clinical',
    city: 'San Francisco',
    country: 'USA',
    dateRanges: [{
      id: 'dr-demo-1',
      startDateMonth: 'June',
      startDateYear: '2023',
      endDateMonth: 'May',
      endDateYear: '2024',
      hours: '180',
    }],
    contactName: 'Jane Smith',
    contactTitle: 'Volunteer Coordinator',
    contactEmail: 'jsmith@citygen.org',
    contactPhone: '555-0101',
    status: ActivityStatus.REFINED,
    isMostMeaningful: true,
    description: 'Assisted nursing staff with patient comfort and turnover in a high-volume Level 1 Trauma Center. Observed clinical procedures and supported families during crises.',
    mmeAction: 'Spearheaded a new patient orientation guide for the ED waiting room.',
    mmeResult: 'Reduced patient anxiety scores and streamlined intake for non-critical cases.',
    mmeEssay: 'Working in the ED taught me that medicine is as much about emotional support as it is about clinical skill. I recall holding the hand of an elderly patient who was terrified of being alone; that moment shaped my commitment to patient-centered care.',
    competencies: ['Service Orientation', 'Social Skills', 'Resilience and Adaptability'],
    dueDate: '2025-05-20',
  },
  {
    id: 2,
    title: 'Undergraduate Researcher',
    organization: 'Biology Dept, State University',
    experienceType: 'Research/Lab',
    city: 'Seattle',
    country: 'USA',
    dateRanges: [{
      id: 'dr-demo-2',
      startDateMonth: 'August',
      startDateYear: '2022',
      endDateMonth: 'December',
      endDateYear: '2023',
      hours: '450',
    }],
    contactName: 'Dr. Alan Grant',
    contactTitle: 'Principal Investigator',
    contactEmail: 'agrant@stateu.edu',
    contactPhone: '555-0202',
    status: ActivityStatus.DRAFT,
    isMostMeaningful: false,
    description: 'Conducted wet lab experiments focusing on cellular signaling pathways in Drosophila. Managed lab inventory and presented data at bi-weekly lab meetings.',
    mmeAction: '',
    mmeResult: '',
    mmeEssay: '',
    competencies: ['Critical Thinking', 'Scientific Inquiry', 'Reliability and Dependability'],
    dueDate: '2025-06-15',
  }
];

export const getInitialActivities = (): Activity[] => {
  // Fix: Explicitly type the activities array to prevent type inference mismatch with demo activities
  const activities: Activity[] = Array.from({ length: MAX_ACTIVITIES }, (_, i) => ({
    id: i + 1,
    title: '',
    organization: '',
    experienceType: '',
    city: '',
    country: '',
    dateRanges: [{
      id: `dr-${Date.now()}-${i}`,
      startDateMonth: '',
      startDateYear: '',
      endDateMonth: '',
      endDateYear: '',
      hours: '',
      isAnticipated: false
    }],
    contactName: '',
    contactTitle: '',
    contactEmail: '',
    contactPhone: '',
    status: ActivityStatus.EMPTY,
    isMostMeaningful: false,
    description: '',
    mmeAction: '',
    mmeResult: '',
    mmeEssay: '',
    competencies: [],
    dueDate: '',
  }));

  // Merge demo activities into the first few slots for better UX
  DEMO_ACTIVITIES.forEach(demo => {
    activities[demo.id - 1] = demo;
  });

  return activities;
};

export const AAMC_CORE_COMPETENCIES = [
  "Service Orientation",
  "Social Skills",
  "Cultural Competence",
  "Teamwork",
  "Oral Communication",
  "Ethical Responsibility to Self and Others",
  "Reliability and Dependability",
  "Resilience and Adaptability",
  "Capacity for Improvement",
  "Critical Thinking",
  "Quantitative Reasoning",
  "Scientific Inquiry",
  "Written Communication",
  "Living Systems",
  "Human Behavior"
];
