
export interface AnalysisIssue {
  id: string;
  type: 'PASSIVE' | 'WEAK_VERB' | 'CLICHE';
  text: string;
  suggestion: string;
  index: number;
  length: number;
}

const WEAK_VERBS = new Map([
  ['help', 'facilitated, assisted, guided'],
  ['helped', 'facilitated, assisted, guided'],
  ['helping', 'facilitating, assisting, guiding'],
  ['watch', 'monitored, analyzed, surveyed'],
  ['watched', 'monitored, analyzed, surveyed'],
  ['watching', 'monitoring, analyzing, surveying'],
  ['observe', 'assess, evaluate, examine'],
  ['observed', 'assessed, evaluated, examined'],
  ['look', 'investigate, examine, explore'],
  ['looked', 'investigated, examined, explored'],
  ['got', 'acquired, obtained, secured'],
  ['make', 'construct, design, formulate'],
  ['made', 'constructed, designed, formulated'],
  ['do', 'execute, conduct, perform'],
  ['did', 'executed, conducted, performed'],
]);

const CLICHES = new Map([
  ['passion', 'deep interest, commitment, dedication'],
  ['passionate', 'committed, dedicated, enthusiastic'],
  ['hard worker', 'diligent, persistent, dedicated'],
  ['team player', 'collaborator, contributor'],
  ['outside the box', 'innovative, creative, unconventional'],
  ['interesting', 'compelling, intriguing, significant'],
  ['thirst for knowledge', 'intellectual curiosity, eagerness to learn'],
  ['sponge', 'rapid learner, adaptable'],
  ['like a family', 'close-knit, supportive, cohesive'],
]);

export const analyzeText = (text: string): AnalysisIssue[] => {
  const issues: AnalysisIssue[] = [];
  if (!text) return issues;

  // 1. Weak Verbs
  WEAK_VERBS.forEach((suggestion, verb) => {
    // Match whole words, case insensitive
    const regex = new RegExp(`\\b${verb}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      issues.push({
        id: `weak-${match.index}`,
        type: 'WEAK_VERB',
        text: match[0],
        suggestion: `Try active verbs: ${suggestion}`,
        index: match.index,
        length: match[0].length,
      });
    }
  });

  // 2. Cliches
  CLICHES.forEach((suggestion, cliche) => {
    const regex = new RegExp(`\\b${cliche}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      issues.push({
        id: `cliche-${match.index}`,
        type: 'CLICHE',
        text: match[0],
        suggestion: `Avoid clichés. Try: ${suggestion}`,
        index: match.index,
        length: match[0].length,
      });
    }
  });

  // 3. Passive Voice (Simple heuristic: was/were + word ending in ed)
  const passiveRegex = /\b(was|were)\s+([a-z]+ed)\b/gi;
  let match;
  while ((match = passiveRegex.exec(text)) !== null) {
    issues.push({
      id: `passive-${match.index}`,
      type: 'PASSIVE',
      text: match[0],
      suggestion: `Passive voice detected. Rewrite to make the subject perform the action.`,
      index: match.index,
      length: match[0].length,
    });
  }

  return issues.sort((a, b) => a.index - b.index);
};
