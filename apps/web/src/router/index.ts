import { createRouter, createWebHistory } from 'vue-router'
import SectionList from '../pages/section/SectionList.vue'
import SectionDetail from '../pages/section/SectionDetail.vue'
import JobList from '../pages/dedup/JobList.vue'
import JobDetail from '../pages/dedup/JobDetail.vue'
import ReportOverview from '../pages/dedup/ReportOverview.vue'
import CompareViewer from '../pages/dedup/CompareViewer.vue'
import ProviderConfig from '../pages/config/ProviderConfig.vue'
import PromptConfig from '../pages/config/PromptConfig.vue'
import RuleThresholdConfig from '../pages/config/RuleThresholdConfig.vue'
import InvokeLog from '../pages/audit/InvokeLog.vue'

const routes = [
  { path: '/', redirect: '/sections' },
  { path: '/sections', component: SectionList },
  { path: '/sections/:id', component: SectionDetail },
  { path: '/dedup/jobs', component: JobList },
  { path: '/dedup/jobs/:jobId', component: JobDetail },
  { path: '/dedup/reports/:reportId', component: ReportOverview },
  { path: '/dedup/compare/:hitId', component: CompareViewer },
  { path: '/config/providers', component: ProviderConfig, meta: { role: 'admin' } },
  { path: '/config/prompts', component: PromptConfig, meta: { role: 'admin' } },
  { path: '/config/rules', component: RuleThresholdConfig, meta: { role: 'admin' } },
  { path: '/audit/invoke-log', component: InvokeLog, meta: { role: 'admin' } }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
