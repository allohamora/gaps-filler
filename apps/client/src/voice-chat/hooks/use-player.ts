import { base64ToArrayBuffer } from '../utils/audio';
import { Output } from '../utils/output';
import { useRef } from 'react';

export const usePlayer = () => {
  const outputRef = useRef<Output>(null);

  const startPlaying = async () => {
    if (outputRef.current) {
      return;
    }

    outputRef.current = await Output.create();
  };

  const stopPlaying = async () => {
    if (!outputRef.current) {
      return;
    }

    await outputRef.current.close();
    outputRef.current = null;
  };

  const enqueue = (data: string) => {
    if (!outputRef.current) {
      return;
    }

    outputRef.current.worklet.port.postMessage({
      type: 'buffer',
      buffer: base64ToArrayBuffer(data),
    });
  };

  return { startPlaying, stopPlaying, enqueue };
};
