<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { http } from '../../api/http'

type SectionItem = {
  id: string
  name: string
  code: string
  bidderCount: number
  openedAt: string
}

const sections = ref<SectionItem[]>([])
const keyword = ref('')
const loading = ref(false)

const router = useRouter()
const goDetail = (id: string) => {
  router.push(`/sections/${id}`)
}

const loadSections = async () => {
  loading.value = true
  try {
    const { data } = await http.get('/sections')
    sections.value = (data as any[]).map((item) => ({
      id: item.section_id,
      name: item.name,
      code: item.code,
      bidderCount: item.bidder_count,
      openedAt: item.opened_at
    }))
  } finally {
    loading.value = false
  }
}

const filteredSections = computed(() => {
  const value = keyword.value.trim()
  if (!value) return sections.value
  return sections.value.filter(
    (item) => item.name.includes(value) || item.code.includes(value)
  )
})

onMounted(loadSections)
</script>

<template>
  <div class="page">
    <el-card class="toolbar-card">
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="搜索标段名称/编号" clearable />
        <el-button type="primary">新增标段</el-button>
      </div>
    </el-card>

    <el-card>
      <el-table :data="filteredSections" style="width: 100%" v-loading="loading">
        <el-table-column prop="code" label="标段编号" width="160" />
        <el-table-column prop="name" label="标段名称" min-width="200" />
        <el-table-column prop="bidderCount" label="投标文件数" width="120" />
        <el-table-column prop="openedAt" label="开标时间" width="180" />
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button type="primary" link @click="goDetail(row.id)">进入</el-button>
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
