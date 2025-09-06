import { JSONFilePreset } from 'lowdb/node';
import { Mistake } from '../services/llm.service.js';
import { Low } from 'lowdb';
import { randomUUID } from 'node:crypto';

export type Question = {
  question: string;
  options: { value: string; isCorrect: boolean }[];
};

export type AnalyzableMistake = Mistake & { id: string; article?: string; questions?: Question[] };

type Data = { mistakes: AnalyzableMistake[] };

class MistakesRepository {
  private db: Low<Data>;

  public async init() {
    this.db = await JSONFilePreset('db.json', { mistakes: [] } as Data);
  }

  public async createMistakes(mistakes: Mistake[]) {
    const newMistakes = mistakes.map((m) => ({ ...m, id: randomUUID() }));

    this.db.data.mistakes.push(...newMistakes);
    await this.db.write();
  }

  public async getMistakes(): Promise<Mistake[]> {
    return this.db.data.mistakes;
  }

  public getMistakeById(mistakeId: string): Mistake | undefined {
    return this.db.data.mistakes.find((m) => m.id === mistakeId);
  }

  public async updateMistake(mistakeId: string, update: Partial<AnalyzableMistake>) {
    const mistake = this.getMistakeById(mistakeId);
    if (!mistake) {
      throw new Error('mistake is not found');
    }

    const result = Object.assign(mistake, update);
    await this.db.write();

    return result as AnalyzableMistake;
  }
}

export const mistakesRepository = new MistakesRepository();
