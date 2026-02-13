<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { http } from '../../api/http'

type LogItem = {
  id: string
  provider: string
  purpose: string
  latency: number
  status: string
  createdAt: string
}

const logs = ref<LogItem[]>([])
const keyword = ref('')
const purpose = ref('')
const loading = ref(false)

const loadLogs = async () => {
  loading.value = true
  try {
    const { data } = await http.get('/audit/invoke-logs')
    logs.value = (data as any[]).map((item) => ({
      id: item.id,
      provider: item.provider,
      purpose: item.purpose,
      latency: item.latency,
      status: item.status,
      createdAt: item.created_at
    }))
  } finally {
    loading.value = false
  }
}

const filteredLogs = computed(() => {
  const key = keyword.value.trim()
  return logs.value.filter((item) => {
    if (purpose.value && item.purpose !== purpose.value) return false
    if (!key) return true
    return item.provider.includes(key) || item.id.includes(key)
  })
})

onMounted(loadLogs)
</script>

<template>
  <div class="page">
    <el-card class="toolbar-card">
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="搜索任务或Provider" clearable />
        <el-select v-model="purpose" placeholder="调用目的" clearable>
          <el-option label="ALIGN" value="ALIGN" />
          <el-option label="COMPARE" value="COMPARE" />
          <el-option label="OCR" value="OCR" />
        </el-select>
      </div>
    </el-card>

    <el-card>
      <el-table :data="filteredLogs" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="日志ID" width="160" />
        <el-table-column prop="provider" label="Provider" width="160" />
        <el-table-column prop="purpose" label="目的" width="120" />
        <el-table-column prop="latency" label="耗时(ms)" width="120" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'OK' ? 'success' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" width="180" />
        <el-table-column label="操作" width="120">
          <template #default>
            <el-button link type="primary">详情</el-button>
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
  justify-content: space-between;
  gap: 12px;
}
</style>
