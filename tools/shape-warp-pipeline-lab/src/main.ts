import { FaceLandmarker } from "@mediapipe/tasks-vision"
import "./style.css"
import {
  buildCurrentFaceFrame,
  createCurrentFaceErrorFrame,
  createEmptyPose,
  createFaceLandmarker,
  hasFullPose,
} from "./currentFace"
import {
  buildActualVisibleLandmarkSelection,
  isFiniteLandmark,
  isFinitePoint2,
  normalizedLandmarkToRectPoint,
} from "./actualVisibility"
import {
  buildAlignment,
  createEmptyAlignmentResult,
} from "./alignment"
import {
  buildBackgroundGrid,
  createEmptyBackgroundGridState,
} from "./backgroundGrid"
import {
  buildCombinedMesh,
  createEmptyCombinedMeshState,
} from "./combinedMesh"
import {
  buildAlignmentDebugJson,
  buildBackgroundGridDebugJson,
  buildCombinedMeshDebugJson,
  buildCombinedMeshSummaryCsv,
  buildCurrentFaceDebugJson,
  buildRenderedIdealDebugJson,
  copyText,
  downloadJson,
  downloadText,
  formatDebugSummary,
} from "./debugDownloads"
import {
  buildRenderedIdealStateFromDetection,
  convertProfilePoseToWebglRenderPose,
  createEmptyObjGeometry,
  createEmptyObjSummary,
  createEmptyRenderedIdealState,
  createObjErrorSummary,
  createObjGeometry,
  createObjSummary,
  createRenderedIdealErrorState,
  evaluatePoseMappingProfile,
  parseObjText,
  parsePoseMappingProfile,
  renderObjToCanvas,
  resolveRenderAppearance,
  resolveRenderSettings,
} from "./renderedIdeal"
import type {
  ActualVisibleLandmarkSelection,
  AlignmentResult,
  BackgroundGridState,
  CombinedMeshState,
  CurrentFaceFrame,
  Landmark,
  ObjGeometry,
  ObjSummary,
  PoseMappingProfile,
  PreviewTab,
  Rect,
  RenderedIdealState,
} from "./types"

type ToggleState = {
  currentFace: {
    showCurrent478: boolean
    showActualVisible: boolean
    showHidden: boolean
  }
  renderedIdeal: {
    showRenderedIdeal478: boolean
  }
  alignment: {
    showCurrentVisible: boolean
    showAlignedVisible: boolean
    showCorrespondenceLines: boolean
  }
  backgroundGrid: {
    showInterior: boolean
    showBoundary: boolean
    showFaceTriangles: boolean
  }
  combinedMesh: {
    showSourceVertices: boolean
    showTargetVertices: boolean
    showSourceMesh: boolean
    showTargetMesh: boolean
    showCorrespondenceLines: boolean
  }
}

type LabState = {
  activeTab: PreviewTab
  objGeometry: ObjGeometry
  objSummary: ObjSummary
  poseMappingProfile: PoseMappingProfile | null
  poseMappingProfileFileName: string | null
  poseMappingProfileError: string | null
  video: {
    loaded: boolean
    fileName: string | null
    objectUrl: string | null
    width: number | null
    height: number | null
    durationSec: number | null
    playbackStatus: "stopped" | "playing" | "paused"
  }
  currentFace: CurrentFaceFrame
  actualVisibilitySelection: ActualVisibleLandmarkSelection
  renderedIdeal: RenderedIdealState
  alignment: AlignmentResult
  backgroundGrid: BackgroundGridState
  combinedMesh: CombinedMeshState
  toggles: ToggleState
  pipeline: {
    busy: boolean
    pendingFrameId: number | null
    latestCompletedFrameId: number | null
    recoveryRequestCount: number
    busyPendingCount: number
  }
  webglWarpStatus: "not_implemented"
  copyStatus: string
}

type VideoElementWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    callback: (now: DOMHighResTimeStamp, metadata: { mediaTime: number }) => void,
  ) => number
  cancelVideoFrameCallback?: (handle: number) => void
}

const app = document.querySelector<HTMLDivElement>("#app")
if (!app) {
  throw new Error("#app が見つかりません。")
}

app.innerHTML = `
  <div class="lab-shell">
    <aside class="panel left-panel" aria-label="操作">
      <div class="lab-title">
        <p>Shape Warp Pipeline Lab</p>
      </div>
      <div class="control-stack">
        <button class="primary-button" type="button" data-action="load-obj">OBJ読込</button>
        <button class="secondary-button" type="button" data-action="load-profile">poseMappingProfile読込</button>
        <button class="secondary-button" type="button" data-action="load-mp4">MP4読込</button>
        <button class="secondary-button" type="button" data-action="play">再生</button>
        <button class="secondary-button" type="button" data-action="pause">停止</button>
        <button class="secondary-button" type="button" data-action="reset">リセット</button>
      </div>
      <input hidden type="file" accept=".obj,text/plain" data-input="obj" />
      <input hidden type="file" accept=".json,application/json" data-input="profile" />
      <input hidden type="file" accept="video/mp4,.mp4" data-input="mp4" />
    </aside>

    <main class="panel center-panel" aria-label="プレビュー">
      <div class="preview-tabs" role="tablist" aria-label="preview tabs">
        <button class="tab-button active" type="button" data-tab="currentFace">現在顔</button>
        <button class="tab-button" type="button" data-tab="renderedIdeal">レンダー理想顔</button>
        <button class="tab-button" type="button" data-tab="alignment">位置合わせ重ね描き</button>
        <button class="tab-button" type="button" data-tab="backgroundGrid">背景格子</button>
        <button class="tab-button" type="button" data-tab="combinedMesh">結合メッシュ</button>
      </div>
      <div class="preview-stage">
        <canvas data-preview-canvas></canvas>
      </div>
      <video class="source-video" muted playsinline data-video></video>
    </main>

    <aside class="panel right-panel" aria-label="デバッグ">
      <h2 data-debug-title>現在顔デバッグ</h2>
      <div class="toggle-panel" data-toggle-panel></div>
      <pre class="debug-summary" data-debug-summary></pre>
      <div class="download-stack">
        <button class="secondary-button" type="button" data-action="download-debug">デバッグJSONダウンロード</button>
        <button class="secondary-button" type="button" data-action="copy-summary">デバッグ要約コピー</button>
        <button class="secondary-button" type="button" data-action="download-csv">CSVダウンロード</button>
      </div>
      <p class="copy-status" data-copy-status></p>
    </aside>
  </div>
`

const previewCanvas = getElement<HTMLCanvasElement>("[data-preview-canvas]")
const videoElement = getElement<VideoElementWithFrameCallback>("[data-video]")
const objInput = getElement<HTMLInputElement>("[data-input='obj']")
const profileInput = getElement<HTMLInputElement>("[data-input='profile']")
const mp4Input = getElement<HTMLInputElement>("[data-input='mp4']")
const debugTitle = getElement<HTMLElement>("[data-debug-title]")
const togglePanel = getElement<HTMLElement>("[data-toggle-panel]")
const debugSummary = getElement<HTMLElement>("[data-debug-summary]")
const copyStatus = getElement<HTMLElement>("[data-copy-status]")
const renderedIdealCanvas = document.createElement("canvas")

let currentFaceLandmarker: FaceLandmarker | null = null
let currentFaceLandmarkerPromise: Promise<FaceLandmarker> | null = null
let renderedIdealLandmarker: FaceLandmarker | null = null
let renderedIdealLandmarkerPromise: Promise<FaceLandmarker> | null = null
let currentAnalysisBusy = false
let currentAnalysisPending = false
let pipelineBusy = false
let pendingPipelineFrame: CurrentFaceFrame | null = null
let frameIdCounter = 0
let videoFrameCallbackHandle: number | null = null
let animationFrameHandle: number | null = null

const state: LabState = {
  activeTab: "currentFace",
  objGeometry: createEmptyObjGeometry(),
  objSummary: createEmptyObjSummary(),
  poseMappingProfile: null,
  poseMappingProfileFileName: null,
  poseMappingProfileError: null,
  video: {
    loaded: false,
    fileName: null,
    objectUrl: null,
    width: null,
    height: null,
    durationSec: null,
    playbackStatus: "stopped",
  },
  currentFace: createInitialCurrentFaceFrame(),
  actualVisibilitySelection: buildActualVisibleLandmarkSelection(null, createFallbackPreviewRect(), null),
  renderedIdeal: createEmptyRenderedIdealState(),
  alignment: createInitialAlignmentResult(),
  backgroundGrid: createEmptyBackgroundGridState("not_ready"),
  combinedMesh: createEmptyCombinedMeshState("not_ready"),
  toggles: {
    currentFace: {
      showCurrent478: true,
      showActualVisible: true,
      showHidden: true,
    },
    renderedIdeal: {
      showRenderedIdeal478: true,
    },
    alignment: {
      showCurrentVisible: true,
      showAlignedVisible: true,
      showCorrespondenceLines: true,
    },
    backgroundGrid: {
      showInterior: true,
      showBoundary: true,
      showFaceTriangles: true,
    },
    combinedMesh: {
      showSourceVertices: true,
      showTargetVertices: true,
      showSourceMesh: true,
      showTargetMesh: false,
      showCorrespondenceLines: true,
    },
  },
  pipeline: {
    busy: false,
    pendingFrameId: null,
    latestCompletedFrameId: null,
    recoveryRequestCount: 0,
    busyPendingCount: 0,
  },
  webglWarpStatus: "not_implemented",
  copyStatus: "",
}

bindEvents()
renderAll()

function bindEvents(): void {
  getElement<HTMLButtonElement>("[data-action='load-obj']").addEventListener("click", () => objInput.click())
  getElement<HTMLButtonElement>("[data-action='load-profile']").addEventListener("click", () => profileInput.click())
  getElement<HTMLButtonElement>("[data-action='load-mp4']").addEventListener("click", () => mp4Input.click())
  getElement<HTMLButtonElement>("[data-action='play']").addEventListener("click", () => void playVideo())
  getElement<HTMLButtonElement>("[data-action='pause']").addEventListener("click", pauseVideo)
  getElement<HTMLButtonElement>("[data-action='reset']").addEventListener("click", resetLab)
  getElement<HTMLButtonElement>("[data-action='download-debug']").addEventListener("click", downloadActiveDebugJson)
  getElement<HTMLButtonElement>("[data-action='copy-summary']").addEventListener("click", () => void copyActiveDebugSummary())
  getElement<HTMLButtonElement>("[data-action='download-csv']").addEventListener("click", downloadActiveCsv)

  document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab as PreviewTab
      renderAll()
    })
  })

  objInput.addEventListener("change", () => {
    const file = objInput.files?.[0]
    if (file) {
      void loadObjFile(file)
    }
    objInput.value = ""
  })
  profileInput.addEventListener("change", () => {
    const file = profileInput.files?.[0]
    if (file) {
      void loadPoseMappingProfileFile(file)
    }
    profileInput.value = ""
  })
  mp4Input.addEventListener("change", () => {
    const file = mp4Input.files?.[0]
    if (file) {
      loadMp4File(file)
    }
    mp4Input.value = ""
  })

  videoElement.addEventListener("loadedmetadata", () => {
    state.video.width = videoElement.videoWidth || null
    state.video.height = videoElement.videoHeight || null
    state.video.durationSec = Number.isFinite(videoElement.duration)
      ? videoElement.duration
      : null
    renderAll()
    scheduleCurrentFaceAnalysis()
  })
  videoElement.addEventListener("seeked", scheduleCurrentFaceAnalysis)
  videoElement.addEventListener("pause", () => {
    state.video.playbackStatus = "paused"
    cancelFrameLoop()
    renderDebug()
  })
  videoElement.addEventListener("ended", () => {
    state.video.playbackStatus = "stopped"
    cancelFrameLoop()
    renderDebug()
  })
  window.addEventListener("resize", renderAll)
}

async function loadObjFile(file: File): Promise<void> {
  try {
    const objText = await file.text()
    const parseResult = parseObjText(objText)
    state.objGeometry = createObjGeometry(parseResult)
    state.objSummary = createObjSummary(file.name, file.size, parseResult)
    state.renderedIdeal = createEmptyRenderedIdealState()
    clearFrameDerivedState("obj_loaded")
    schedulePipelineForCurrentFace()
  } catch (error) {
    state.objGeometry = createEmptyObjGeometry()
    state.objSummary = createObjErrorSummary(file.name, file.size, error)
    clearFrameDerivedState("obj_error")
  }
  renderAll()
}

async function loadPoseMappingProfileFile(file: File): Promise<void> {
  try {
    const json = JSON.parse(await file.text()) as unknown
    state.poseMappingProfile = parsePoseMappingProfile(json)
    state.poseMappingProfileFileName = file.name
    state.poseMappingProfileError = null
    state.renderedIdeal = createEmptyRenderedIdealState()
    clearFrameDerivedState("profile_loaded")
    schedulePipelineForCurrentFace()
  } catch (error) {
    state.poseMappingProfile = null
    state.poseMappingProfileFileName = file.name
    state.poseMappingProfileError = error instanceof Error ? error.message : String(error)
    clearFrameDerivedState("profile_error")
  }
  renderAll()
}

function loadMp4File(file: File): void {
  if (state.video.objectUrl) {
    URL.revokeObjectURL(state.video.objectUrl)
  }
  const objectUrl = URL.createObjectURL(file)
  state.video = {
    loaded: true,
    fileName: file.name,
    objectUrl,
    width: null,
    height: null,
    durationSec: null,
    playbackStatus: "stopped",
  }
  state.currentFace = createInitialCurrentFaceFrame()
  clearFrameDerivedState("mp4_loaded")
  videoElement.src = objectUrl
  videoElement.load()
  renderAll()
}

async function playVideo(): Promise<void> {
  if (!state.video.loaded) {
    return
  }
  await videoElement.play()
  state.video.playbackStatus = "playing"
  requestFrameLoop()
  renderDebug()
}

function pauseVideo(): void {
  videoElement.pause()
  state.video.playbackStatus = "paused"
  cancelFrameLoop()
  renderDebug()
}

function resetLab(): void {
  pauseVideo()
  if (state.video.objectUrl) {
    URL.revokeObjectURL(state.video.objectUrl)
  }
  state.objGeometry = createEmptyObjGeometry()
  state.objSummary = createEmptyObjSummary()
  state.poseMappingProfile = null
  state.poseMappingProfileFileName = null
  state.poseMappingProfileError = null
  state.video = {
    loaded: false,
    fileName: null,
    objectUrl: null,
    width: null,
    height: null,
    durationSec: null,
    playbackStatus: "stopped",
  }
  state.currentFace = createInitialCurrentFaceFrame()
  state.renderedIdeal = createEmptyRenderedIdealState()
  clearFrameDerivedState("reset")
  renderedIdealCanvas.width = 1
  renderedIdealCanvas.height = 1
  videoElement.removeAttribute("src")
  videoElement.load()
  renderAll()
}

function requestFrameLoop(): void {
  cancelFrameLoop()
  if (videoElement.requestVideoFrameCallback) {
    const tick = () => {
      videoFrameCallbackHandle = videoElement.requestVideoFrameCallback?.((_now, metadata) => {
        scheduleCurrentFaceAnalysis(metadata.mediaTime)
        if (!videoElement.paused && !videoElement.ended) {
          tick()
        }
      }) ?? null
    }
    tick()
    return
  }

  const tick = () => {
    scheduleCurrentFaceAnalysis(videoElement.currentTime)
    if (!videoElement.paused && !videoElement.ended) {
      animationFrameHandle = window.requestAnimationFrame(tick)
    }
  }
  animationFrameHandle = window.requestAnimationFrame(tick)
}

function cancelFrameLoop(): void {
  if (videoFrameCallbackHandle !== null && videoElement.cancelVideoFrameCallback) {
    videoElement.cancelVideoFrameCallback(videoFrameCallbackHandle)
  }
  if (animationFrameHandle !== null) {
    window.cancelAnimationFrame(animationFrameHandle)
  }
  videoFrameCallbackHandle = null
  animationFrameHandle = null
}

function scheduleCurrentFaceAnalysis(mediaTimeSec = videoElement.currentTime || 0): void {
  if (!state.video.loaded || videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    return
  }
  if (currentAnalysisBusy) {
    currentAnalysisPending = true
    return
  }
  void analyzeCurrentFaceFrame(mediaTimeSec)
}

async function analyzeCurrentFaceFrame(mediaTimeSec: number | null): Promise<void> {
  currentAnalysisBusy = true
  const frameId = frameIdCounter + 1
  frameIdCounter = frameId
  state.currentFace = {
    ...state.currentFace,
    currentFaceStatus: "detecting",
    frameId,
    mediaTimeSec,
  }
  renderAll()

  try {
    const detector = await getCurrentFaceLandmarker()
    const result = detector.detectForVideo(videoElement, performance.now())
    const frame = buildCurrentFaceFrame(result, frameId, mediaTimeSec)
    state.currentFace = frame
    updateFrameLocalVisibility(frame)
    if (frame.currentFaceStatus === "detected") {
      schedulePipeline(frame)
    } else {
      clearFrameDerivedState("no_current_face")
    }
  } catch (error) {
    state.currentFace = createCurrentFaceErrorFrame(frameId, mediaTimeSec, error)
    updateFrameLocalVisibility(state.currentFace)
    clearFrameDerivedState("current_face_error")
  } finally {
    currentAnalysisBusy = false
    renderAll()
    if (currentAnalysisPending) {
      currentAnalysisPending = false
      scheduleCurrentFaceAnalysis(videoElement.currentTime || mediaTimeSec || 0)
    }
  }
}

function updateFrameLocalVisibility(frame: CurrentFaceFrame): void {
  const rect = getDisplayedContentRect()
  state.actualVisibilitySelection = buildActualVisibleLandmarkSelection(
    frame.current478,
    rect,
    frame.P_camera.yaw,
  )
  state.alignment = createEmptyAlignmentResult({
    currentFaceStatus: frame.currentFaceStatus,
    renderedIdealStatus: state.renderedIdeal.renderedIdealStatus,
    frameId: frame.frameId,
    displayedContentRect: rect,
    current478: frame.current478,
    currentYawDeg: frame.P_camera.yaw,
    reason: "waiting_rendered_ideal",
  })
  state.alignment = {
    ...state.alignment,
    actualVisibilitySelection: state.actualVisibilitySelection,
  }
}

function schedulePipelineForCurrentFace(): void {
  if (state.currentFace.currentFaceStatus === "detected") {
    schedulePipeline(state.currentFace)
  }
}

function schedulePipeline(frame: CurrentFaceFrame): void {
  if (!state.poseMappingProfile || state.objSummary.parseStatus !== "parsed") {
    return
  }
  if (pipelineBusy) {
    pendingPipelineFrame = frame
    state.pipeline.pendingFrameId = frame.frameId
    state.pipeline.busyPendingCount += 1
    renderDebug()
    return
  }
  void runPipeline(frame)
}

async function runPipeline(frame: CurrentFaceFrame): Promise<void> {
  if (!state.poseMappingProfile || state.objSummary.parseStatus !== "parsed") {
    return
  }
  pipelineBusy = true
  state.pipeline.busy = true
  state.pipeline.pendingFrameId = null
  state.pipeline.recoveryRequestCount += 1
  state.renderedIdeal = {
    ...createEmptyRenderedIdealState(),
    objLoaded: true,
    poseMappingProfileLoaded: true,
    P_camera: frame.P_camera,
    renderedIdealStatus: "rendering",
  }
  renderAll()

  let pFromProfile = null as RenderedIdealState["pFromProfile"]
  let pForWebglRender = null as RenderedIdealState["pForWebglRender"]
  try {
    if (!frame.current478 || !hasFullPose(frame.P_camera)) {
      throw new Error("current face or P_camera is missing")
    }
    const profile = state.poseMappingProfile
    const evaluateResult = evaluatePoseMappingProfile(profile, frame.P_camera)
    pFromProfile = evaluateResult.p
    pForWebglRender = convertProfilePoseToWebglRenderPose(pFromProfile)
    const renderSettings = resolveRenderSettings(profile)
    const renderAppearance = resolveRenderAppearance(profile)
    const renderStartMs = performance.now()
    renderObjToCanvas({
      canvas: renderedIdealCanvas,
      geometry: state.objGeometry,
      summary: state.objSummary,
      pose: pForWebglRender,
      settings: renderSettings,
      appearance: renderAppearance,
    })
    const renderMs = performance.now() - renderStartMs
    const detector = await getRenderedIdealLandmarker()
    const detectStartMs = performance.now()
    const result = detector.detect(renderedIdealCanvas)
    const detectMs = performance.now() - detectStartMs
    const renderedIdeal = buildRenderedIdealStateFromDetection({
      result,
      P_camera: frame.P_camera,
      pFromProfile,
      pForWebglRender,
      renderSettings,
      renderMs,
      detectMs,
      warnings: evaluateResult.warnings,
      imageDataUrl: renderedIdealCanvas.toDataURL("image/png"),
    })

    if (state.currentFace.frameId !== frame.frameId || state.currentFace.currentFaceStatus !== "detected") {
      state.renderedIdeal = {
        ...renderedIdeal,
        renderedIdealStatus: "skipped",
        errorMessage: "stale_frame",
      }
      state.alignment = {
        ...state.alignment,
        debug: {
          ...state.alignment.debug,
          overlayLifecycle: {
            ...state.alignment.debug.overlayLifecycle,
            staleFrameRejected: true,
            skippedReason: "stale_frame",
          },
        },
      }
      return
    }

    state.renderedIdeal = renderedIdeal
    const rect = getDisplayedContentRect()
    state.alignment = buildAlignment({
      currentFaceStatus: frame.currentFaceStatus,
      renderedIdealStatus: renderedIdeal.renderedIdealStatus,
      frameId: frame.frameId,
      current478: frame.current478,
      renderedIdeal478: renderedIdeal.renderedIdeal478,
      currentYawDeg: frame.P_camera.yaw,
      displayedContentRect: rect,
    })
    state.actualVisibilitySelection = state.alignment.actualVisibilitySelection
    state.backgroundGrid = buildBackgroundGrid({
      currentLandmarks: frame.current478,
      displayedContentRect: rect,
      actualVisibleCurrentLandmarkIndices:
        state.alignment.actualVisibilitySelection.actualVisibleCurrentLandmarkIndices,
      actualHiddenCurrentLandmarkIndices:
        state.alignment.actualVisibilitySelection.actualHiddenCurrentLandmarkIndices,
    })
    state.combinedMesh = buildCombinedMesh({
      currentLandmarks: frame.current478,
      alignedRenderedIdeal478: state.alignment.alignedRenderedIdeal478,
      displayedContentRect: rect,
      actualVisibleCurrentLandmarkIndices:
        state.alignment.actualVisibilitySelection.actualVisibleCurrentLandmarkIndices,
      sourceBackgroundGridPointsPx: state.backgroundGrid.sourceBackgroundGridPointsPx,
      targetBackgroundGridPointsPx: state.backgroundGrid.targetBackgroundGridPointsPx,
    })
    state.pipeline.latestCompletedFrameId = frame.frameId
  } catch (error) {
    state.renderedIdeal = createRenderedIdealErrorState({
      P_camera: frame.P_camera,
      pFromProfile,
      pForWebglRender,
      error,
    })
    state.alignment = createEmptyAlignmentResult({
      currentFaceStatus: frame.currentFaceStatus,
      renderedIdealStatus: "error",
      frameId: frame.frameId,
      displayedContentRect: getDisplayedContentRect(),
      current478: frame.current478,
      currentYawDeg: frame.P_camera.yaw,
      reason: "rendered_ideal_error",
    })
    state.backgroundGrid = createEmptyBackgroundGridState("rendered_ideal_error")
    state.combinedMesh = createEmptyCombinedMeshState("rendered_ideal_error")
  } finally {
    pipelineBusy = false
    state.pipeline.busy = false
    renderAll()
    const pendingFrame = pendingPipelineFrame
    pendingPipelineFrame = null
    state.pipeline.pendingFrameId = null
    if (pendingFrame && pendingFrame.currentFaceStatus === "detected") {
      schedulePipeline(pendingFrame)
    }
  }
}

async function getCurrentFaceLandmarker(): Promise<FaceLandmarker> {
  if (currentFaceLandmarker) {
    return currentFaceLandmarker
  }
  if (!currentFaceLandmarkerPromise) {
    currentFaceLandmarkerPromise = createFaceLandmarker("VIDEO")
  }
  currentFaceLandmarker = await currentFaceLandmarkerPromise
  currentFaceLandmarkerPromise = null
  return currentFaceLandmarker
}

async function getRenderedIdealLandmarker(): Promise<FaceLandmarker> {
  if (renderedIdealLandmarker) {
    return renderedIdealLandmarker
  }
  if (!renderedIdealLandmarkerPromise) {
    renderedIdealLandmarkerPromise = createFaceLandmarker("IMAGE")
  }
  renderedIdealLandmarker = await renderedIdealLandmarkerPromise
  renderedIdealLandmarkerPromise = null
  return renderedIdealLandmarker
}

function clearFrameDerivedState(reason: string): void {
  const rect = getDisplayedContentRect()
  state.alignment = createEmptyAlignmentResult({
    currentFaceStatus: state.currentFace.currentFaceStatus,
    renderedIdealStatus: state.renderedIdeal.renderedIdealStatus,
    frameId: state.currentFace.frameId,
    displayedContentRect: rect,
    current478: state.currentFace.current478,
    currentYawDeg: state.currentFace.P_camera.yaw,
    reason,
  })
  state.actualVisibilitySelection = state.alignment.actualVisibilitySelection
  state.backgroundGrid = createEmptyBackgroundGridState(reason)
  state.combinedMesh = createEmptyCombinedMeshState(reason)
}

function renderAll(): void {
  renderTabs()
  renderPreview()
  renderDebug()
}

function renderTabs(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === state.activeTab)
  })
}

function renderPreview(): void {
  const context = previewCanvas.getContext("2d")
  if (!context) {
    return
  }
  ensurePreviewCanvasSize()
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.clearRect(0, 0, previewCanvas.width, previewCanvas.height)
  context.fillStyle = "#f7f9fb"
  context.fillRect(0, 0, previewCanvas.width, previewCanvas.height)

  if (state.activeTab === "currentFace") {
    drawCurrentFacePreview(context)
  } else if (state.activeTab === "renderedIdeal") {
    drawRenderedIdealPreview(context)
  } else if (state.activeTab === "alignment") {
    drawAlignmentPreview(context)
  } else if (state.activeTab === "backgroundGrid") {
    drawBackgroundGridPreview(context)
  } else {
    drawCombinedMeshPreview(context)
  }
}

function drawCurrentFacePreview(context: CanvasRenderingContext2D): void {
  const rect = drawVideoFrame(context)
  const landmarks = state.currentFace.current478
  if (!landmarks) {
    return
  }
  const visibleSet = new Set(state.actualVisibilitySelection.actualVisibleCurrentLandmarkIndices)
  if (state.toggles.currentFace.showCurrent478) {
    drawLandmarks(context, landmarks, rect, "rgba(42, 111, 219, 0.62)", 1.2)
  }
  if (state.toggles.currentFace.showHidden) {
    const hidden = landmarks.filter((landmark) => !visibleSet.has(landmark.index))
    drawLandmarks(context, hidden, rect, "rgba(110, 118, 128, 0.55)", 1.1)
  }
  if (state.toggles.currentFace.showActualVisible) {
    drawLandmarks(
      context,
      state.actualVisibilitySelection.actualVisibleCurrentLandmarks,
      rect,
      "rgba(18, 158, 115, 0.95)",
      1.7,
    )
  }
}

function drawRenderedIdealPreview(context: CanvasRenderingContext2D): void {
  const rect = drawRenderedIdealImage(context)
  if (state.toggles.renderedIdeal.showRenderedIdeal478 && state.renderedIdeal.renderedIdeal478) {
    drawLandmarks(context, state.renderedIdeal.renderedIdeal478, rect, "rgba(219, 68, 85, 0.9)", 1.45)
  }
}

function drawAlignmentPreview(context: CanvasRenderingContext2D): void {
  const rect = drawVideoFrame(context)
  const current = state.alignment.actualVisibilitySelection.actualVisibleCurrentLandmarks
  const aligned = state.alignment.actualVisibilitySelection.actualVisibleAlignedIdealLandmarks
  if (state.toggles.alignment.showCorrespondenceLines) {
    drawCorrespondenceLines(context, current, aligned, rect, rect, "rgba(96, 105, 120, 0.28)", 96)
  }
  if (state.toggles.alignment.showCurrentVisible) {
    drawLandmarks(context, current, rect, "rgba(18, 158, 115, 0.95)", 1.8)
  }
  if (state.toggles.alignment.showAlignedVisible) {
    drawLandmarks(context, aligned, rect, "rgba(219, 68, 85, 0.9)", 1.8)
  }
}

function drawBackgroundGridPreview(context: CanvasRenderingContext2D): void {
  drawVideoFrame(context)
  if (state.toggles.backgroundGrid.showFaceTriangles) {
    drawTriangles(context, state.backgroundGrid.faceInteriorTrianglesPx, "rgba(219, 68, 85, 0.16)")
  }
  if (state.toggles.backgroundGrid.showInterior) {
    drawPointList(
      context,
      state.backgroundGrid.sourceBackgroundGridPointsPx.filter((point) => point.kind === "backgroundGridInterior"),
      "rgba(42, 111, 219, 0.66)",
      1.35,
    )
  }
  if (state.toggles.backgroundGrid.showBoundary) {
    drawPointList(
      context,
      state.backgroundGrid.sourceBackgroundGridPointsPx.filter((point) => point.kind === "backgroundGridBoundary"),
      "rgba(22, 125, 97, 0.9)",
      1.75,
    )
  }
}

function drawCombinedMeshPreview(context: CanvasRenderingContext2D): void {
  const rect = getDisplayedContentRect()
  context.save()
  context.strokeStyle = "rgba(80, 89, 99, 0.16)"
  context.strokeRect(rect.x, rect.y, rect.width, rect.height)
  context.restore()
  if (state.toggles.combinedMesh.showSourceMesh) {
    drawWireMesh(
      context,
      state.combinedMesh.combinedSourceVerticesPx,
      state.combinedMesh.triangleIndices,
      "rgba(20, 150, 112, 0.28)",
    )
  }
  if (state.toggles.combinedMesh.showTargetMesh) {
    drawWireMesh(
      context,
      state.combinedMesh.combinedTargetVerticesPx,
      state.combinedMesh.triangleIndices,
      "rgba(219, 68, 85, 0.28)",
    )
  }
  if (state.toggles.combinedMesh.showCorrespondenceLines) {
    drawPointCorrespondenceLines(
      context,
      state.combinedMesh.combinedSourceVerticesPx,
      state.combinedMesh.combinedTargetVerticesPx,
      "rgba(96, 105, 120, 0.23)",
      96,
    )
  }
  if (state.toggles.combinedMesh.showSourceVertices) {
    drawPointList(context, state.combinedMesh.combinedSourceVerticesPx, "rgba(20, 150, 112, 0.92)", 1.55)
  }
  if (state.toggles.combinedMesh.showTargetVertices) {
    drawPointList(context, state.combinedMesh.combinedTargetVerticesPx, "rgba(219, 68, 85, 0.85)", 1.25)
  }
}

function renderDebug(): void {
  debugTitle.textContent = getDebugTitle()
  togglePanel.innerHTML = renderTogglePanel()
  debugSummary.textContent = formatDebugSummary(getActiveDebugSummary())
  copyStatus.textContent = state.copyStatus
  getElement<HTMLButtonElement>("[data-action='download-csv']").hidden = state.activeTab !== "combinedMesh"

  togglePanel.querySelectorAll<HTMLInputElement>("input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      updateToggle(checkbox.name, checkbox.checked)
      renderAll()
    })
  })
}

function renderTogglePanel(): string {
  if (state.activeTab === "currentFace") {
    return [
      renderCheckbox("showCurrent478", "current478を表示", state.toggles.currentFace.showCurrent478),
      renderCheckbox("showActualVisible", "実可視点を表示", state.toggles.currentFace.showActualVisible),
      renderCheckbox("showHidden", "非実可視点を表示", state.toggles.currentFace.showHidden),
    ].join("")
  }
  if (state.activeTab === "renderedIdeal") {
    return renderCheckbox("showRenderedIdeal478", "renderedIdeal478を表示", state.toggles.renderedIdeal.showRenderedIdeal478)
  }
  if (state.activeTab === "alignment") {
    return [
      renderCheckbox("showCurrentVisible", "現在顔の実可視点を表示", state.toggles.alignment.showCurrentVisible),
      renderCheckbox("showAlignedVisible", "位置合わせ済み理想点を表示", state.toggles.alignment.showAlignedVisible),
      renderCheckbox("showCorrespondenceLines", "対応線を表示", state.toggles.alignment.showCorrespondenceLines),
    ].join("")
  }
  if (state.activeTab === "backgroundGrid") {
    return [
      renderCheckbox("showInterior", "格子内部点を表示", state.toggles.backgroundGrid.showInterior),
      renderCheckbox("showBoundary", "格子境界点を表示", state.toggles.backgroundGrid.showBoundary),
      renderCheckbox("showFaceTriangles", "顔内部三角形を表示", state.toggles.backgroundGrid.showFaceTriangles),
    ].join("")
  }
  return [
    renderCheckbox("showSourceVertices", "変形元頂点を表示", state.toggles.combinedMesh.showSourceVertices),
    renderCheckbox("showTargetVertices", "変形先頂点を表示", state.toggles.combinedMesh.showTargetVertices),
    renderCheckbox("showSourceMesh", "変形元メッシュを表示", state.toggles.combinedMesh.showSourceMesh),
    renderCheckbox("showTargetMesh", "変形先メッシュを表示", state.toggles.combinedMesh.showTargetMesh),
    renderCheckbox("showCorrespondenceLines", "サンプル対応線を表示", state.toggles.combinedMesh.showCorrespondenceLines),
  ].join("")
}

function getActiveDebugSummary(): Record<string, unknown> {
  if (state.activeTab === "currentFace") {
    return {
      currentFaceStatus: state.currentFace.currentFaceStatus,
      frameId: state.currentFace.frameId,
      mediaTimeSec: state.currentFace.mediaTimeSec,
      landmarkCount: state.currentFace.landmarkCount,
      P_camera: state.currentFace.P_camera,
      qualityScore: state.currentFace.qualityScore,
      actualVisibilityDebug: state.actualVisibilitySelection.actualVisibilityDebug,
      excludedReasonCounts: state.actualVisibilitySelection.actualVisibilityDebug.excludedReasonCounts,
    }
  }
  if (state.activeTab === "renderedIdeal") {
    return {
      objLoaded: state.objSummary.parseStatus === "parsed",
      poseMappingProfileLoaded: Boolean(state.poseMappingProfile),
      P_camera: state.renderedIdeal.P_camera,
      pForWebglRender: state.renderedIdeal.pForWebglRender,
      renderBackend: state.renderedIdeal.renderBackend,
      renderResolution: state.renderedIdeal.renderResolution,
      renderedIdealStatus: state.renderedIdeal.renderedIdealStatus,
      renderedIdealLandmarkCount: state.renderedIdeal.renderedIdealLandmarkCount,
      P_confirm: state.renderedIdeal.P_confirm,
      poseDiff: state.renderedIdeal.poseDiff,
      renderMs: state.renderedIdeal.renderMs,
      detectMs: state.renderedIdeal.detectMs,
    }
  }
  if (state.activeTab === "alignment") {
    return state.alignment.debug as unknown as Record<string, unknown>
  }
  if (state.activeTab === "backgroundGrid") {
    return state.backgroundGrid.debug as unknown as Record<string, unknown>
  }
  return {
    ...state.combinedMesh.combinedMeshDebug,
    webglWarpStatus: state.webglWarpStatus,
  }
}

function downloadActiveDebugJson(): void {
  const stamp = getTimestampForFileName()
  if (state.activeTab === "currentFace") {
    downloadJson(
      `current-face-debug-${stamp}.json`,
      buildCurrentFaceDebugJson(state.currentFace, state.actualVisibilitySelection.actualVisibilityDebug),
    )
  } else if (state.activeTab === "renderedIdeal") {
    downloadJson(
      `rendered-ideal-debug-${stamp}.json`,
      buildRenderedIdealDebugJson(state.renderedIdeal),
    )
  } else if (state.activeTab === "alignment") {
    downloadJson(
      `alignment-overlay-debug-${stamp}.json`,
      buildAlignmentDebugJson(state.alignment.debug),
    )
  } else if (state.activeTab === "backgroundGrid") {
    downloadJson(
      `background-grid-debug-${stamp}.json`,
      buildBackgroundGridDebugJson(state.backgroundGrid.debug),
    )
  } else {
    downloadJson(
      `combined-mesh-debug-${stamp}.json`,
      buildCombinedMeshDebugJson(state.combinedMesh.combinedMeshDebug),
    )
  }
}

async function copyActiveDebugSummary(): Promise<void> {
  await copyText(debugSummary.textContent ?? "")
  state.copyStatus = "コピーしました。"
  renderDebug()
  window.setTimeout(() => {
    state.copyStatus = ""
    renderDebug()
  }, 1200)
}

function downloadActiveCsv(): void {
  if (state.activeTab !== "combinedMesh") {
    return
  }
  downloadText(
    `combined-mesh-summary-${getTimestampForFileName()}.csv`,
    buildCombinedMeshSummaryCsv(state.combinedMesh.combinedMeshDebug),
    "text/csv",
  )
}

function updateToggle(name: string, checked: boolean): void {
  const tab = state.activeTab
  if (tab === "currentFace" && name in state.toggles.currentFace) {
    state.toggles.currentFace[name as keyof ToggleState["currentFace"]] = checked
  } else if (tab === "renderedIdeal" && name in state.toggles.renderedIdeal) {
    state.toggles.renderedIdeal[name as keyof ToggleState["renderedIdeal"]] = checked
  } else if (tab === "alignment" && name in state.toggles.alignment) {
    state.toggles.alignment[name as keyof ToggleState["alignment"]] = checked
  } else if (tab === "backgroundGrid" && name in state.toggles.backgroundGrid) {
    state.toggles.backgroundGrid[name as keyof ToggleState["backgroundGrid"]] = checked
  } else if (tab === "combinedMesh" && name in state.toggles.combinedMesh) {
    state.toggles.combinedMesh[name as keyof ToggleState["combinedMesh"]] = checked
  }
}

function drawVideoFrame(context: CanvasRenderingContext2D): Rect {
  const rect = getDisplayedContentRect()
  if (state.video.loaded && videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    context.drawImage(videoElement, rect.x, rect.y, rect.width, rect.height)
  } else {
    context.fillStyle = "#e9eef3"
    context.fillRect(rect.x, rect.y, rect.width, rect.height)
  }
  return rect
}

function drawRenderedIdealImage(context: CanvasRenderingContext2D): Rect {
  const rect = getRenderedIdealContentRect()
  if (renderedIdealCanvas.width > 1 && renderedIdealCanvas.height > 1) {
    context.drawImage(renderedIdealCanvas, rect.x, rect.y, rect.width, rect.height)
  } else {
    context.fillStyle = "#e9eef3"
    context.fillRect(rect.x, rect.y, rect.width, rect.height)
  }
  return rect
}

function drawLandmarks(
  context: CanvasRenderingContext2D,
  landmarks: readonly Landmark[],
  rect: Rect,
  color: string,
  radius: number,
): void {
  context.save()
  context.fillStyle = color
  for (const landmark of landmarks) {
    if (!isFiniteLandmark(landmark)) {
      continue
    }
    const point = normalizedLandmarkToRectPoint(landmark, rect)
    context.beginPath()
    context.arc(point.x, point.y, radius, 0, Math.PI * 2)
    context.fill()
  }
  context.restore()
}

function drawPointList(
  context: CanvasRenderingContext2D,
  points: readonly { x: number; y: number }[],
  color: string,
  radius: number,
): void {
  context.save()
  context.fillStyle = color
  for (const point of points) {
    if (!isFinitePoint2(point)) {
      continue
    }
    context.beginPath()
    context.arc(point.x, point.y, radius, 0, Math.PI * 2)
    context.fill()
  }
  context.restore()
}

function drawCorrespondenceLines(
  context: CanvasRenderingContext2D,
  sourceLandmarks: readonly Landmark[],
  targetLandmarks: readonly Landmark[],
  sourceRect: Rect,
  targetRect: Rect,
  color: string,
  maxLines: number,
): void {
  const count = Math.min(sourceLandmarks.length, targetLandmarks.length)
  const step = Math.max(1, Math.ceil(count / maxLines))
  context.save()
  context.strokeStyle = color
  context.lineWidth = 1
  for (let index = 0; index < count; index += step) {
    const source = sourceLandmarks[index]
    const target = targetLandmarks[index]
    if (!isFiniteLandmark(source) || !isFiniteLandmark(target)) {
      continue
    }
    const sourcePoint = normalizedLandmarkToRectPoint(source, sourceRect)
    const targetPoint = normalizedLandmarkToRectPoint(target, targetRect)
    context.beginPath()
    context.moveTo(sourcePoint.x, sourcePoint.y)
    context.lineTo(targetPoint.x, targetPoint.y)
    context.stroke()
  }
  context.restore()
}

function drawPointCorrespondenceLines(
  context: CanvasRenderingContext2D,
  sourcePoints: readonly { x: number; y: number }[],
  targetPoints: readonly { x: number; y: number }[],
  color: string,
  maxLines: number,
): void {
  const count = Math.min(sourcePoints.length, targetPoints.length)
  const step = Math.max(1, Math.ceil(count / maxLines))
  context.save()
  context.strokeStyle = color
  context.lineWidth = 1
  for (let index = 0; index < count; index += step) {
    const source = sourcePoints[index]
    const target = targetPoints[index]
    if (!isFinitePoint2(source) || !isFinitePoint2(target)) {
      continue
    }
    context.beginPath()
    context.moveTo(source.x, source.y)
    context.lineTo(target.x, target.y)
    context.stroke()
  }
  context.restore()
}

function drawTriangles(
  context: CanvasRenderingContext2D,
  triangles: readonly { a: { x: number; y: number }; b: { x: number; y: number }; c: { x: number; y: number } }[],
  color: string,
): void {
  context.save()
  context.strokeStyle = color
  context.lineWidth = 1
  for (const triangle of triangles) {
    context.beginPath()
    context.moveTo(triangle.a.x, triangle.a.y)
    context.lineTo(triangle.b.x, triangle.b.y)
    context.lineTo(triangle.c.x, triangle.c.y)
    context.closePath()
    context.stroke()
  }
  context.restore()
}

function drawWireMesh(
  context: CanvasRenderingContext2D,
  vertices: readonly { x: number; y: number }[],
  triangleIndices: readonly number[],
  color: string,
): void {
  context.save()
  context.strokeStyle = color
  context.lineWidth = 0.8
  for (let offset = 0; offset + 2 < triangleIndices.length; offset += 3) {
    const a = vertices[triangleIndices[offset]]
    const b = vertices[triangleIndices[offset + 1]]
    const c = vertices[triangleIndices[offset + 2]]
    if (!isFinitePoint2(a) || !isFinitePoint2(b) || !isFinitePoint2(c)) {
      continue
    }
    context.beginPath()
    context.moveTo(a.x, a.y)
    context.lineTo(b.x, b.y)
    context.lineTo(c.x, c.y)
    context.closePath()
    context.stroke()
  }
  context.restore()
}

function getDisplayedContentRect(): Rect {
  ensurePreviewCanvasSize()
  const width = previewCanvas.width
  const height = previewCanvas.height
  const videoWidth = state.video.width ?? videoElement.videoWidth
  const videoHeight = state.video.height ?? videoElement.videoHeight
  if (!videoWidth || !videoHeight) {
    return createFallbackPreviewRect()
  }
  return getObjectFitContainRect(videoWidth, videoHeight, width, height)
}

function getRenderedIdealContentRect(): Rect {
  ensurePreviewCanvasSize()
  const sourceWidth = renderedIdealCanvas.width || 1
  const sourceHeight = renderedIdealCanvas.height || 1
  return getObjectFitContainRect(sourceWidth, sourceHeight, previewCanvas.width, previewCanvas.height)
}

function getObjectFitContainRect(
  sourceWidth: number,
  sourceHeight: number,
  containerWidth: number,
  containerHeight: number,
): Rect {
  const scale = Math.min(containerWidth / sourceWidth, containerHeight / sourceHeight)
  const width = sourceWidth * scale
  const height = sourceHeight * scale
  return {
    x: (containerWidth - width) / 2,
    y: (containerHeight - height) / 2,
    width,
    height,
  }
}

function ensurePreviewCanvasSize(): void {
  const dpr = window.devicePixelRatio || 1
  const rect = previewCanvas.getBoundingClientRect()
  const width = Math.max(1, Math.round(rect.width * dpr))
  const height = Math.max(1, Math.round(rect.height * dpr))
  if (previewCanvas.width !== width || previewCanvas.height !== height) {
    previewCanvas.width = width
    previewCanvas.height = height
  }
}

function createFallbackPreviewRect(): Rect {
  const width = previewCanvas.width || 960
  const height = previewCanvas.height || 640
  return {
    x: 0,
    y: 0,
    width,
    height,
  }
}

function createInitialCurrentFaceFrame(): CurrentFaceFrame {
  return {
    currentFaceStatus: "not_loaded",
    frameId: 0,
    mediaTimeSec: null,
    landmarkCount: 0,
    current478: null,
    P_camera: createEmptyPose(),
    qualityScore: 0,
    matrix: null,
    errorMessage: null,
  }
}

function createInitialAlignmentResult(): AlignmentResult {
  return createEmptyAlignmentResult({
    currentFaceStatus: "not_loaded",
    renderedIdealStatus: "idle",
    frameId: null,
    displayedContentRect: createFallbackPreviewRect(),
    current478: null,
    currentYawDeg: null,
    reason: "not_ready",
  })
}

function renderCheckbox(name: string, label: string, checked: boolean): string {
  return `
    <label class="toggle-row">
      <input type="checkbox" name="${name}" ${checked ? "checked" : ""} />
      <span>${label}</span>
    </label>
  `
}

function getDebugTitle(): string {
  if (state.activeTab === "currentFace") {
    return "現在顔デバッグ"
  }
  if (state.activeTab === "renderedIdeal") {
    return "レンダー理想顔デバッグ"
  }
  if (state.activeTab === "alignment") {
    return "位置合わせデバッグ"
  }
  if (state.activeTab === "backgroundGrid") {
    return "背景格子デバッグ"
  }
  return "結合メッシュデバッグ"
}

function getTimestampForFileName(): string {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, "0")
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("")
}

function getElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) {
    throw new Error(`${selector} が見つかりません。`)
  }
  return element
}

window.addEventListener("beforeunload", () => {
  currentFaceLandmarker?.close()
  renderedIdealLandmarker?.close()
  if (state.video.objectUrl) {
    URL.revokeObjectURL(state.video.objectUrl)
  }
})
