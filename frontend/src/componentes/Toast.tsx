"use client"

import React, { useEffect, useRef, useState } from "react"

interface ToastProps {
    message: string
    type?: "success" | "error" | "info"
    show?: boolean
    onClose?: () => void
    /** Total visible duration in ms */
    duration?: number
    /** When to start leave animation (ms from show start) */
    leaveDelay?: number
}

export default function Toast({
    message,
    type = "success",
    show = true,
    onClose = () => { },
    duration = 3000,
    leaveDelay,
}: ToastProps) {
    const [leaving, setLeaving] = useState(false)
    const leaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
    const endTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

    // compute sensible default for leaveDelay if not provided
    const computedLeaveDelay = typeof leaveDelay === 'number' ? leaveDelay : Math.max(0, duration - 300)

    useEffect(() => {
        // Only run in browser
        if (!show || typeof window === "undefined") return

        setLeaving(false)

        // schedule leave animation and end callback
        leaveTimeout.current = setTimeout(() => setLeaving(true), computedLeaveDelay)
        endTimeout.current = setTimeout(() => onClose(), duration)

        return () => {
            if (leaveTimeout.current) clearTimeout(leaveTimeout.current)
            if (endTimeout.current) clearTimeout(endTimeout.current)
            leaveTimeout.current = null
            endTimeout.current = null
        }
    }, [show, onClose, duration, computedLeaveDelay])

    if (!show) return null

    const base = "max-w-md w-full px-5 py-4 rounded-lg shadow-xl flex items-center gap-3"
    const bg = type === "success" ? "bg-green-600 text-white" : type === "error" ? "bg-red-600 text-white" : "bg-gray-800 text-white"
    const animClass = leaving ? 'animate-fade-out' : 'animate-fade-in'

    const handleClose = () => {
        // immediate visual feedback
        setLeaving(true)
        // clear pending timers
        if (leaveTimeout.current) { clearTimeout(leaveTimeout.current); leaveTimeout.current = null }
        if (endTimeout.current) { clearTimeout(endTimeout.current); endTimeout.current = null }
        // call onClose so parent can hide the toast
        try { onClose() } catch (e) { console.error(e) }
    }

    return (
        <div className={`fixed bottom-6 right-6 z-50 ${animClass}`}>
            <div className={`${base} ${bg}`} role="status" aria-live="polite">
                <div className="shrink-0">
                    {type === "success" && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
                        </svg>
                    )}
                    {type === "error" && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.681-1.36 3.446 0l5.518 9.823c.75 1.335-.213 2.978-1.724 2.978H4.463c-1.51 0-2.474-1.643-1.724-2.978L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V7a1 1 0 112 0v3a1 1 0 01-1 1z" clipRule="evenodd" />
                        </svg>
                    )}
                    {type === "info" && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 9h2v5H9V9z" />
                            <path d="M10 3a7 7 0 100 14 7 7 0 000-14zM10 1a9 9 0 110 18A9 9 0 0110 1z" />
                        </svg>
                    )}
                </div>

                <div className="text-base font-medium flex-1">{message}</div>

                <button
                    aria-label="Cerrar"
                    onClick={handleClose}
                    className="ml-3 text-white/80 hover:text-white focus:outline-none"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
