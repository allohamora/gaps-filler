// code was taken from https://github.com/elevenlabs/packages/tree/main/packages/client

export const arrayBufferToBase64 = (buffer: ArrayBufferLike) => {
  const binaryString = String.fromCharCode(...new Uint8Array(buffer));
  return window.btoa(binaryString);
};

export const base64ToArrayBuffer = (base64: string) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};
