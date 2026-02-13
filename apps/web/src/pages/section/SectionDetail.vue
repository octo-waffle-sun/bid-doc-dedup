<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { http } from '../../api/http'

type DocItem = {
  id: string
  bidder: string
  filename: string
  fileType: string
  scanned: boolean
  status: string
  uploadedAt: string
}

type SectionInfo = {
  section_id: string
  name: string
  code: string
  opened_at: string
  doc_count: number
}

const docs = ref<DocItem[]>([])
const section = ref<SectionInfo | null>(null)
const loading = ref(false)
const submitting = ref(false)
const jobStatus = ref('')
const route = useRoute()
const router = useRouter()
const sectionId = computed(() => route.params.id as string)

const loadSection = async () => {
  loading.value = true
  try {
    const [sectionRes, docsRes] = await Promise.all([
      http.get(`/sections/${sectionId.value}`),
      http.get(`/sections/${sectionId.value}/docs`)
    ])
    section.value = sectionRes.data
    docs.value = (docsRes.data as any[]).map((item) => ({
      id: item.doc_id,
      bidder: item.bidder,
      filename: item.filename,
      fileType: item.file_type,
      scanned: item.scanned,
      status: item.status,
      uploadedAt: item.uploaded_at
    }))
  } finally {
    loading.value = false
  }
}

const startDedup = async () => {
  submitting.value = true
  jobStatus.value = ''
  try {
    const { data } = await http.post('/dedup/jobs', {
      section_id: sectionId.value,
      doc_ids: docs.value.map((item) => item.id),
      mode: 'STANDARD',
      prompt_version: 'v1.0',
      options: { ocr: 'AUTO' }
    })
    jobStatus.value = `已创建任务：${data.job_id}`
    router.push(`/dedup/jobs/${data.job_id}`)
  } finally {
    submitting.value = false
  }
}

onMounted(loadSection)
</script>

<template>
  <div class="page">
    <el-card>
      <div class="summary">
        <div>
          <div class="label">标段编号</div>
          <div class="value">{{ section?.code }}</div>
        </div>
        <div>
          <div class="label">标段名称</div>
          <div class="value">{{ section?.name }}</div>
        </div>
        <div>
          <div class="label">开标时间</div>
          <div class="value">{{ section?.opened_at }}</div>
        </div>
        <div>
          <div class="label">文件数量</div>
          <div class="value">{{ section?.doc_count }}</div>
        </div>
      </div>
    </el-card>

    <el-card>
      <div class="actions">
        <el-button type="primary" :loading="submitting" @click="startDedup">发起查重</el-button>
        <el-button>上传投标文件</el-button>
      </div>
      <div v-if="jobStatus" class="job-status">{{ jobStatus }}</div>
      <el-table :data="docs" style="width: 100%" v-loading="loading">
        <el-table-column prop="bidder" label="投标人" width="180" />
        <el-table-column prop="filename" label="文件名" min-width="220" />
        <el-table-column prop="fileType" label="类型" width="90" />
        <el-table-column prop="scanned" label="扫描件" width="90">
          <template #default="{ row }">
            <el-tag :type="row.scanned ? 'warning' : 'success'">
              {{ row.scanned ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="解析状态" width="120" />
        <el-table-column prop="uploadedAt" label="上传时间" width="180" />
        <el-table-column label="操作" width="140">
          <template #default>
            <el-button link type="primary">预览</el-button>
            <el-button link>替换</el-button>
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

.summary {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.label {
  color: #64748b;
  font-size: 12px;
}

.value {
  font-size: 16px;
  font-weight: 600;
  margin-top: 6px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 12px;
}

.job-status {
  color: #64748b;
  font-size: 12px;
  margin-bottom: 10px;
}
</style>
