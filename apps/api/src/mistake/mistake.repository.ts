import { JSONFilePreset } from 'lowdb/node';
import { Mistake } from '../services/chat.service.js';
import { Low } from 'lowdb';
import { randomUUID } from 'node:crypto';
import { Exercises } from './services/exercise.service.js';

export type SavedMistake = Mistake & {
  id: string;
  task?: {
    summary: string;
    exercises: Exercises;
  };
};

type Data = { mistakes: SavedMistake[] };

class MistakesRepository {
  private db: Low<Data>;

  public async init() {
    this.db = await JSONFilePreset('db.json', { mistakes: [] } as Data);
  }

  public async createMistake(mistake: Mistake) {
    const newMistake = { ...mistake, id: randomUUID() };

    this.db.data.mistakes.push(newMistake);
    await this.db.write();

    return newMistake;
  }

  public async getMistakes() {
    return this.db.data.mistakes;
  }

  public getMistakeById(mistakeId: string) {
    const mistake = this.db.data.mistakes.find((m) => m.id === mistakeId);

    if (!mistake) {
      throw new Error('mistake is not found');
    }

    return mistake;
  }

  public async updateMistake(mistakeId: string, update: Partial<SavedMistake>) {
    const mistake = this.getMistakeById(mistakeId);

    const result = Object.assign(mistake, update);
    await this.db.write();

    return result as SavedMistake;
  }
}

export const mistakesRepository = new MistakesRepository();
