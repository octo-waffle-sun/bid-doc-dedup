<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { http } from '../../api/http'

type PairItem = {
  id: string
  docA: string
  docB: string
  score: number
  hits: number
  status: string
}

type JobInfo = {
  status: string
  parse_progress: number
  llm_progress: number
  report_progress: number
}

const pairs = ref<PairItem[]>([])
const jobInfo = ref<JobInfo | null>(null)
const loading = ref(false)
const route = useRoute()
const router = useRouter()
const jobId = computed(() => route.params.jobId as string)

const loadJob = async () => {
  loading.value = true
  try {
    const [jobRes, pairRes] = await Promise.all([
      http.get(`/dedup/jobs/${jobId.value}`),
      http.get(`/dedup/jobs/${jobId.value}/pairs`)
    ])
    jobInfo.value = {
      status: jobRes.data.status,
      parse_progress: jobRes.data.parse_progress,
      llm_progress: jobRes.data.llm_progress,
      report_progress: jobRes.data.report_progress
    }
    pairs.value = (pairRes.data as any[]).map((item) => ({
      id: item.pair_id,
      docA: item.doc_a,
      docB: item.doc_b,
      score: item.score,
      hits: item.hits,
      status: item.status
    }))
  } finally {
    loading.value = false
  }
}

const goReport = async () => {
  const { data } = await http.get(`/dedup/jobs/${jobId.value}/reports`)
  router.push(`/dedup/reports/${data.report_id}`)
}

onMounted(loadJob)
</script>

<template>
  <div class="page">
    <el-card class="summary-card">
      <div class="summary">
        <div>
          <div class="label">任务状态</div>
          <div class="value">{{ jobInfo?.status }}</div>
        </div>
        <div>
          <div class="label">解析进度</div>
          <el-progress :percentage="jobInfo?.parse_progress || 0" :stroke-width="10" />
        </div>
        <div>
          <div class="label">LLM 进度</div>
          <el-progress :percentage="jobInfo?.llm_progress || 0" :stroke-width="10" />
        </div>
        <div>
          <div class="label">报告生成</div>
          <el-progress :percentage="jobInfo?.report_progress || 0" :stroke-width="10" />
        </div>
      </div>
    </el-card>

    <el-card>
      <div class="section-title">Pair 列表</div>
      <el-table :data="pairs" style="width: 100%" v-loading="loading">
        <el-table-column prop="docA" label="投标人A" width="180" />
        <el-table-column prop="docB" label="投标人B" width="180" />
        <el-table-column prop="score" label="最高分" width="100" />
        <el-table-column prop="hits" label="命中数" width="100" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'SUCCESS' ? 'success' : 'warning'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default>
            <el-button type="primary" link @click="goReport">查看命中</el-button>
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

.summary-card {
  border-radius: 10px;
}

.summary {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: center;
}

.label {
  color: #64748b;
  font-size: 12px;
  margin-bottom: 6px;
}

.value {
  font-size: 18px;
  font-weight: 600;
}

.section-title {
  font-weight: 600;
  margin-bottom: 12px;
}
</style>
