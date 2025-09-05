import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { LlmSession } from './services/llm.service.js';

const llm = new LlmSession();
const rl = readline.createInterface({ input, output });

while (true) {
  const input = await rl.question('User: ');

  const stream = await llm.stream(input);

  let isFirstChunk = true;

  for await (const chunk of stream) {
    if (isFirstChunk) {
      console.log(`Assistant: ${chunk}`);
      isFirstChunk = false;
    } else {
      console.log(chunk);
    }
  }
}
