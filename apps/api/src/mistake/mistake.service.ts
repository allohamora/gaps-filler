import { mistakesRepository } from './mistake.repository.js';
import { generateExercises } from './services/exercise.service.js';
import { generateSummary } from './services/summary.service.js';

export const analyzeMistake = async (mistakeId: string) => {
  const mistake = mistakesRepository.getMistakeById(mistakeId);

  const [summary, exercises] = await Promise.all([generateSummary(mistake), generateExercises(mistake)]);

  return await mistakesRepository.updateMistake(mistakeId, { summary, exercises });
};
