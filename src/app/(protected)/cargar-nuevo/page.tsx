
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { CargarNuevo } from "@/componentes/Cargar-Nuevo"
import { RevisarEstudio } from "@/componentes/Revisar-Estudio"
import Toast from '@/componentes/Toast'
import type { EstudioData } from "../revision/page"

export default function Page() {
    const [currentView, setCurrentView] = useState<"cargar" | "revisar">("cargar")
    const [estudioData, setEstudioData] = useState<EstudioData | null>(null)
    const [toastMessage, setToastMessage] = useState<string>('')
    const [showToast, setShowToast] = useState<boolean>(false)

    const searchParams = useSearchParams()

    useEffect(() => {
        try {
            const id = searchParams?.get('id')
            if (id) {
                const raw = localStorage.getItem('estudios_metadata')
                const metas = raw ? JSON.parse(raw) as Array<Record<string, any>> : []
                const found = metas.find(m => m.id === id)
                if (found) {
                    setEstudioData(found as EstudioData)
                    setCurrentView('cargar')
                }
            }
        } catch (e) {
            // ignore
        }
    }, [searchParams])

    const handleCargarEstudio = (data: EstudioData, opts?: { autoComplete?: boolean }) => {
        // If autoComplete flag present, persist metadata and stay in 'cargar'
        if (opts?.autoComplete) {
            const nuevoEstudio = { ...data, status: 'completado' as const }
            try {
                const raw = localStorage.getItem('estudios_metadata')
                const metas = raw ? JSON.parse(raw) as Array<Record<string, unknown>> : []
                const rest = { ...nuevoEstudio } as Record<string, unknown>
                // @ts-ignore delete runtime-only
                delete rest['pdfFile']
                metas.push(rest)
                localStorage.setItem('estudios_metadata', JSON.stringify(metas))
            } catch (e) {
                console.error('Error persisting metadata on load', e)
            }
            setEstudioData(null)
            setCurrentView('cargar')
            return
        }

        // If this payload has an id, update the pre-created en_proceso entry instead of appending
        try {
            const raw = localStorage.getItem('estudios_metadata')
            const metas = raw ? JSON.parse(raw) as Array<Record<string, any>> : []
            if (data.id) {
                const idx = metas.findIndex(m => m.id === data.id)
                const toStore = { ...data } as Record<string, any>
                // @ts-ignore
                delete toStore['pdfFile']
                // If there's an existing en_proceso item, update it with the PDF url but DO NOT change its status yet.
                if (idx >= 0) {
                    metas[idx] = { ...metas[idx], ...toStore }
                    localStorage.setItem('estudios_metadata', JSON.stringify(metas))
                    // show preview so user can choose Parcial / Completado
                    setEstudioData({ ...(metas[idx] as Record<string, any>) } as EstudioData)
                    setCurrentView('revisar')
                    // user feedback: toast that pdf was added
                    setToastMessage('PDF agregado')
                    setShowToast(true)
                    return
                }
            }
            // Otherwise save metadata and go back to dashboard/revision
            try {
                const rest = { ...data } as Record<string, any>
                // @ts-ignore
                delete rest['pdfFile']
                metas.push(rest)
                localStorage.setItem('estudios_metadata', JSON.stringify(metas))
                setEstudioData(null)
                router.push('/revision')
            } catch (e) {
                console.error('[cargar-nuevo] error persisting metadata', e)
                setEstudioData(data)
                setCurrentView('revisar')
            }
        } catch (e) {
            console.error('[cargar-nuevo] error updating existing en_proceso metadata', e)
            try {
                const raw = localStorage.getItem('estudios_metadata')
                const metas = raw ? JSON.parse(raw) as Array<Record<string, any>> : []
                const rest = { ...data } as Record<string, any>
                // @ts-ignore
                delete rest['pdfFile']
                metas.push(rest)
                localStorage.setItem('estudios_metadata', JSON.stringify(metas))
                setEstudioData(null)
                router.push('/revision')
            } catch (err) {
                setEstudioData(data)
                setCurrentView('revisar')
            }
        }
    }

    const router = useRouter()

    const handleVolver = () => {
        setCurrentView("cargar")
        setEstudioData(null)
    }

    const handleCompletado = () => {
        if (!estudioData) return
        try {
            const raw = localStorage.getItem('estudios_metadata')
            const metas = raw ? JSON.parse(raw) as Array<Record<string, any>> : []
            const idx = metas.findIndex(m => m.id === estudioData.id)
            const rest = { ...(estudioData as Record<string, any>), status: 'completado' }
            // @ts-ignore
            delete rest['pdfFile']
            if (idx >= 0) {
                metas[idx] = { ...metas[idx], ...rest }
            } else {
                metas.push(rest)
            }
            localStorage.setItem('estudios_metadata', JSON.stringify(metas))
        } catch (e) {
            console.error('Error persisting metadata on completed', e)
        }
        // show toast and navigate shortly after so message is visible
        setToastMessage('Estudio marcado como completado')
        setShowToast(true)
        setTimeout(() => {
            setEstudioData(null)
            router.push('/revision')
        }, 600)
    }

    const handleParcial = () => {
        if (!estudioData) return
        try {
            const raw = localStorage.getItem('estudios_metadata')
            const metas = raw ? JSON.parse(raw) as Array<Record<string, any>> : []
            const idx = metas.findIndex(m => m.id === estudioData.id)
            const rest = { ...(estudioData as Record<string, any>), status: 'parcial' }
            // @ts-ignore delete runtime-only
            delete rest['pdfFile']
            if (idx >= 0) {
                metas[idx] = { ...metas[idx], ...rest }
            } else {
                metas.push(rest)
            }
            localStorage.setItem('estudios_metadata', JSON.stringify(metas))
            console.debug('[cargar-nuevo] persisted parcial, metas count:', metas.length)
            // user feedback via toast
            setToastMessage('Estudio marcado como parcial y guardado')
            setShowToast(true)
        } catch (e) {
            console.error('Error persisting metadata on parcial', e)
        }
        setTimeout(() => {
            setEstudioData(null)
            router.push('/revision')
        }, 600)
    }


    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            {currentView === "cargar" && <CargarNuevo onCargarEstudio={handleCargarEstudio} initialData={estudioData ?? undefined} initialId={estudioData?.id} />}
            {currentView === "revisar" && estudioData && (
                <RevisarEstudio
                    estudioData={estudioData}
                    onVolver={handleVolver}
                    onCompletado={handleCompletado}
                    onParcial={handleParcial}
                />
            )}
            <Toast message={toastMessage} type="success" show={showToast} onClose={() => setShowToast(false)} />
        </div>
    )
}
