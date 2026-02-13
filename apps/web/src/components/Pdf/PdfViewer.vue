<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

type HighlightRect = {
  left: number
  top: number
  width: number
  height: number
}

type Props = {
  url: string
  page: number
  highlights: number[][]
}

const props = defineProps<Props>()

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const pdfDoc = ref<PDFDocumentProxy | null>(null)
const rendering = ref(false)
const highlightRects = ref<HighlightRect[]>([])
const highlightRectsList = computed<HighlightRect[]>(() => highlightRects.value)

const safePage = computed(() => Math.max(1, props.page || 1))

const loadPdf = async () => {
  if (!props.url) {
    pdfDoc.value = null
    highlightRects.value = []
    return
  }
  const task = getDocument(props.url)
  pdfDoc.value = await task.promise
}

const renderPage = async () => {
  if (!pdfDoc.value || !canvasRef.value || !containerRef.value || rendering.value) {
    return
  }
  rendering.value = true
  const page: PDFPageProxy = await pdfDoc.value.getPage(safePage.value)
  const initialViewport = page.getViewport({ scale: 1 })
  const containerWidth = containerRef.value.clientWidth || initialViewport.width
  const scale = containerWidth / initialViewport.width
  const viewport = page.getViewport({ scale })
  const canvas = canvasRef.value
  const context = canvas.getContext('2d')
  if (!context) {
    rendering.value = false
    return
  }
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  await (page.render({ canvasContext: context, viewport } as any) as any).promise
  const w = viewport.width
  const h = viewport.height
  const items = (props.highlights || []).filter(
    (item) =>
      Array.isArray(item) &&
      item.length === 4 &&
      item.every((value) => typeof value === 'number')
  ) as number[][]
  highlightRects.value = items.map((item) => ({
    left: item[0]! * w,
    top: item[1]! * h,
    width: (item[2]! - item[0]!) * w,
    height: (item[3]! - item[1]!) * h
  }))
  rendering.value = false
}

watch(
  () => props.url,
  async () => {
    await loadPdf()
    await nextTick()
    await renderPage()
  },
  { immediate: true }
)

watch(
  () => [safePage.value, props.highlights],
  async () => {
    await nextTick()
    await renderPage()
  }
)

const resizeObserver = new ResizeObserver(async () => {
  await nextTick()
  await renderPage()
})

onMounted(() => {
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver.disconnect()
})
</script>

<template>
  <div ref="containerRef" class="pdf-viewer">
    <canvas ref="canvasRef" class="pdf-canvas"></canvas>
    <div class="overlay-layer">
      <div
        v-for="(rect, index) in highlightRectsList"
        :key="index"
        class="highlight-rect"
        :style="{
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`
        }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.pdf-viewer {
  position: relative;
  width: 100%;
}

.pdf-canvas {
  width: 100%;
  display: block;
}

.overlay-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.highlight-rect {
  position: absolute;
  border: 2px solid #f97316;
  background: rgba(249, 115, 22, 0.18);
  border-radius: 6px;
}
</style>
