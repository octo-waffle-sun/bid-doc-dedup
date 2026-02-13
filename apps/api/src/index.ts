import Fastify from 'fastify'
import cors from '@fastify/cors'
import { ensureSeedData } from './db.js'
import { registerAuditRoutes } from './routes/audit.js'
import { registerConfigRoutes } from './routes/config.js'
import { registerFileRoutes } from './routes/files.js'
import { registerJobRoutes } from './routes/jobs.js'
import { registerSectionRoutes } from './routes/sections.js'

const app = Fastify({ logger: true })

await app.register(cors, { origin: true })

app.get('/api/health', async () => ({ status: 'ok' }))

await ensureSeedData()
await registerSectionRoutes(app)
await registerFileRoutes(app)
await registerJobRoutes(app)
await registerConfigRoutes(app)
await registerAuditRoutes(app)

const port = Number(process.env.PORT ?? 5175)
await app.listen({ port, host: '0.0.0.0' })
