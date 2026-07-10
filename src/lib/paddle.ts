
import { initializePaddle } from "@paddle/paddle-js";

let paddleInstance = null;

export async function initPaddle() {
  if (paddleInstance) return paddleInstance;

  paddleInstance = await initializePaddle({
    environment:'sandbox',
    token: import.meta.env.VITE_PADDLE_KEY,
  });

  return paddleInstance;
}
