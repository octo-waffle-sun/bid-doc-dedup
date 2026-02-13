import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'

const storageRoot = path.resolve(process.cwd(), 'storage')

export const ensureStorageRoot = () => {
  if (!fs.existsSync(storageRoot)) {
    fs.mkdirSync(storageRoot, { recursive: true })
  }
}

export const getDocStoragePath = (docId: string) => path.join(storageRoot, docId, 'original.pdf')

export const hasDocFile = (docId: string) => fs.existsSync(getDocStoragePath(docId))

export const streamDocFile = (docId: string) => fs.createReadStream(getDocStoragePath(docId))

export const ensureDocStorage = (docId: string) => {
  ensureStorageRoot()
  const dir = path.join(storageRoot, docId)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return getDocStoragePath(docId)
}

export const saveDocFile = async (docId: string, stream: NodeJS.ReadableStream) => {
  const filePath = ensureDocStorage(docId)
  await pipeline(stream, fs.createWriteStream(filePath))
  return filePath
}
