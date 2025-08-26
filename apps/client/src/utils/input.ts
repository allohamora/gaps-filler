// code was taken from https://github.com/elevenlabs/packages/tree/main/packages/client
import { SAMPLE_RATE } from '@/constants/audio';
import { loadRawAudioProcessor } from './worklet';

const LIBSAMPLERATE_JS =
  'https://cdn.jsdelivr.net/npm/@alexanderolsen/libsamplerate-js@2.1.2/dist/libsamplerate.worklet.js';

export type InputDeps = {
  context: AudioContext;
  analyser: AnalyserNode;
  worklet: AudioWorkletNode;
  inputStream: MediaStream;
};

export class Input {
  public readonly context: AudioContext;
  public readonly analyser: AnalyserNode;
  public readonly worklet: AudioWorkletNode;
  public readonly inputStream: MediaStream;

  private constructor({ context, analyser, worklet, inputStream }: InputDeps) {
    this.context = context;
    this.analyser = analyser;
    this.worklet = worklet;
    this.inputStream = inputStream;
  }

  public static async create(): Promise<Input> {
    let context: AudioContext | null = null;
    let inputStream: MediaStream | null = null;

    try {
      const options: MediaTrackConstraints = {
        sampleRate: { ideal: SAMPLE_RATE },
        echoCancellation: { ideal: true },
        noiseSuppression: { ideal: true },
      };

      const supportsSampleRateConstraint = navigator.mediaDevices.getSupportedConstraints().sampleRate;

      context = new window.AudioContext(supportsSampleRateConstraint ? { sampleRate: SAMPLE_RATE } : {});
      const analyser = context.createAnalyser();
      if (!supportsSampleRateConstraint) {
        await context.audioWorklet.addModule(LIBSAMPLERATE_JS);
      }
      await loadRawAudioProcessor(context.audioWorklet);

      inputStream = await navigator.mediaDevices.getUserMedia({
        audio: options,
      });

      const source = context.createMediaStreamSource(inputStream);
      const worklet = new AudioWorkletNode(context, 'raw-audio-processor');
      worklet.port.postMessage({ type: 'setFormat', format: 'pcm', sampleRate: SAMPLE_RATE });

      source.connect(analyser);
      analyser.connect(worklet);

      await context.resume();

      return new Input({ context, analyser, worklet, inputStream });
    } catch (error) {
      inputStream?.getTracks().forEach((track) => track.stop());
      context?.close();
      throw error;
    }
  }

  public async close() {
    this.inputStream.getTracks().forEach((track) => track.stop());
    await this.context.close();
  }
}
