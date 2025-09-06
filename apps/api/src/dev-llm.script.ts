import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { text } from 'node:stream/consumers';
import { LlmSession } from './services/llm.service.js';

const llm = new LlmSession();
const rl = readline.createInterface({ input, output });

while (true) {
  const input = await rl.question('User: ');

  const stream = llm.stream(input);
  const response = await text(stream);

  console.log(`Assistant: ${response}`);
}
