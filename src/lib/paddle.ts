import { initializePaddle, type Paddle } from "@paddle/paddle-js";

let paddleInstance: Paddle | undefined;

export async function initPaddle(): Promise<Paddle | undefined> {
  if (paddleInstance) return paddleInstance;

  paddleInstance = await initializePaddle({
    environment: import.meta.env.VITE_PADDLE_ENV,
    token: import.meta.env.VITE_PADDLE_KEY,
  });

  return paddleInstance;
}