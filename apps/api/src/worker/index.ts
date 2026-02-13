import { prisma } from '../db.js'
import { createInvokeLog } from '../repositories/audit.js'
import { failJob } from '../repositories/jobs.js'
import { runJobPipeline } from './pipeline.js'

const now = () => new Date().toISOString()

const recoverStuckJobs = async () => {
  const jobs = await prisma.job.findMany({ where: { status: 'RUNNING' } })
  const cutoff = Date.now() - 30 * 60 * 1000
  for (const job of jobs) {
    if (!job.startedAt) continue
    const startedAt = Date.parse(job.startedAt)
    if (!Number.isNaN(startedAt) && startedAt < cutoff) {
      await failJob(job.id, 'JOB_TIMEOUT')
      await createInvokeLog({ jobId: job.id, stage: 'RECOVERY', status: 'ERROR', error: 'JOB_TIMEOUT' })
    }
  }
}

const tick = async () => {
  await recoverStuckJobs()
  const job = await prisma.job.findFirst({ where: { status: 'QUEUED' } })
  if (!job) return
  const locked = await prisma.job.updateMany({
    where: { id: job.id, status: 'QUEUED' },
    data: { status: 'RUNNING', stage: 'LOCKED', progress: 1, startedAt: now() }
  })
  if (locked.count === 0) return
  try {
    await runJobPipeline(job.id)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    await failJob(job.id, message)
    await createInvokeLog({ jobId: job.id, stage: 'PIPELINE', status: 'ERROR', error: message })
  }
}

const loop = async () => {
  await tick()
  setTimeout(loop, 3000)
}

await loop()
