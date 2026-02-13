<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { http } from '../../api/http'

type RuleItem = {
  name: string
  threshold: number
  level: string
}

const rules = ref<RuleItem[]>([])
const loading = ref(false)

const loadRules = async () => {
  loading.value = true
  try {
    const { data } = await http.get('/config/rules')
    rules.value = data
  } finally {
    loading.value = false
  }
}

onMounted(loadRules)
</script>

<template>
  <div class="page">
    <el-card class="toolbar-card">
      <div class="toolbar">
        <el-input placeholder="搜索规则" clearable />
        <el-button type="primary">新增规则</el-button>
      </div>
    </el-card>

    <el-card>
      <el-table :data="rules" style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="规则名称" min-width="200" />
        <el-table-column prop="threshold" label="阈值" width="120" />
        <el-table-column prop="level" label="风险等级" width="120">
          <template #default="{ row }">
            <el-tag :type="row.level === 'HIGH' ? 'danger' : row.level === 'MED' ? 'warning' : 'info'">
              {{ row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default>
            <el-button link type="primary">编辑</el-button>
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
