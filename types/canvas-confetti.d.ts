// Minimal ambient declaration for canvas-confetti to satisfy TS if types not installed.
declare module "canvas-confetti" {
  interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: { x?: number; y?: number };
    scalar?: number;
    shapes?: string[];
    colors?: string[];
    disableForReducedMotion?: boolean;
  }
  type ConfettiFn = (opts?: ConfettiOptions) => Promise<null> | null | void;
  const confetti: ConfettiFn;
  export default confetti;
}
