import { prisma } from '../db.js'
import { runJobPipeline } from './pipeline.js'

const tick = async () => {
  const job = await prisma.job.findFirst({ where: { status: 'QUEUED' } })
  if (!job) return
  const locked = await prisma.job.updateMany({
    where: { id: job.id, status: 'QUEUED' },
    data: { status: 'RUNNING', stage: 'LOCKED', progress: 1 }
  })
  if (locked.count === 0) return
  await runJobPipeline(job.id)
}

const loop = async () => {
  await tick()
  setTimeout(loop, 3000)
}

await loop()
