import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { Chat } from './libs/chat.lib.js';

const main = async () => {
  const chat = new Chat();
  const rl = readline.createInterface({ input, output });

  while (true) {
    const input = await rl.question('User: ');

    const stream = await chat.stream(input);

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
};

void main();
