<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activePath = computed(() => route.path)

const menuItems = [
  { label: '标段列表', path: '/sections' },
  { label: '任务中心', path: '/dedup/jobs' },
  { label: '报告概览', path: '/dedup/jobs' },
  { label: '模型配置', path: '/config/providers' },
  { label: '日志中心', path: '/audit/invoke-log' }
]

const onSelect = (index: string) => {
  router.push(index)
}
</script>

<template>
  <el-container class="app-shell">
    <el-aside width="220px" class="app-aside">
      <div class="brand">投标文件查重系统</div>
      <el-menu :default-active="activePath" class="menu" @select="onSelect">
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          {{ item.label }}
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="app-header">
        <div class="header-left">当前页面：{{ route.path }}</div>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>
