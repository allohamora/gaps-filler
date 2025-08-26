import { arrayBufferToBase64 } from '@/utils/audio';
import { Input } from '@/utils/input';
import { useRef } from 'react';

type UseMicrophoneOptions = {
  onData: (base64Data: string) => void;
};

export const useMicrophone = ({ onData }: UseMicrophoneOptions) => {
  const inputRef = useRef<Input | null>(null);

  const startListening = async () => {
    if (inputRef.current) {
      return;
    }

    inputRef.current = await Input.create();
    inputRef.current.worklet.port.onmessage = (event) => {
      const rawAudioPcmData = event.data[0];

      onData(arrayBufferToBase64(rawAudioPcmData.buffer));
    };
  };

  const stopListening = async () => {
    if (!inputRef.current) {
      return;
    }

    await inputRef.current.close();
    inputRef.current = null;
  };

  return { startListening, stopListening };
};
