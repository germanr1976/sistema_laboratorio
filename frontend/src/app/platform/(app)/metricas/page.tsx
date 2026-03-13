"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import platformAuthFetch from '../../../../utils/platformAuth';

type GlobalMetrics = {
    tenantTotal: number;
    tenantSuspended: number;
    userTotal: number;
    studyTotal: number;
    auditTotal: number;
    activeSubscriptions: number;
};

type TenantRow = {
    id: number;
    name: string;
    slug: string;
    suspended: boolean;
    subscriptions?: Array<{
        status: string;
        plan?: {
            code: string;
            name: string;
        };
    }>;
};

type AuditEventRow = {
    id: number;
    eventType: string;
    createdAt: string;
    tenantId?: number | null;
};

type AlertSeverity = 'alta' | 'media' | 'baja';

type OperationalAlert = {
    id: string;
    title: string;
    detail: string;
    severity: AlertSeverity;
    href: string;
};

function getApiBase() {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}

export default function PlatformMetricasPage() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
    const [tenants, setTenants] = useState<TenantRow[]>([]);
    const [recentAuditEvents, setRecentAuditEvents] = useState<AuditEventRow[]>([]);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

    const apiBase = useMemo(() => getApiBase(), []);

    const loadMetrics = async () => {
        setLoading(true);
        setMessage('');
        setMessageType('info');
        try {
            const dateFrom72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
            const [metricsRes, tenantsRes] = await Promise.all([
                platformAuthFetch(`${apiBase}/api/platform/metrics/global`),
                platformAuthFetch(`${apiBase}/api/platform/tenants`),
            ]);

            if (metricsRes.status === 403 || tenantsRes.status === 403) {
                setMessage('No tenes permisos de administrador de plataforma.');
                setMessageType('error');
                return;
            }

            const [metricsJson, tenantsJson] = await Promise.all([
                metricsRes.json().catch(() => ({})),
                tenantsRes.json().catch(() => ({})),
            ]);

            if (!metricsRes.ok || !tenantsRes.ok) {
                setMessage(metricsJson?.message || tenantsJson?.message || 'No se pudieron cargar las métricas.');
                setMessageType('error');
                return;
            }

            let auditEvents: AuditEventRow[] = [];
            let auditUnavailable = false;
            const auditRes = await platformAuthFetch(
                `${apiBase}/api/platform/audit/events?page=1&limit=100&dateFrom=${encodeURIComponent(dateFrom72h)}`,
            );

            if (auditRes.ok) {
                const auditJson = await auditRes.json().catch(() => ({}));
                auditEvents = Array.isArray(auditJson?.data) ? auditJson.data : [];
            } else {
                auditUnavailable = true;
                console.warn('No se pudieron cargar eventos de auditoría para alertas operativas', {
                    status: auditRes.status,
                });
                setMessage('Métricas cargadas. Auditoría temporalmente no disponible para alertas.');
                setMessageType('info');
            }

            setMetrics(metricsJson?.data || null);
            setTenants(Array.isArray(tenantsJson?.data) ? tenantsJson.data : []);
            setRecentAuditEvents(auditEvents);

            if (!auditUnavailable) {
                setMessage('Métricas actualizadas.');
                setMessageType('success');
            }
        } catch (error) {
            console.error(error);
            setMessage('Error de red cargando métricas.');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMetrics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBase]);

    const alerts = useMemo<OperationalAlert[]>(() => {
        const alertsList: OperationalAlert[] = [];

        const tenantsWithoutActivePlan = tenants.filter((tenant) => {
            const currentSub = tenant.subscriptions?.[0];
            return !currentSub || currentSub.status !== 'ACTIVE';
        });

        if (tenantsWithoutActivePlan.length > 0) {
            alertsList.push({
                id: 'tenants-no-active-plan',
                title: 'Tenants sin plan activo',
                detail: `${tenantsWithoutActivePlan.length} tenants requieren revisión de suscripción.`,
                severity: 'alta',
                href: '/platform/tenants',
            });
        }

        const now = Date.now();
        const last24h = now - 24 * 60 * 60 * 1000;
        const last72h = now - 72 * 60 * 60 * 1000;

        const loginFailed24h = recentAuditEvents.filter((event) => {
            const eventTime = new Date(event.createdAt).getTime();
            return event.eventType === 'LOGIN_FAILED' && eventTime >= last24h;
        }).length;

        if (loginFailed24h >= 10) {
            alertsList.push({
                id: 'login-failed-spike',
                title: 'Pico de logins fallidos',
                detail: `${loginFailed24h} intentos fallidos en las últimas 24h.`,
                severity: 'alta',
                href: '/platform/auditoria?eventType=LOGIN_FAILED',
            });
        }

        const criticalChanges24h = recentAuditEvents.filter((event) => {
            const eventTime = new Date(event.createdAt).getTime();
            return (event.eventType === 'PERMISSION_CHANGED' || event.eventType === 'ROLE_CHANGED') && eventTime >= last24h;
        }).length;

        if (criticalChanges24h >= 5) {
            alertsList.push({
                id: 'critical-permission-changes',
                title: 'Cambios críticos de permisos',
                detail: `${criticalChanges24h} cambios de roles/permisos en las últimas 24h.`,
                severity: 'media',
                href: '/platform/auditoria?eventType=PERMISSION_CHANGED',
            });
        }

        const suspendedEvents72h = recentAuditEvents.filter((event) => {
            const eventTime = new Date(event.createdAt).getTime();
            return event.eventType === 'TENANT_SUSPENDED' && eventTime >= last72h;
        }).length;

        if (suspendedEvents72h > 0) {
            alertsList.push({
                id: 'recent-tenant-suspensions',
                title: 'Suspensiones recientes de tenants',
                detail: `${suspendedEvents72h} eventos de suspensión/reactivación en 72h.`,
                severity: 'media',
                href: '/platform/auditoria?eventType=TENANT_SUSPENDED',
            });
        }

        if (alertsList.length === 0) {
            alertsList.push({
                id: 'healthy',
                title: 'Sin alertas operativas',
                detail: 'No se detectaron anomalías con las reglas actuales.',
                severity: 'baja',
                href: '/platform/auditoria',
            });
        }

        return alertsList;
    }, [recentAuditEvents, tenants]);

    if (loading) {
        return <div className="p-6">Cargando métricas...</div>;
    }

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Métricas Globales</h1>
                    <p className="text-slate-600">Vista consolidada del estado general del servicio.</p>
                </div>
                <button
                    type="button"
                    onClick={loadMetrics}
                    className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                    Refrescar métricas
                </button>
            </div>

            {message && (
                <div
                    className={`rounded border p-3 text-sm ${messageType === 'error'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : messageType === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-300 bg-white text-slate-700'
                        }`}
                >
                    {message}
                </div>
            )}

            <section className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
                <MetricCard label="Tenants" value={metrics?.tenantTotal ?? 0} />
                <MetricCard label="Suspendidos" value={metrics?.tenantSuspended ?? 0} />
                <MetricCard label="Usuarios" value={metrics?.userTotal ?? 0} />
                <MetricCard label="Estudios" value={metrics?.studyTotal ?? 0} />
                <MetricCard label="Eventos auditoría" value={metrics?.auditTotal ?? 0} />
                <MetricCard label="Suscripciones activas" value={metrics?.activeSubscriptions ?? 0} />
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-slate-900">Alertas operativas</h2>
                    <Link href="/platform/auditoria" className="text-sm font-medium text-blue-700 hover:text-blue-800">
                        Ver auditoría completa
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {alerts.map((alert) => (
                        <div key={alert.id} className={`rounded-lg border p-3 ${alert.severity === 'alta'
                            ? 'border-red-200 bg-red-50'
                            : alert.severity === 'media'
                                ? 'border-amber-200 bg-amber-50'
                                : 'border-blue-200 bg-blue-50'
                            }`}>
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-slate-900">{alert.title}</p>
                                <span className={`text-[11px] uppercase tracking-wide font-medium ${alert.severity === 'alta'
                                    ? 'text-red-700'
                                    : alert.severity === 'media'
                                        ? 'text-amber-700'
                                        : 'text-blue-700'
                                    }`}>{alert.severity}</span>
                            </div>
                            <p className="text-sm text-slate-700 mt-1">{alert.detail}</p>
                            <Link href={alert.href} className="inline-block mt-2 text-sm font-medium text-slate-900 underline">
                                Ver detalle
                            </Link>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

function MetricCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
            <p className="text-2xl font-semibold text-slate-900">{value}</p>
        </div>
    );
}
