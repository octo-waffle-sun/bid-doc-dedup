<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { http } from '../../api/http'

type ReviewInfo = {
  result: string
  remark?: string
  reviewed_at: string
}

type HitItem = {
  id: string
  score: number
  ruleHits: string[]
  aBidder: string
  bBidder: string
  aPage: number
  bPage: number
  snippet: string
  review?: ReviewInfo
}

const hits = ref<HitItem[]>([])
const loading = ref(false)
const summary = ref({ high: 0, med: 0, low: 0, top_section: '-' })
const riskFilter = ref('')
const sectionFilter = ref('')
const bidderFilter = ref('')
const minScore = ref<number | null>(null)
const maxScore = ref<number | null>(null)

const route = useRoute()
const router = useRouter()
const jobId = computed(() => route.params.jobId as string)
const goCompare = (hitId: string) => {
  router.push(`/dedup/compare/${hitId}`)
}

const loadHits = async () => {
  loading.value = true
  try {
    const { data } = await http.get(`/dedup/jobs/${jobId.value}/hits`, {
      params: {
        risk: riskFilter.value || undefined,
        sectionType: sectionFilter.value || undefined,
        bidder: bidderFilter.value || undefined,
        minScore: minScore.value ?? undefined,
        maxScore: maxScore.value ?? undefined
      }
    })
    hits.value = ((data as any).items || []).map((item: any) => ({
      id: item.hit_id,
      score: item.score,
      ruleHits: item.rule_hits || [],
      aBidder: item.a.bidder,
      bBidder: item.b.bidder,
      aPage: item.a.page_hint,
      bPage: item.b.page_hint,
      snippet: item.a.snippet,
      review: item.review
    }))
  } finally {
    loading.value = false
  }
}

const loadSummary = async () => {
  const { data } = await http.get(`/dedup/jobs/${jobId.value}/summary`)
  summary.value = data
}

onMounted(loadHits)
onMounted(loadSummary)

watch([riskFilter, sectionFilter, bidderFilter, minScore, maxScore], loadHits)
</script>

<template>
  <div class="page">
    <el-card class="stat-card">
      <div class="stat-grid">
        <div class="stat-item">
          <div class="label">高风险</div>
          <div class="value">{{ summary.high }}</div>
        </div>
        <div class="stat-item">
          <div class="label">中风险</div>
          <div class="value">{{ summary.med }}</div>
        </div>
        <div class="stat-item">
          <div class="label">低风险</div>
          <div class="value">{{ summary.low }}</div>
        </div>
        <div class="stat-item">
          <div class="label">Top 章节</div>
          <div class="value">{{ summary.top_section }}</div>
        </div>
      </div>
    </el-card>

    <el-card>
      <div class="filters">
        <el-select v-model="riskFilter" placeholder="风险等级" clearable>
          <el-option label="高风险" value="HIGH" />
          <el-option label="中风险" value="MED" />
          <el-option label="低风险" value="LOW" />
        </el-select>
        <el-select v-model="sectionFilter" placeholder="章节类型" clearable>
          <el-option label="技术" value="TECH" />
          <el-option label="商务" value="BIZ" />
          <el-option label="服务" value="SERVICE" />
          <el-option label="附件" value="ATTACH" />
        </el-select>
        <el-input v-model="bidderFilter" placeholder="投标人A/B" clearable />
        <el-input-number v-model="minScore" :min="0" :max="100" placeholder="最低分" />
        <el-input-number v-model="maxScore" :min="0" :max="100" placeholder="最高分" />
      </div>
      <el-table :data="hits" style="width: 100%" v-loading="loading">
        <el-table-column prop="score" label="相似度" width="100" />
        <el-table-column prop="aBidder" label="投标人A" width="140" />
        <el-table-column prop="bBidder" label="投标人B" width="140" />
        <el-table-column label="页码" width="120">
          <template #default="{ row }">
            A{{ row.aPage }} / B{{ row.bPage }}
          </template>
        </el-table-column>
        <el-table-column prop="snippet" label="摘要" min-width="240" />
        <el-table-column label="规则命中" min-width="200">
          <template #default="{ row }">
            <el-tag v-for="tag in row.ruleHits" :key="tag" class="tag">{{ tag }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="复核状态" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.review?.result" type="success">{{ row.review.result }}</el-tag>
            <span v-else class="pending">未复核</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="goCompare(row.id)">对照查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 16px;
}

.stat-card {
  border-radius: 12px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.stat-item {
  background: #f8fafc;
  border-radius: 10px;
  padding: 12px 16px;
}

.label {
  color: #64748b;
  font-size: 12px;
}

.value {
  margin-top: 6px;
  font-size: 18px;
  font-weight: 600;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.tag {
  margin-right: 6px;
}

.pending {
  color: #94a3b8;
  font-size: 12px;
}
</style>
