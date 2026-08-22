export type Category = 'emotional' | 'physical' | 'behavioral';

export type AssessmentQuestion = {
  id: string;
  text: string;
  category: Category;
  reverse_scored: boolean;
  note: string;
  crisis?: boolean;
};

export type AssessmentAnswer = { questionId: string; answerValue: number };

export const answerLabels = ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'];

// This is a wellness adaptation inspired by common stress-screening question styles.
// It is not a diagnostic instrument. Positive PSS-style items are reverse-scored.
export const questions: AssessmentQuestion[] = [
  { id: 'emotional-01', category: 'emotional', text: 'In the last month, how often have you felt unable to control the important things in your life?', reverse_scored: false, note: 'Think about the last month as a whole.' },
  { id: 'emotional-02', category: 'emotional', text: 'In the last month, how often have you felt confident about your ability to handle your personal problems?', reverse_scored: true, note: 'Choose the answer that best reflects your recent experience.' },
  { id: 'emotional-03', category: 'emotional', text: 'In the last month, how often have you felt that things were going your way?', reverse_scored: true, note: 'There is no right answer here.' },
  { id: 'emotional-04', category: 'emotional', text: 'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?', reverse_scored: false, note: 'Notice the overall pattern, not one difficult moment.' },
  { id: 'physical-01', category: 'physical', text: 'My sleep has felt lighter, shorter, or less restorative.', reverse_scored: false, note: 'Consider your usual pattern as a baseline.' },
  { id: 'physical-02', category: 'physical', text: 'My body has felt tense, tight, or restless.', reverse_scored: false, note: 'Scan your shoulders, jaw, and hands.' },
  { id: 'behavioral-01', category: 'behavioral', text: 'I have been putting off tasks that normally feel manageable.', reverse_scored: false, note: 'No shame belongs in this space.' },
  { id: 'behavioral-02', category: 'behavioral', text: 'I have been withdrawing or avoiding messages and plans.', reverse_scored: false, note: 'Think about your instinct, even if you still showed up.' },
  { id: 'behavioral-03', category: 'behavioral', text: 'I have been working longer or finding it hard to take breaks.', reverse_scored: false, note: 'Rest is information, not a reward.' },
  { id: 'behavioral-04', category: 'behavioral', text: 'I have had thoughts of hurting myself or not wanting to be here.', reverse_scored: false, crisis: true, note: 'If this is anything other than “never”, support is available now.' },
];

export type AssessmentScore = {
  overallScore: number;
  band: 'low' | 'moderate' | 'high';
  categoryScores: Record<Category, number>;
  crisisFlag: boolean;
};

export function scoreAssessment(answers: AssessmentAnswer[]): AssessmentScore {
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer.answerValue]));
  const scoredQuestions = questions.filter((question) => !question.crisis);
  const adjusted = (question: AssessmentQuestion) => {
    const raw = answerMap.get(question.id) ?? 0;
    return question.reverse_scored ? 4 - raw : raw;
  };
  const total = scoredQuestions.reduce((sum, question) => sum + adjusted(question), 0);
  const overallScore = Math.round((total / (scoredQuestions.length * 4)) * 100);
  const categoryScores = (['emotional', 'physical', 'behavioral'] as Category[]).reduce(
    (result, category) => {
      const group = scoredQuestions.filter((question) => question.category === category);
      result[category] = Math.round((group.reduce((sum, question) => sum + adjusted(question), 0) / (group.length * 4)) * 100);
      return result;
    },
    {} as Record<Category, number>,
  );
  return {
    overallScore,
    band: overallScore < 34 ? 'low' : overallScore < 67 ? 'moderate' : 'high',
    categoryScores,
    crisisFlag: (answerMap.get('behavioral-04') ?? 0) > 0,
  };
}

export function shuffleQuestions(source: AssessmentQuestion[]): AssessmentQuestion[] {
  return [...source].sort(() => Math.random() - 0.5);
}