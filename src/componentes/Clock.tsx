"use client"

import { useEffect, useState } from "react"
import { Clock as ClockIcon } from 'lucide-react'

type ClockProps = {
    iconColor?: string // Tailwind text color class for icon, e.g. 'text-sky-500'
    boxBg?: string // Tailwind bg class for the box, e.g. 'bg-sky-50'
    boxBorder?: string // Tailwind border color class, e.g. 'border-sky-100'
    showIcon?: boolean
}

export default function Clock({ iconColor = 'text-sky-500', boxBg = 'bg-sky-50/60', boxBorder = 'border-sky-100', showIcon = true }: ClockProps) {
    const [now, setNow] = useState<Date>(new Date())
    const [blink, setBlink] = useState<boolean>(true)

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000)
        const b = setInterval(() => setBlink((s) => !s), 500)
        return () => {
            clearInterval(t)
            clearInterval(b)
        }
    }, [])

    const dateFormatter = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })

    const rawDate = dateFormatter.format(now)
    const dateStr = rawDate.charAt(0).toUpperCase() + rawDate.slice(1)

    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const timeStr = `${hours}${blink ? ':' : ' '}${minutes}`

    return (
        <div className="flex items-center gap-3">
            {showIcon && <ClockIcon className={`${iconColor} w-5 h-5`} />}
            <div className={`${boxBg} ${boxBorder} backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm border text-right`}>
                <div className="text-sm text-gray-600 leading-4">{dateStr}</div>
                <div className="text-lg font-semibold text-gray-900 tracking-wide">{timeStr}</div>
            </div>
        </div>
    )
}
