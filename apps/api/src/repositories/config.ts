import crypto from 'node:crypto'
import { prisma } from '../db.js'

const secret = process.env.PROVIDER_SECRET ?? 'dev-secret'

const encrypt = (value: string) => {
  const iv = crypto.randomBytes(16)
  const key = crypto.createHash('sha256').update(secret).digest()
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export const listProviders = async () => {
  const providers: {
    id: string
    type: string
    name: string
    model: string
    qps: number
    enabled: boolean
    baseUrl: string | null
  }[] = await prisma.provider.findMany()
  return providers.map((provider) => ({
    provider_id: provider.id,
    type: provider.type,
    name: provider.name,
    model: provider.model,
    qps: provider.qps,
    enabled: provider.enabled,
    base_url: provider.baseUrl ?? undefined
  }))
}

export const createProvider = async (payload: {
  type: string
  name: string
  model?: string
  qps?: number
  enabled?: boolean
  baseUrl?: string
  apiKey?: string
}) => {
  const record = await prisma.provider.create({
    data: {
      id: `provider-${Date.now()}`,
      type: payload.type,
      name: payload.name,
      model: payload.model ?? '',
      qps: payload.qps ?? 1,
      enabled: payload.enabled ?? true,
      baseUrl: payload.baseUrl ?? null,
      apiKeyEncrypted: payload.apiKey ? encrypt(payload.apiKey) : null,
      createdAt: new Date().toISOString()
    }
  })
  return record
}

export const listPrompts = async () => {
  const prompts: {
    id: string
    type: string
    promptVersion: string
    content: string | null
    updatedAt: string
    updatedBy: string
  }[] = await prisma.prompt.findMany()
  return prompts.map((prompt) => ({
    prompt_version: prompt.promptVersion,
    type: prompt.type,
    updated_at: prompt.updatedAt,
    updated_by: prompt.updatedBy,
    content: prompt.content ?? undefined
  }))
}

export const createPrompt = async (payload: { promptVersion: string; type: string; content?: string }) => {
  const record = await prisma.prompt.create({
    data: {
      id: `prompt-${Date.now()}`,
      promptVersion: payload.promptVersion,
      type: payload.type,
      content: payload.content ?? null,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin'
    }
  })
  return record
}

export const listRules = async () => {
  const rules: { id: string; name: string; threshold: number; level: string; enabled: boolean }[] =
    await prisma.rule.findMany()
  return rules.map((rule) => ({
    name: rule.name,
    threshold: rule.threshold,
    level: rule.level,
    enabled: rule.enabled
  }))
}
