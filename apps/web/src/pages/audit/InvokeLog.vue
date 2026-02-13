<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
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
  tokens?: number
  error?: string
  requestMetaJson?: unknown
  responseMetaJson?: unknown
  createdAt: string
}

const auditLogs = ref<AuditLogItem[]>([])
const invokeLogs = ref<InvokeLogItem[]>([])
const auditTotal = ref(0)
const invokeTotal = ref(0)
const activeTab = ref('INVOKE')
const auditLoading = ref(false)
const invokeLoading = ref(false)
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailType = ref<'AUDIT' | 'INVOKE'>('AUDIT')
const auditDetail = ref<AuditLogItem | null>(null)
const invokeDetail = ref<InvokeLogItem | null>(null)

const auditFilters = ref({
  keyword: '',
  purpose: '',
  status: '',
  page: 1,
  pageSize: 20
})

const invokeFilters = ref({
  keyword: '',
  stage: '',
  status: '',
  page: 1,
  pageSize: 20
})

const detailTitle = computed(() => (detailType.value === 'AUDIT' ? '审计日志详情' : '调用日志详情'))
const invokeRequestMeta = computed(() =>
  invokeDetail.value?.requestMetaJson ? JSON.stringify(invokeDetail.value.requestMetaJson, null, 2) : ''
)
const invokeResponseMeta = computed(() =>
  invokeDetail.value?.responseMetaJson ? JSON.stringify(invokeDetail.value.responseMetaJson, null, 2) : ''
)

const mapAuditLog = (item: any): AuditLogItem => ({
  id: item.id,
  provider: item.provider,
  purpose: item.purpose,
  latency: item.latency,
  status: item.status,
  createdAt: item.created_at
})

const mapInvokeLog = (item: any): InvokeLogItem => ({
  id: item.id,
  jobId: item.job_id,
  providerId: item.provider_id,
  stage: item.stage,
  status: item.status,
  latencyMs: item.latency_ms,
  tokens: item.tokens,
  error: item.error,
  requestMetaJson: item.request_meta_json,
  responseMetaJson: item.response_meta_json,
  createdAt: item.created_at
})

const loadAuditLogs = async () => {
  auditLoading.value = true
  try {
    const { data } = await http.get('/audit/logs', {
      params: {
        purpose: auditFilters.value.purpose || undefined,
        status: auditFilters.value.status || undefined,
        q: auditFilters.value.keyword || undefined,
        page: auditFilters.value.page,
        page_size: auditFilters.value.pageSize
      }
    })
    auditLogs.value = (data.items ?? []).map(mapAuditLog)
    auditTotal.value = data.total ?? 0
    auditFilters.value.page = data.page ?? auditFilters.value.page
    auditFilters.value.pageSize = data.page_size ?? auditFilters.value.pageSize
  } finally {
    auditLoading.value = false
  }
}

const loadInvokeLogs = async () => {
  invokeLoading.value = true
  try {
    const { data } = await http.get('/invoke/logs', {
      params: {
        stage: invokeFilters.value.stage || undefined,
        status: invokeFilters.value.status || undefined,
        q: invokeFilters.value.keyword || undefined,
        page: invokeFilters.value.page,
        page_size: invokeFilters.value.pageSize
      }
    })
    invokeLogs.value = (data.items ?? []).map(mapInvokeLog)
    invokeTotal.value = data.total ?? 0
    invokeFilters.value.page = data.page ?? invokeFilters.value.page
    invokeFilters.value.pageSize = data.page_size ?? invokeFilters.value.pageSize
  } finally {
    invokeLoading.value = false
  }
}

const openAuditDetail = async (logId: string) => {
  detailLoading.value = true
  detailType.value = 'AUDIT'
  try {
    const { data } = await http.get(`/audit/logs/${logId}`)
    auditDetail.value = mapAuditLog(data)
    invokeDetail.value = null
    detailVisible.value = true
  } finally {
    detailLoading.value = false
  }
}

const openInvokeDetail = async (logId: string) => {
  detailLoading.value = true
  detailType.value = 'INVOKE'
  try {
    const { data } = await http.get(`/invoke/logs/${logId}`)
    invokeDetail.value = mapInvokeLog(data)
    auditDetail.value = null
    detailVisible.value = true
  } finally {
    detailLoading.value = false
  }
}

watch(
  () => [auditFilters.value.keyword, auditFilters.value.purpose, auditFilters.value.status],
  () => {
    auditFilters.value.page = 1
    loadAuditLogs()
  }
)

watch(
  () => [invokeFilters.value.keyword, invokeFilters.value.stage, invokeFilters.value.status],
  () => {
    invokeFilters.value.page = 1
    loadInvokeLogs()
  }
)

watch(
  () => [auditFilters.value.page, auditFilters.value.pageSize],
  () => {
    loadAuditLogs()
  }
)

watch(
  () => [invokeFilters.value.page, invokeFilters.value.pageSize],
  () => {
    loadInvokeLogs()
  }
)

onMounted(loadAuditLogs)
onMounted(loadInvokeLogs)
</script>

<template>
  <div class="page">
    <el-tabs v-model="activeTab" class="tabs">
      <el-tab-pane label="调用日志" name="INVOKE">
        <el-card class="toolbar-card">
          <div class="toolbar">
            <el-input v-model="invokeFilters.keyword" placeholder="搜索任务/Provider/日志ID" clearable />
            <el-select v-model="invokeFilters.stage" placeholder="调用阶段" clearable>
              <el-option label="PARSE" value="PARSE" />
              <el-option label="MATCH" value="MATCH" />
              <el-option label="PIPELINE" value="PIPELINE" />
              <el-option label="RECOVERY" value="RECOVERY" />
            </el-select>
            <el-select v-model="invokeFilters.status" placeholder="状态" clearable>
              <el-option label="OK" value="OK" />
              <el-option label="ERROR" value="ERROR" />
            </el-select>
          </div>
        </el-card>

        <el-card>
          <el-table :data="invokeLogs" style="width: 100%" v-loading="invokeLoading">
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
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button link type="primary" @click="openInvokeDetail(row.id)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination">
            <el-pagination
              v-model:current-page="invokeFilters.page"
              v-model:page-size="invokeFilters.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next"
              :total="invokeTotal"
            />
          </div>
        </el-card>
      </el-tab-pane>
      <el-tab-pane label="审计日志" name="AUDIT">
        <el-card class="toolbar-card">
          <div class="toolbar">
            <el-input v-model="auditFilters.keyword" placeholder="搜索任务或Provider" clearable />
            <el-select v-model="auditFilters.purpose" placeholder="调用目的" clearable>
              <el-option label="ALIGN" value="ALIGN" />
              <el-option label="COMPARE" value="COMPARE" />
              <el-option label="OCR" value="OCR" />
            </el-select>
            <el-select v-model="auditFilters.status" placeholder="状态" clearable>
              <el-option label="OK" value="OK" />
              <el-option label="ERROR" value="ERROR" />
            </el-select>
          </div>
        </el-card>

        <el-card>
          <el-table :data="auditLogs" style="width: 100%" v-loading="auditLoading">
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
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button link type="primary" @click="openAuditDetail(row.id)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination">
            <el-pagination
              v-model:current-page="auditFilters.page"
              v-model:page-size="auditFilters.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next"
              :total="auditTotal"
            />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>
    <el-drawer v-model="detailVisible" :title="detailTitle" size="40%">
      <div v-if="detailType === 'AUDIT'">
        <el-card v-loading="detailLoading">
          <div class="detail-grid" v-if="auditDetail">
            <div class="detail-item">
              <div class="detail-label">日志ID</div>
              <div class="detail-value">{{ auditDetail.id }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Provider</div>
              <div class="detail-value">{{ auditDetail.provider }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">目的</div>
              <div class="detail-value">{{ auditDetail.purpose }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">状态</div>
              <div class="detail-value">{{ auditDetail.status }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">耗时(ms)</div>
              <div class="detail-value">{{ auditDetail.latency }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">时间</div>
              <div class="detail-value">{{ auditDetail.createdAt }}</div>
            </div>
          </div>
        </el-card>
      </div>
      <div v-else>
        <el-card v-loading="detailLoading">
          <div class="detail-grid" v-if="invokeDetail">
            <div class="detail-item">
              <div class="detail-label">日志ID</div>
              <div class="detail-value">{{ invokeDetail.id }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">任务ID</div>
              <div class="detail-value">{{ invokeDetail.jobId || '-' }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Provider</div>
              <div class="detail-value">{{ invokeDetail.providerId || '-' }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">阶段</div>
              <div class="detail-value">{{ invokeDetail.stage }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">状态</div>
              <div class="detail-value">{{ invokeDetail.status }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">耗时(ms)</div>
              <div class="detail-value">{{ invokeDetail.latencyMs ?? '-' }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Token</div>
              <div class="detail-value">{{ invokeDetail.tokens ?? '-' }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">错误</div>
              <div class="detail-value">{{ invokeDetail.error || '-' }}</div>
            </div>
            <div class="detail-item detail-full" v-if="invokeRequestMeta">
              <div class="detail-label">请求元信息</div>
              <pre class="detail-json">{{ invokeRequestMeta }}</pre>
            </div>
            <div class="detail-item detail-full" v-if="invokeResponseMeta">
              <div class="detail-label">响应元信息</div>
              <pre class="detail-json">{{ invokeResponseMeta }}</pre>
            </div>
            <div class="detail-item detail-full">
              <div class="detail-label">时间</div>
              <div class="detail-value">{{ invokeDetail.createdAt }}</div>
            </div>
          </div>
        </el-card>
      </div>
    </el-drawer>
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

.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-item {
  display: grid;
  gap: 6px;
}

.detail-full {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 12px;
  color: #909399;
}

.detail-value {
  font-size: 14px;
  color: #303133;
  word-break: break-all;
}

.detail-json {
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  background: #f5f7fa;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
