
"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { CargarNuevo } from "../../componentes/Cargar-Nuevo"
import { RevisarEstudio } from "../../componentes/Revisar-Estudio"
import type { EstudioData } from "../revision/page"

export default function Page() {
	const [currentView, setCurrentView] = useState<"cargar" | "revisar">("cargar")
	const [estudioData, setEstudioData] = useState<EstudioData | null>(null)

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

		// Otherwise, open revisar view with the uploaded estudio
		setEstudioData(data)
		setCurrentView('revisar')
	}

	const router = useRouter()

	const handleVolver = () => {
		setCurrentView("cargar")
		setEstudioData(null)
	}

	const handleCompletado = () => {
		if (!estudioData) return
		const nuevoEstudio = { ...estudioData, status: 'completado' as const }
		try {
			const raw = localStorage.getItem('estudios_metadata')
			const metas = raw ? JSON.parse(raw) as Array<Record<string, unknown>> : []
			const rest = { ...nuevoEstudio } as Record<string, unknown>
			// @ts-ignore delete runtime-only
			delete rest['pdfFile']
			metas.push(rest)
			localStorage.setItem('estudios_metadata', JSON.stringify(metas))
		} catch (e) {
			console.error('Error persisting metadata on completed', e)
		}
		setEstudioData(null)
		// navigate to revision dashboard so user sees the updated list
		router.push('/revision')
	}

	const handleParcial = () => {
		if (!estudioData) return
		const nuevoEstudio = { ...estudioData, status: 'parcial' as const }
		try {
			const raw = localStorage.getItem('estudios_metadata')
			const metas = raw ? JSON.parse(raw) as Array<Record<string, unknown>> : []
			const rest = { ...nuevoEstudio } as Record<string, unknown>
			// @ts-ignore delete runtime-only
			delete rest['pdfFile']
			metas.push(rest)
			localStorage.setItem('estudios_metadata', JSON.stringify(metas))
			console.debug('[cargar-nuevo] persisted parcial, metas count:', metas.length)
			// user feedback
			try { alert('Estudio marcado como parcial y guardado') } catch (e) { }
		} catch (e) {
			console.error('Error persisting metadata on parcial', e)
		}
		setEstudioData(null)
		router.push('/revision')
	}


	return (
		<div className="min-h-screen bg-gray-100 flex items-center justify-center">
			{currentView === "cargar" && <CargarNuevo onCargarEstudio={handleCargarEstudio} />}
			{currentView === "revisar" && estudioData && (
				<RevisarEstudio
					estudioData={estudioData}
					onVolver={handleVolver}
					onCompletado={handleCompletado}
					onParcial={handleParcial}
				/>
			)}
		</div>
	)
}
