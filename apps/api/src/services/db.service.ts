import { JSONFilePreset } from 'lowdb/node';
import { Mistake } from './llm.service.js';
import { Low } from 'lowdb';

type Data = { mistakes: Mistake[] };

class DbService {
  private db: Low<Data>;

  public async init() {
    this.db = await JSONFilePreset('db.json', { mistakes: [] } as Data);
  }

  public async createMistakes(mistakes: Mistake[]) {
    this.db.data.mistakes.push(...mistakes);
    await this.db.write();
  }

  public async getMistakes(): Promise<Mistake[]> {
    return this.db.data.mistakes;
  }
}

export const dbService = new DbService();
