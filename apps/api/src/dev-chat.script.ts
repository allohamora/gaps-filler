import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { ChatSession } from './services/chat.service.js';

const chat = new ChatSession();
const rl = readline.createInterface({ input, output });

while (true) {
  const input = await rl.question('User: ');

  const object = await chat.send(input);

  console.log(`Assistant: ${JSON.stringify(object, null, 2)}`);
}
