<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { http } from '../../api/http'

type PromptItem = {
  version: string
  type: string
  updatedAt: string
  updatedBy: string
}

const prompts = ref<PromptItem[]>([])
const loading = ref(false)

const loadPrompts = async () => {
  loading.value = true
  try {
    const { data } = await http.get('/config/prompts')
    prompts.value = (data as any[]).map((item) => ({
      version: item.prompt_version,
      type: item.type,
      updatedAt: item.updated_at,
      updatedBy: item.updated_by
    }))
  } finally {
    loading.value = false
  }
}

onMounted(loadPrompts)
</script>

<template>
  <div class="page">
    <el-card class="toolbar-card">
      <div class="toolbar">
        <el-input placeholder="搜索 Prompt 版本" clearable />
        <el-button type="primary">新增 Prompt</el-button>
      </div>
    </el-card>

    <el-card>
      <el-table :data="prompts" style="width: 100%" v-loading="loading">
        <el-table-column prop="version" label="版本" width="140" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="updatedAt" label="更新时间" width="180" />
        <el-table-column prop="updatedBy" label="更新人" width="140" />
        <el-table-column label="操作" width="160">
          <template #default>
            <el-button link type="primary">编辑</el-button>
            <el-button link>查看</el-button>
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
