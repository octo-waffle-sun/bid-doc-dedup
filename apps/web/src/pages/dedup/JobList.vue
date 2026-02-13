<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { http } from '../../api/http'

type JobItem = {
  id: string
  section: string
  status: string
  progress: number
  createdBy: string
  createdAt: string
}

const jobs = ref<JobItem[]>([])
const keyword = ref('')
const loading = ref(false)

const router = useRouter()

const goDetail = (jobId: string) => {
  router.push(`/dedup/jobs/${jobId}`)
}

const goReport = () => {
  router.push('/dedup/reports/report-001')
}

const loadJobs = async () => {
  loading.value = true
  try {
    const { data } = await http.get('/dedup/jobs')
    jobs.value = (data as any[]).map((item) => ({
      id: item.job_id,
      section: item.section_name,
      status: item.status,
      progress: item.progress,
      createdBy: item.created_by,
      createdAt: item.created_at
    }))
  } finally {
    loading.value = false
  }
}

const filteredJobs = computed(() => {
  const value = keyword.value.trim()
  if (!value) return jobs.value
  return jobs.value.filter((item) => item.section.includes(value) || item.id.includes(value))
})

onMounted(loadJobs)
</script>

<template>
  <div class="page">
    <el-card class="toolbar-card">
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="搜索标段/任务ID" clearable />
        <el-button>导出任务清单</el-button>
      </div>
    </el-card>

    <el-card>
      <el-table :data="filteredJobs" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="任务ID" width="160" />
        <el-table-column prop="section" label="标段" min-width="200" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'SUCCESS' ? 'success' : 'warning'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="160">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :stroke-width="8" />
          </template>
        </el-table-column>
        <el-table-column prop="createdBy" label="发起人" width="140" />
        <el-table-column prop="createdAt" label="发起时间" width="180" />
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row.id)">查看详情</el-button>
            <el-button link @click="goReport">报告</el-button>
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

.toolbar-card {
  border-radius: 10px;
}

.toolbar {
  display: flex;
  gap: 12px;
  justify-content: space-between;
}
</style>
