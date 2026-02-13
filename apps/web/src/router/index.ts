import { createRouter, createWebHistory } from 'vue-router'
const routes = [
  { path: '/', redirect: '/sections' },
  { path: '/sections', component: () => import('../pages/section/SectionList.vue') },
  { path: '/sections/:id', component: () => import('../pages/section/SectionDetail.vue') },
  { path: '/dedup/jobs', component: () => import('../pages/dedup/JobList.vue') },
  { path: '/dedup/jobs/:jobId', component: () => import('../pages/dedup/JobDetail.vue') },
  { path: '/dedup/reports/:reportId', component: () => import('../pages/dedup/ReportOverview.vue') },
  { path: '/dedup/compare/:hitId', component: () => import('../pages/dedup/CompareViewer.vue') },
  { path: '/config/providers', component: () => import('../pages/config/ProviderConfig.vue'), meta: { role: 'admin' } },
  { path: '/config/prompts', component: () => import('../pages/config/PromptConfig.vue'), meta: { role: 'admin' } },
  { path: '/config/rules', component: () => import('../pages/config/RuleThresholdConfig.vue'), meta: { role: 'admin' } },
  { path: '/audit/invoke-log', component: () => import('../pages/audit/InvokeLog.vue'), meta: { role: 'admin' } }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
