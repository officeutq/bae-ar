export type BeautyEngineState =
  | "idle"
  | "initialized"
  | "running"
  | "stopped"
  | "disposed"

export type BeautyEngineInput =
  | HTMLVideoElement
  | HTMLCanvasElement
  | HTMLImageElement

export interface BeautyEngineOptions {
  input?: BeautyEngineInput
}
