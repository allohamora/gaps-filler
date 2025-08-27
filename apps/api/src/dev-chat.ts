import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { Chat } from './libs/chat.lib.js';

const main = async () => {
  const chat = new Chat();
  const rl = readline.createInterface({ input, output });

  while (true) {
    const input = await rl.question('Input: ');

    const stream = await chat.stream(input);

    for await (const chunk of stream) {
      console.log(chunk);
    }
  }
};

void main();
