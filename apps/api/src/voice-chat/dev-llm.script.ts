import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { LlmSession } from './services/llm.service.js';

const llm = new LlmSession();
const rl = readline.createInterface({ input, output });

while (true) {
  const input = await rl.question('User: ');
  const stream = await llm.stream(input);

  const chunks = await stream.toArray();
  const response = chunks.join('').trim();

  console.log(`Assistant: ${response}`);
}
