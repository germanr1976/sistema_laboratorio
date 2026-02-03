// Minimal IndexedDB helper for storing PDFs and study metadata
// Uses a single database 'labmanager' with objectStore 'pdfs'
interface StoredPdf {
    id: string
    blob: ArrayBuffer
    name: string
    size: number
    type: string
}

export async function openDb() {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('labmanager', 1)
        request.onupgradeneeded = () => {
            const db = request.result
            if (!db.objectStoreNames.contains('pdfs')) {
                db.createObjectStore('pdfs', { keyPath: 'id' })
            }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

export async function savePdf(id: string, file: File) {
    // Read the file fully first (this avoids keeping an IndexedDB transaction open
    // across an async FileReader callback which can cause TransactionInactiveError)
    const buffer = await file.arrayBuffer()
    const db = await openDb()
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction('pdfs', 'readwrite')
        const store = tx.objectStore('pdfs')
        const data: StoredPdf = {
            id,
            blob: buffer,
            name: file.name,
            size: file.size,
            type: file.type,
        }
        const req = store.put(data)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
    })
}

export async function getPdf(id: string) {
    const db = await openDb()
    return new Promise<Blob | null>((resolve, reject) => {
        const tx = db.transaction('pdfs', 'readonly')
        const store = tx.objectStore('pdfs')
        const req = store.get(id)
        req.onsuccess = () => {
            const result = req.result
            if (!result) return resolve(null)
            const buffer = result.blob
            resolve(new Blob([buffer], { type: result.type }))
        }
        req.onerror = () => reject(req.error)
    })
}

export async function deletePdf(id: string) {
    const db = await openDb()
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction('pdfs', 'readwrite')
        const store = tx.objectStore('pdfs')
        const req = store.delete(id)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
    })
}
