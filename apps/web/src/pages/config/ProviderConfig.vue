<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { http } from '../../api/http'

type ProviderItem = {
  id: string
  name: string
  type: string
  model: string
  qps: number
  enabled: boolean
}

const providers = ref<ProviderItem[]>([])
const loading = ref(false)

const loadProviders = async () => {
  loading.value = true
  try {
    const { data } = await http.get('/config/llm-providers')
    providers.value = (data as any[]).map((item) => ({
      id: item.provider_id,
      name: item.name,
      type: item.type,
      model: item.model,
      qps: item.qps,
      enabled: item.enabled
    }))
  } finally {
    loading.value = false
  }
}

onMounted(loadProviders)
</script>

<template>
  <div class="page">
    <el-card class="toolbar-card">
      <div class="toolbar">
        <el-input placeholder="搜索 Provider" clearable />
        <el-button type="primary">新增 Provider</el-button>
      </div>
    </el-card>

    <el-card>
      <el-table :data="providers" style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="model" label="模型" min-width="200" />
        <el-table-column prop="qps" label="QPS" width="100" />
        <el-table-column prop="enabled" label="启用" width="100">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? '启用' : '关闭' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default>
            <el-button link type="primary">编辑</el-button>
            <el-button link>测试</el-button>
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
