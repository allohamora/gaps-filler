import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { LlmSession } from './services/llm.service.js';

const llm = new LlmSession();
const rl = readline.createInterface({ input, output });

while (true) {
  const input = await rl.question('User: ');

  const object = await llm.send(input);

  console.log(`Assistant: ${JSON.stringify(object, null, 2)}`);
}
