export interface FacePose {
  pitch: number
  yaw: number
  roll: number
}

export interface FaceLandmark {
  x: number
  y: number
  z: number
}

export interface FaceFrame {
  detected: boolean
  timestamp: number
  landmarks: FaceLandmark[]
  pose: FacePose
}
