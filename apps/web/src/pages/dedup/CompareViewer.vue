<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import PdfViewer from '../../components/Pdf/PdfViewer.vue'
import { http } from '../../api/http'

type AnchorSide = {
  page: number
  bbox_list: { x: number; y: number; w: number; h: number }[]
  snippet?: string
}

type AnchorPair = {
  a: AnchorSide
  b: AnchorSide
}

type AnchorResponse = {
  hit_id: string
  a_preview_url: string
  b_preview_url: string
  rule_hits: string[]
  anchors: AnchorPair[]
  explanation: string
  score: number
  rewrite_risk: string
}

const route = useRoute()
const hitId = computed(() => route.params.hitId as string)

const anchors = ref<AnchorPair[]>([])
const currentIndex = ref(0)
const leftUrl = ref('')
const rightUrl = ref('')
const explanation = ref('')
const score = ref(0)
const rewriteRisk = ref('UNKNOWN')
const ruleHits = ref<string[]>([])
const remark = ref('')
const reviewStatus = ref('')
const submitting = ref(false)

const current = computed(() => anchors.value[currentIndex.value])

const goPrev = () => {
  if (currentIndex.value > 0) currentIndex.value -= 1
}

const goNext = () => {
  if (currentIndex.value < anchors.value.length - 1) currentIndex.value += 1
}

const loadAnchors = async () => {
  const { data } = await http.get<AnchorResponse>(`/dedup/hits/${hitId.value}/anchors`)
  anchors.value = data.anchors
  leftUrl.value = data.a_preview_url
  rightUrl.value = data.b_preview_url
  explanation.value = data.explanation
  score.value = data.score
  rewriteRisk.value = data.rewrite_risk
  ruleHits.value = data.rule_hits || []
  currentIndex.value = 0
}

const submitReview = async (result: 'CONFIRMED' | 'FALSE_POSITIVE' | 'PENDING') => {
  submitting.value = true
  reviewStatus.value = ''
  try {
    const { data } = await http.post(`/dedup/hits/${hitId.value}/review`, {
      result,
      remark: remark.value || undefined
    })
    reviewStatus.value = `已保存：${data.review.result}`
  } finally {
    submitting.value = false
  }
}

onMounted(loadAnchors)
</script>

<template>
  <div class="page">
    <el-card class="toolbar-card">
      <div class="toolbar">
        <div class="nav">
          <el-button @click="goPrev">上一处</el-button>
          <el-button type="primary" @click="goNext">下一处</el-button>
          <span class="nav-text">当前：{{ currentIndex + 1 }} / {{ anchors.length }}</span>
        </div>
        <el-switch active-text="同步跳页" inactive-text="独立查看" />
      </div>
    </el-card>

    <div class="viewer-grid">
      <el-card class="viewer">
        <div class="viewer-title">文档 A（第 {{ current?.a.page }} 页）</div>
        <PdfViewer
          :url="leftUrl"
          :page="current?.a.page || 1"
          :highlights="current?.a.bbox_list || []"
        />
      </el-card>
      <el-card class="viewer">
        <div class="viewer-title">文档 B（第 {{ current?.b.page }} 页）</div>
        <PdfViewer
          :url="rightUrl"
          :page="current?.b.page || 1"
          :highlights="current?.b.bbox_list || []"
        />
      </el-card>
      <el-card class="evidence">
        <div class="evidence-title">证据卡</div>
        <div class="evidence-item">
          <span class="label">相似度</span>
          <span class="value">{{ score }}</span>
        </div>
        <div class="evidence-item">
          <span class="label">改写风险</span>
          <el-tag type="danger">{{ rewriteRisk }}</el-tag>
        </div>
        <div class="evidence-item">
          <span class="label">命中规则</span>
          <div class="tags">
            <el-tag v-for="tag in ruleHits" :key="tag">{{ tag }}</el-tag>
          </div>
        </div>
        <div class="evidence-item">
          <span class="label">A 命中片段</span>
          <div class="snippet">{{ current?.a.snippet }}</div>
        </div>
        <div class="evidence-item">
          <span class="label">B 命中片段</span>
          <div class="snippet">{{ current?.b.snippet }}</div>
        </div>
        <div class="evidence-item">
          <span class="label">LLM 解释</span>
          <div class="snippet">{{ explanation }}</div>
        </div>
        <div class="evidence-item">
          <span class="label">复核备注</span>
          <el-input v-model="remark" type="textarea" :rows="3" placeholder="填写复核备注" />
        </div>
        <div class="evidence-actions">
          <el-button type="primary" :loading="submitting" @click="submitReview('CONFIRMED')">
            确认疑似
          </el-button>
          <el-button :loading="submitting" @click="submitReview('FALSE_POSITIVE')">误报</el-button>
          <el-button :loading="submitting" @click="submitReview('PENDING')">待定</el-button>
        </div>
        <div v-if="reviewStatus" class="review-status">{{ reviewStatus }}</div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 16px;
}

.toolbar-card {
  border-radius: 10px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-text {
  color: #64748b;
  font-size: 12px;
}

.viewer-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) 320px;
  gap: 16px;
}

.viewer {
  min-height: 480px;
}

.viewer-title {
  font-weight: 600;
  margin-bottom: 12px;
}


.evidence-title {
  font-weight: 600;
  margin-bottom: 12px;
}

.evidence-item {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}

.label {
  font-size: 12px;
  color: #64748b;
}

.value {
  font-size: 18px;
  font-weight: 600;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.snippet {
  background: #f8fafc;
  border-radius: 8px;
  padding: 8px;
  font-size: 13px;
  color: #334155;
}

.evidence-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.review-status {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
}
</style>
