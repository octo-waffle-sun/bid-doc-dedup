import fs from 'node:fs'
import path from 'node:path'

const storageRoot = path.resolve(process.cwd(), 'storage')

export const ensureStorageRoot = () => {
  if (!fs.existsSync(storageRoot)) {
    fs.mkdirSync(storageRoot, { recursive: true })
  }
}

export const getDocStoragePath = (docId: string) => path.join(storageRoot, docId, 'original.pdf')

export const hasDocFile = (docId: string) => fs.existsSync(getDocStoragePath(docId))

export const streamDocFile = (docId: string) => fs.createReadStream(getDocStoragePath(docId))
