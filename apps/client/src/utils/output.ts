// code was taken from https://github.com/elevenlabs/packages/tree/main/packages/client
import { SAMPLE_RATE } from '@/constants/audio';
import { loadAudioConcatProcessor } from '@/utils/worklet';

export type OutputDeps = {
  context: AudioContext;
  analyser: AnalyserNode;
  gain: GainNode;
  worklet: AudioWorkletNode;
};

export class Output {
  public readonly context: AudioContext;
  public readonly analyser: AnalyserNode;
  public readonly gain: GainNode;
  public readonly worklet: AudioWorkletNode;

  private constructor({ context, analyser, gain, worklet }: OutputDeps) {
    this.context = context;
    this.analyser = analyser;
    this.gain = gain;
    this.worklet = worklet;
  }

  public static async create(): Promise<Output> {
    let context: AudioContext | null = null;
    try {
      context = new AudioContext({ sampleRate: SAMPLE_RATE });
      const analyser = context.createAnalyser();
      const gain = context.createGain();
      gain.connect(analyser);
      analyser.connect(context.destination);
      await loadAudioConcatProcessor(context.audioWorklet);
      const worklet = new AudioWorkletNode(context, 'audio-concat-processor');
      worklet.port.postMessage({ type: 'setFormat', format: 'pcm' });
      worklet.connect(gain);

      await context.resume();

      return new Output({ context, analyser, gain, worklet });
    } catch (error) {
      context?.close();
      throw error;
    }
  }

  public async close() {
    await this.context.close();
  }
}
