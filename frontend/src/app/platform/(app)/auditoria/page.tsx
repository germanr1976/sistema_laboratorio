"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import platformAuthFetch from '../../../../utils/platformAuth';

type AuditEventRow = {
    id: number;
    eventType: string;
    tenantId?: number | null;
    actorUserId?: number | null;
    targetUserId?: number | null;
    requestId?: string | null;
    createdAt: string;
    tenant?: {
        id: number;
        name: string;
        slug: string;
    } | null;
    actorUser?: {
        id: number;
        dni: string;
        email?: string | null;
    } | null;
};

type Pagination = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

const EVENT_TYPES = [
    'LOGIN_SUCCESS',
    'LOGIN_FAILED',
    'STUDY_CREATED',
    'STUDY_STATUS_CHANGED',
    'STUDY_EDITED',
    'STUDY_DOWNLOADED',
    'ROLE_CHANGED',
    'TENANT_SUSPENDED',
    'USER_CREATED',
    'USER_UPDATED',
    'USER_DELETED',
    'TENANT_SETTINGS_UPDATED',
    'PLATFORM_TENANT_CREATED',
    'PLATFORM_PLAN_ASSIGNED',
    'PERMISSION_CHANGED',
] as const;

function getApiBase() {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}

export default function PlatformAuditoriaPage() {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<AuditEventRow[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

    const [tenantId, setTenantId] = useState('');
    const [eventType, setEventType] = useState('');
    const [actorUserId, setActorUserId] = useState('');
    const [requestId, setRequestId] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const apiBase = useMemo(() => getApiBase(), []);

    const fetchAudit = async (page = 1) => {
        setLoading(true);
        setMessageType('info');
        try {
            const query = new URLSearchParams();
            query.set('page', String(page));
            query.set('limit', String(pagination.limit));
            if (tenantId.trim()) query.set('tenantId', tenantId.trim());
            if (eventType) query.set('eventType', eventType);
            if (actorUserId.trim()) query.set('actorUserId', actorUserId.trim());
            if (requestId.trim()) query.set('requestId', requestId.trim());
            if (dateFrom) query.set('dateFrom', dateFrom);
            if (dateTo) query.set('dateTo', dateTo);

            const response = await platformAuthFetch(`${apiBase}/api/platform/audit/events?${query.toString()}`);
            if (response.status === 403) {
                setMessage('No tenes permisos para ver auditoría global.');
                setMessageType('error');
                return;
            }

            const json = await response.json().catch(() => ({}));
            if (!response.ok) {
                setMessage(json?.message || 'No se pudo obtener auditoría global.');
                setMessageType('error');
                return;
            }

            setRows(Array.isArray(json?.data) ? json.data : []);
            setPagination(json?.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 });
            setMessage('Auditoría global actualizada.');
            setMessageType('success');
        } catch (error) {
            console.error(error);
            setMessage('Error de red consultando auditoría global.');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAudit(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBase]);

    const onSearch = async (e: FormEvent) => {
        e.preventDefault();
        await fetchAudit(1);
    };

    const formatDate = (value: string) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString('es-AR');
    };

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            <div className="sticky top-0 z-20 -mx-6 mb-6 border-b border-slate-200 bg-slate-50/95 px-6 pb-4 pt-6 backdrop-blur">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Auditoría Global</h1>
                        <p className="text-slate-600">Eventos de seguridad y operación de todos los tenants.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => fetchAudit(pagination.page || 1)}
                        className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                    >
                        Refrescar
                    </button>
                </div>

                <form onSubmit={onSearch} className="mt-4 rounded-xl border border-slate-200 bg-white p-4 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    <input
                        className="border rounded px-3 py-2"
                        placeholder="Tenant ID"
                        value={tenantId}
                        onChange={(e) => setTenantId(e.target.value.replace(/\D/g, ''))}
                    />
                    <select className="border rounded px-3 py-2" value={eventType} onChange={(e) => setEventType(e.target.value)}>
                        <option value="">Todos los eventos</option>
                        {EVENT_TYPES.map((event) => (
                            <option key={event} value={event}>{event}</option>
                        ))}
                    </select>
                    <input
                        className="border rounded px-3 py-2"
                        placeholder="Actor User ID"
                        value={actorUserId}
                        onChange={(e) => setActorUserId(e.target.value.replace(/\D/g, ''))}
                    />
                    <input
                        className="border rounded px-3 py-2"
                        placeholder="Request ID"
                        value={requestId}
                        onChange={(e) => setRequestId(e.target.value)}
                    />
                    <input className="border rounded px-3 py-2" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    <input className="border rounded px-3 py-2" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    <button type="submit" className="rounded bg-blue-600 text-white px-4 py-2 md:col-span-3 xl:col-span-6">Aplicar filtros</button>
                </form>
            </div>

            {message && (
                <div className={`rounded border p-3 text-sm ${messageType === 'error' ? 'border-red-200 bg-red-50 text-red-700' : messageType === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-700'}`}>
                    {message}
                </div>
            )}

            <section className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                        <tr>
                            <th className="text-left p-3">Fecha</th>
                            <th className="text-left p-3">Evento</th>
                            <th className="text-left p-3">Tenant</th>
                            <th className="text-left p-3">Actor</th>
                            <th className="text-left p-3">Request ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td className="p-6 text-center text-slate-500" colSpan={5}>Cargando auditoría...</td>
                            </tr>
                        )}
                        {!loading && rows.length === 0 && (
                            <tr>
                                <td className="p-6 text-center text-slate-500" colSpan={5}>No hay eventos para los filtros aplicados.</td>
                            </tr>
                        )}
                        {!loading && rows.map((row) => (
                            <tr key={row.id} className="border-t">
                                <td className="p-3">{formatDate(row.createdAt)}</td>
                                <td className="p-3 font-medium">{row.eventType}</td>
                                <td className="p-3">{row.tenant ? `${row.tenant.name} (${row.tenant.slug})` : row.tenantId || '-'}</td>
                                <td className="p-3">{row.actorUser ? `${row.actorUser.id} · ${row.actorUser.dni}` : row.actorUserId || '-'}</td>
                                <td className="p-3">{row.requestId || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <div className="flex items-center justify-between text-sm text-slate-600">
                <p>Total eventos: {pagination.total}</p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={pagination.page <= 1 || loading}
                        onClick={() => fetchAudit(pagination.page - 1)}
                        className="rounded border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <span>Página {pagination.page} de {Math.max(pagination.totalPages, 1)}</span>
                    <button
                        type="button"
                        disabled={pagination.page >= pagination.totalPages || loading || pagination.totalPages === 0}
                        onClick={() => fetchAudit(pagination.page + 1)}
                        className="rounded border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    );
}
