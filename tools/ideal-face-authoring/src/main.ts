import {
  NATURAL_IDEAL_FACE_PRESET,
  type IdealFacePoint3D,
} from "@bae-ar/engine"

const idealFace = NATURAL_IDEAL_FACE_PRESET
const app = document.querySelector<HTMLDivElement>("#app")

if (!app) {
  throw new Error("IdealFace Authoring Tool app root was not found")
}

function formatNumber(value: number): string {
  return value.toFixed(3)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function getPreviewBounds(points: IdealFacePoint3D[]): {
  minX: number
  maxX: number
  minY: number
  maxY: number
} {
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const padding = 0.16

  return {
    minX: Math.min(...xs) - padding,
    maxX: Math.max(...xs) + padding,
    minY: Math.min(...ys) - padding,
    maxY: Math.max(...ys) + padding,
  }
}

function mapPointToPreview(
  point: IdealFacePoint3D,
  bounds: ReturnType<typeof getPreviewBounds>,
): { x: number; y: number } {
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY

  return {
    x: ((point.x - bounds.minX) / width) * 100,
    y: 100 - ((point.y - bounds.minY) / height) * 100,
  }
}

function renderPreview(points: IdealFacePoint3D[]): string {
  const bounds = getPreviewBounds(points)
  const axisOrigin = mapPointToPreview(
    { id: "origin", x: 0, y: 0, z: 0 },
    bounds,
  )
  const pointMarkup = points
    .map((point) => {
      const previewPoint = mapPointToPreview(point, bounds)
      const label = point.semantic ?? point.id

      return `
        <g class="preview-point">
          <circle cx="${previewPoint.x}" cy="${previewPoint.y}" r="1.7">
            <title>${escapeHtml(point.id)}</title>
          </circle>
          <text x="${previewPoint.x + 2.5}" y="${previewPoint.y - 2.5}">
            ${escapeHtml(label)}
          </text>
        </g>
      `
    })
    .join("")

  return `
    <svg class="preview" viewBox="0 0 100 100" role="img" aria-label="natural_v1 controlPoints preview">
      <line class="axis" x1="4" y1="${axisOrigin.y}" x2="96" y2="${axisOrigin.y}" />
      <line class="axis" x1="${axisOrigin.x}" y1="4" x2="${axisOrigin.x}" y2="96" />
      ${pointMarkup}
    </svg>
  `
}

function renderControlPointRows(points: IdealFacePoint3D[]): string {
  return points
    .map(
      (point) => `
        <tr>
          <td>${escapeHtml(point.id)}</td>
          <td>${escapeHtml(point.semantic ?? "")}</td>
          <td>${formatNumber(point.x)}</td>
          <td>${formatNumber(point.y)}</td>
          <td>${formatNumber(point.z)}</td>
        </tr>
      `,
    )
    .join("")
}

function render(): void {
  app.innerHTML = `
    <main>
      <header class="app-header">
        <div>
          <p class="eyebrow">BAE AR</p>
          <h1>IdealFace Authoring Tool</h1>
        </div>
        <span>Step 1</span>
      </header>

      <section class="summary" aria-label="IdealFace metadata">
        <dl>
          <div>
            <dt>preset id</dt>
            <dd>${escapeHtml(idealFace.metadata.id)}</dd>
          </div>
          <div>
            <dt>name</dt>
            <dd>${escapeHtml(idealFace.metadata.name)}</dd>
          </div>
          <div>
            <dt>version</dt>
            <dd>${escapeHtml(idealFace.metadata.version)}</dd>
          </div>
          <div>
            <dt>coordinateSpace</dt>
            <dd>${escapeHtml(idealFace.model.coordinateSpace)}</dd>
          </div>
          <div>
            <dt>control point count</dt>
            <dd>${idealFace.model.controlPoints.length}</dd>
          </div>
        </dl>
      </section>

      <section class="workspace">
        <div class="preview-panel">
          <h2>2D preview</h2>
          ${renderPreview(idealFace.model.controlPoints)}
        </div>

        <div class="table-panel">
          <h2>controlPoints</h2>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>id</th>
                  <th>label</th>
                  <th>x</th>
                  <th>y</th>
                  <th>z</th>
                </tr>
              </thead>
              <tbody>
                ${renderControlPointRows(idealFace.model.controlPoints)}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="json-panel">
        <h2>JSON preview</h2>
        <pre>${escapeHtml(JSON.stringify(idealFace, null, 2))}</pre>
      </section>
    </main>
  `
}

const style = document.createElement("style")

style.textContent = `
  :root {
    color: #17201b;
    background: #f4f7f6;
    font-family:
      Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
      "Segoe UI", sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
  }

  main {
    width: min(1180px, calc(100% - 32px));
    margin: 0 auto;
    padding: 24px 0 32px;
  }

  .app-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
    border-bottom: 1px solid #ccd8d3;
    padding-bottom: 16px;
  }

  .app-header h1 {
    margin: 0;
    font-size: 28px;
    line-height: 1.15;
    letter-spacing: 0;
  }

  .app-header span {
    color: #f4f7f6;
    background: #27594c;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
  }

  .eyebrow {
    margin: 0 0 5px;
    color: #6d756c;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .summary {
    margin-bottom: 22px;
  }

  dl {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 1px;
    margin: 0;
    overflow: hidden;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ccd8d3;
  }

  dl div {
    min-width: 0;
    background: #ffffff;
    padding: 14px;
  }

  dt {
    color: #6d756c;
    font-size: 12px;
    font-weight: 700;
  }

  dd {
    margin: 5px 0 0;
    overflow-wrap: anywhere;
    font-size: 15px;
    font-weight: 700;
  }

  .workspace {
    display: grid;
    grid-template-columns: minmax(300px, 0.85fr) minmax(420px, 1.15fr);
    gap: 20px;
    align-items: start;
  }

  .preview-panel,
  .table-panel,
  .json-panel {
    min-width: 0;
  }

  h2 {
    margin: 0 0 10px;
    font-size: 17px;
    line-height: 1.25;
    letter-spacing: 0;
  }

  .preview {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
  }

  .axis {
    stroke: #b7c7c2;
    stroke-width: 0.35;
  }

  .preview-point circle {
    fill: #d94f45;
    stroke: #7d2a28;
    stroke-width: 0.45;
  }

  .preview-point text {
    fill: #25342e;
    font-size: 3.4px;
    font-weight: 700;
  }

  .table-scroll {
    overflow-x: auto;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
  }

  table {
    width: 100%;
    min-width: 560px;
    border-collapse: collapse;
  }

  th,
  td {
    border-bottom: 1px solid #dde6e2;
    padding: 11px 12px;
    text-align: left;
    font-size: 13px;
  }

  th {
    color: #5d675f;
    background: #edf4f1;
    font-weight: 800;
  }

  td:nth-child(3),
  td:nth-child(4),
  td:nth-child(5) {
    font-variant-numeric: tabular-nums;
  }

  tr:last-child td {
    border-bottom: 0;
  }

  .json-panel {
    margin-top: 24px;
  }

  pre {
    margin: 0;
    max-height: 480px;
    overflow: auto;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #1f2824;
    color: #f2f7f4;
    padding: 14px;
    font-size: 12px;
    line-height: 1.5;
  }

  @media (max-width: 840px) {
    main {
      width: min(100% - 24px, 680px);
      padding-top: 18px;
    }

    .app-header {
      align-items: flex-start;
      flex-direction: column;
    }

    dl,
    .workspace {
      grid-template-columns: 1fr;
    }
  }
`

document.head.append(style)
render()
