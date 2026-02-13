<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { http } from '../../api/http'

type AuditLogItem = {
  id: string
  provider: string
  purpose: string
  latency: number
  status: string
  createdAt: string
}

type InvokeLogItem = {
  id: string
  jobId?: string
  providerId?: string
  stage: string
  status: string
  latencyMs?: number
  error?: string
  createdAt: string
}

const auditLogs = ref<AuditLogItem[]>([])
const invokeLogs = ref<InvokeLogItem[]>([])
const keyword = ref('')
const purpose = ref('')
const stage = ref('')
const activeTab = ref('INVOKE')
const loading = ref(false)

const loadAuditLogs = async () => {
  loading.value = true
  try {
    const { data } = await http.get('/audit/logs')
    auditLogs.value = (data as any[]).map((item) => ({
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

const loadInvokeLogs = async () => {
  loading.value = true
  try {
    const { data } = await http.get('/invoke/logs')
    invokeLogs.value = (data as any[]).map((item) => ({
      id: item.id,
      jobId: item.job_id,
      providerId: item.provider_id,
      stage: item.stage,
      status: item.status,
      latencyMs: item.latency_ms,
      error: item.error,
      createdAt: item.created_at
    }))
  } finally {
    loading.value = false
  }
}

const filteredAuditLogs = computed(() => {
  const key = keyword.value.trim()
  return auditLogs.value.filter((item) => {
    if (purpose.value && item.purpose !== purpose.value) return false
    if (!key) return true
    return item.provider.includes(key) || item.id.includes(key)
  })
})

const filteredInvokeLogs = computed(() => {
  const key = keyword.value.trim()
  return invokeLogs.value.filter((item) => {
    if (stage.value && item.stage !== stage.value) return false
    if (!key) return true
    return (
      item.id.includes(key) ||
      (item.jobId ? item.jobId.includes(key) : false) ||
      (item.providerId ? item.providerId.includes(key) : false)
    )
  })
})

onMounted(loadAuditLogs)
onMounted(loadInvokeLogs)
</script>

<template>
  <div class="page">
    <el-tabs v-model="activeTab" class="tabs">
      <el-tab-pane label="调用日志" name="INVOKE">
        <el-card class="toolbar-card">
          <div class="toolbar">
            <el-input v-model="keyword" placeholder="搜索任务/Provider/日志ID" clearable />
            <el-select v-model="stage" placeholder="调用阶段" clearable>
              <el-option label="PARSE" value="PARSE" />
              <el-option label="MATCH" value="MATCH" />
              <el-option label="PIPELINE" value="PIPELINE" />
              <el-option label="RECOVERY" value="RECOVERY" />
            </el-select>
          </div>
        </el-card>

        <el-card>
          <el-table :data="filteredInvokeLogs" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="日志ID" width="180" />
            <el-table-column prop="jobId" label="任务ID" width="180" />
            <el-table-column prop="providerId" label="Provider" width="160" />
            <el-table-column prop="stage" label="阶段" width="120" />
            <el-table-column prop="latencyMs" label="耗时(ms)" width="120" />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="row.status === 'OK' ? 'success' : 'danger'">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="error" label="错误" min-width="200" />
            <el-table-column prop="createdAt" label="时间" width="180" />
          </el-table>
        </el-card>
      </el-tab-pane>
      <el-tab-pane label="审计日志" name="AUDIT">
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
          <el-table :data="filteredAuditLogs" style="width: 100%" v-loading="loading">
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
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 16px;
}

.tabs {
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
