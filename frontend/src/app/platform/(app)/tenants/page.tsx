"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import platformAuthFetch from '../../../../utils/platformAuth';

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

const PLAN_CODES = ['STARTER', 'PRO', 'ENTERPRISE'] as const;

function getApiBase() {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}

function getApiErrorMessage(json: any, fallback: string) {
    if (json?.message && typeof json.message === 'string' && json.message.trim()) {
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            const first = json.errors[0];
            const detail = first?.message || first?.path?.join('.') || '';
            return detail ? `${json.message}: ${String(detail).replaceAll('"', '')}` : json.message;
        }
        return json.message;
    }
    return fallback;
}

export default function PlatformTenantsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
    const [tenants, setTenants] = useState<TenantRow[]>([]);

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [planCode, setPlanCode] = useState<(typeof PLAN_CODES)[number]>('STARTER');
    const [adminTenantId, setAdminTenantId] = useState<number | null>(null);
    const [adminDni, setAdminDni] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [adminFirstName, setAdminFirstName] = useState('');
    const [adminLastName, setAdminLastName] = useState('');
    const [adminLicense, setAdminLicense] = useState('');
    const [editingTenantId, setEditingTenantId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState('');
    const [editingSlug, setEditingSlug] = useState('');
    const createAdminSectionRef = useRef<HTMLElement | null>(null);

    const apiBase = useMemo(() => getApiBase(), []);

    const loadTenants = async () => {
        setLoading(true);
        setMessageType('info');
        try {
            const tenantsRes = await platformAuthFetch(`${apiBase}/api/platform/tenants`);
            if (tenantsRes.status === 403) {
                setMessage('No tenes permisos de administrador de plataforma.');
                setMessageType('error');
                return;
            }

            const tenantsJson = await tenantsRes.json().catch(() => ({}));
            if (!tenantsRes.ok) {
                setMessage(tenantsJson?.message || 'No se pudo cargar la lista de tenants.');
                setMessageType('error');
                return;
            }

            const nextTenants = Array.isArray(tenantsJson?.data) ? tenantsJson.data : [];
            setTenants(nextTenants);
            if (nextTenants.length > 0 && !adminTenantId) {
                setAdminTenantId(nextTenants[0].id);
            }

            if (adminTenantId && !nextTenants.some((tenant: TenantRow) => tenant.id === adminTenantId)) {
                setAdminTenantId(nextTenants.length > 0 ? nextTenants[0].id : null);
            }
        } catch (error) {
            console.error(error);
            setMessage('Error cargando tenants.');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTenants();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBase]);

    const handleCreateTenant = async (e: FormEvent) => {
        e.preventDefault();
        const normalizedSlug = slug.trim().toLowerCase();
        if (!name.trim() || !normalizedSlug) {
            setMessage('Completa nombre y slug.');
            setMessageType('error');
            return;
        }

        if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
            setMessage('El slug solo puede tener minusculas, numeros y guiones.');
            setMessageType('error');
            return;
        }

        setSaving(true);
        setMessage('');
        try {
            const response = await platformAuthFetch(`${apiBase}/api/platform/tenants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    slug: normalizedSlug,
                    initialPlanCode: planCode,
                }),
            });

            const json = await response.json().catch(() => ({}));
            if (!response.ok) {
                setMessage(getApiErrorMessage(json, 'No se pudo crear el tenant.'));
                setMessageType('error');
                return;
            }

            setName('');
            setSlug('');
            setPlanCode('STARTER');
            setMessage('Tenant creado correctamente.');
            setMessageType('success');
            await loadTenants();
        } catch (error) {
            console.error(error);
            setMessage('Error de red creando tenant.');
            setMessageType('error');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleSuspended = async (tenant: TenantRow) => {
        const action = tenant.suspended ? 'reactivar' : 'suspender';
        if (!confirm(`Seguro que queres ${action} el tenant ${tenant.slug}?`)) {
            return;
        }

        setSaving(true);
        setMessage('');
        try {
            const response = await platformAuthFetch(`${apiBase}/api/platform/tenants/${tenant.id}/suspended`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ suspended: !tenant.suspended }),
            });
            const json = await response.json().catch(() => ({}));
            if (!response.ok) {
                setMessage(getApiErrorMessage(json, 'No se pudo actualizar estado del tenant.'));
                setMessageType('error');
                return;
            }
            setMessage(`Tenant ${tenant.slug} actualizado correctamente.`);
            setMessageType('success');
            await loadTenants();
        } catch (error) {
            console.error(error);
            setMessage('Error de red actualizando tenant.');
            setMessageType('error');
        } finally {
            setSaving(false);
        }
    };

    const handleAssignPlan = async (tenantId: number, nextPlanCode: string) => {
        setSaving(true);
        setMessage('');
        try {
            const response = await platformAuthFetch(`${apiBase}/api/platform/tenants/${tenantId}/plan`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planCode: nextPlanCode,
                    status: 'ACTIVE',
                }),
            });
            const json = await response.json().catch(() => ({}));
            if (!response.ok) {
                setMessage(getApiErrorMessage(json, 'No se pudo asignar plan.'));
                setMessageType('error');
                return;
            }
            setMessage(`Plan ${nextPlanCode} asignado correctamente.`);
            setMessageType('success');
            await loadTenants();
        } catch (error) {
            console.error(error);
            setMessage('Error de red asignando plan.');
            setMessageType('error');
        } finally {
            setSaving(false);
        }
    };

    const startEditTenant = (tenant: TenantRow) => {
        setEditingTenantId(tenant.id);
        setEditingName(tenant.name);
        setEditingSlug(tenant.slug);
        setMessage('');
    };

    const cancelEditTenant = () => {
        setEditingTenantId(null);
        setEditingName('');
        setEditingSlug('');
    };

    const handleSaveTenantEdit = async (tenantId: number) => {
        const normalizedSlug = editingSlug.trim().toLowerCase();
        const normalizedName = editingName.trim();

        if (!normalizedName || !normalizedSlug) {
            setMessage('Completa nombre y slug para editar el tenant.');
            setMessageType('error');
            return;
        }

        if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
            setMessage('El slug solo puede tener minusculas, numeros y guiones.');
            setMessageType('error');
            return;
        }

        setSaving(true);
        setMessage('');
        try {
            const response = await platformAuthFetch(`${apiBase}/api/platform/tenants/${tenantId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: normalizedName,
                    slug: normalizedSlug,
                }),
            });
            const json = await response.json().catch(() => ({}));
            if (!response.ok) {
                setMessage(getApiErrorMessage(json, 'No se pudo editar el tenant.'));
                setMessageType('error');
                return;
            }

            setMessage('Tenant actualizado correctamente.');
            setMessageType('success');
            cancelEditTenant();
            await loadTenants();
        } catch (error) {
            console.error(error);
            setMessage('Error de red editando tenant.');
            setMessageType('error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTenant = async (tenant: TenantRow) => {
        const confirmation = prompt(`Para eliminar el tenant, escribi su slug exacto: ${tenant.slug}`);
        if (confirmation === null) {
            return;
        }

        if (confirmation.trim() !== tenant.slug) {
            setMessage('El slug ingresado no coincide. Eliminacion cancelada.');
            setMessageType('error');
            return;
        }

        setSaving(true);
        setMessage('');
        try {
            const response = await platformAuthFetch(`${apiBase}/api/platform/tenants/${tenant.id}`, {
                method: 'DELETE',
            });
            const json = await response.json().catch(() => ({}));
            if (!response.ok) {
                setMessage(getApiErrorMessage(json, 'No se pudo eliminar el tenant.'));
                setMessageType('error');
                return;
            }

            setMessage(`Tenant ${tenant.slug} eliminado correctamente.`);
            setMessageType('success');
            if (editingTenantId === tenant.id) {
                cancelEditTenant();
            }
            await loadTenants();
        } catch (error) {
            console.error(error);
            setMessage('Error de red eliminando tenant.');
            setMessageType('error');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateTenantAdmin = async (e: FormEvent) => {
        e.preventDefault();

        if (!adminTenantId) {
            setMessage('Selecciona un tenant para crear el administrador.');
            setMessageType('error');
            return;
        }

        if (!adminDni || !adminEmail || !adminPassword || !adminFirstName || !adminLastName) {
            setMessage('Completa todos los campos obligatorios del admin tenant.');
            setMessageType('error');
            return;
        }

        setSaving(true);
        setMessage('');

        try {
            const response = await platformAuthFetch(`${apiBase}/api/platform/tenants/${adminTenantId}/admins`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dni: adminDni.trim(),
                    email: adminEmail.trim().toLowerCase(),
                    password: adminPassword,
                    firstName: adminFirstName.trim(),
                    lastName: adminLastName.trim(),
                    license: adminLicense.trim() || null,
                }),
            });

            const json = await response.json().catch(() => ({}));
            if (!response.ok) {
                setMessage(getApiErrorMessage(json, 'No se pudo crear el administrador del tenant.'));
                setMessageType('error');
                return;
            }

            setAdminDni('');
            setAdminEmail('');
            setAdminPassword('');
            setAdminFirstName('');
            setAdminLastName('');
            setAdminLicense('');

            setMessage('Administrador tenant creado correctamente.');
            setMessageType('success');
            await loadTenants();
        } catch (error) {
            console.error(error);
            setMessage('Error de red creando administrador tenant.');
            setMessageType('error');
        } finally {
            setSaving(false);
        }
    };

    const focusCreateAdminForTenant = (tenant: TenantRow) => {
        setAdminTenantId(tenant.id);
        createAdminSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (loading) {
        return <div className="p-6">Cargando tenants...</div>;
    }

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tenants y Planes</h1>
                    <p className="text-slate-600">Gestiona alta de laboratorios, planes y estado operativo.</p>
                </div>
                <button
                    type="button"
                    disabled={loading || saving}
                    onClick={loadTenants}
                    className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
                >
                    Refrescar datos
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

            <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="font-semibold mb-3">Alta de tenant</h2>
                <p className="text-xs text-slate-500 mb-3">Crea un laboratorio nuevo y asignale un plan inicial.</p>
                <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={handleCreateTenant}>
                    <input
                        className="border rounded px-3 py-2"
                        placeholder="Nombre tenant"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <input
                        className="border rounded px-3 py-2"
                        placeholder="slug-tenant"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                    />
                    <select
                        className="border rounded px-3 py-2"
                        value={planCode}
                        onChange={(e) => setPlanCode(e.target.value as (typeof PLAN_CODES)[number])}
                    >
                        {PLAN_CODES.map((code) => (
                            <option key={code} value={code}>{code}</option>
                        ))}
                    </select>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded bg-blue-600 text-white px-4 py-2 disabled:opacity-60"
                    >
                        {saving ? 'Guardando...' : 'Crear tenant'}
                    </button>
                </form>
            </section>

            <section ref={createAdminSectionRef} className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="font-semibold mb-3">Crear Admin Tenant</h2>
                <p className="text-xs text-slate-500 mb-3">Usalo para crear el primer usuario administrador de un laboratorio.</p>
                <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={handleCreateTenantAdmin}>
                    <select
                        className="border rounded px-3 py-2"
                        value={adminTenantId ?? ''}
                        onChange={(e) => setAdminTenantId(Number(e.target.value) || null)}
                        required
                    >
                        {tenants.length === 0 && <option value="">Sin tenants</option>}
                        {tenants.map((tenant) => (
                            <option key={tenant.id} value={tenant.id}>
                                {tenant.name} ({tenant.slug})
                            </option>
                        ))}
                    </select>
                    <input
                        className="border rounded px-3 py-2"
                        placeholder="DNI"
                        value={adminDni}
                        onChange={(e) => setAdminDni(e.target.value.replace(/\D/g, '').slice(0, 18))}
                        required
                    />
                    <input
                        className="border rounded px-3 py-2"
                        placeholder="Email"
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        required
                    />
                    <input
                        className="border rounded px-3 py-2"
                        placeholder="Contraseña"
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        required
                    />
                    <input
                        className="border rounded px-3 py-2"
                        placeholder="Nombre"
                        value={adminFirstName}
                        onChange={(e) => setAdminFirstName(e.target.value)}
                        required
                    />
                    <input
                        className="border rounded px-3 py-2"
                        placeholder="Apellido"
                        value={adminLastName}
                        onChange={(e) => setAdminLastName(e.target.value)}
                        required
                    />
                    <input
                        className="border rounded px-3 py-2"
                        placeholder="Matrícula (opcional)"
                        value={adminLicense}
                        onChange={(e) => setAdminLicense(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={saving || tenants.length === 0}
                        className="rounded bg-emerald-600 text-white px-4 py-2 disabled:opacity-60"
                    >
                        {saving ? 'Guardando...' : 'Crear admin'}
                    </button>
                </form>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                        <tr>
                            <th className="text-left p-3">Tenant</th>
                            <th className="text-left p-3">Slug</th>
                            <th className="text-left p-3">Estado</th>
                            <th className="text-left p-3">Plan</th>
                            <th className="text-left p-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tenants.length === 0 && (
                            <tr>
                                <td className="p-6 text-center text-slate-500" colSpan={5}>
                                    Todavia no hay tenants creados.
                                </td>
                            </tr>
                        )}
                        {tenants.map((tenant) => {
                            const currentPlan = tenant.subscriptions?.[0]?.plan?.code || '-';
                            const subscriptionStatus = tenant.subscriptions?.[0]?.status || 'SIN_PLAN';
                            const isEditing = editingTenantId === tenant.id;
                            return (
                                <tr key={tenant.id} className="border-t">
                                    <td className="p-3 font-medium">
                                        {isEditing ? (
                                            <input
                                                className="w-full border rounded px-2 py-1"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                            />
                                        ) : (
                                            tenant.name
                                        )}
                                    </td>
                                    <td className="p-3">
                                        {isEditing ? (
                                            <input
                                                className="w-full border rounded px-2 py-1"
                                                value={editingSlug}
                                                onChange={(e) => setEditingSlug(e.target.value)}
                                            />
                                        ) : (
                                            tenant.slug
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <span className={tenant.suspended ? 'text-red-700' : 'text-emerald-700'}>
                                            {tenant.suspended ? 'Suspendido' : 'Activo'}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex flex-col">
                                            <span>{currentPlan}</span>
                                            <span className="text-xs text-slate-500">{subscriptionStatus}</span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex flex-wrap gap-2">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        disabled={saving}
                                                        className="rounded border border-blue-300 bg-blue-50 px-2 py-1 text-blue-800 disabled:opacity-50"
                                                        onClick={() => handleSaveTenantEdit(tenant.id)}
                                                    >
                                                        Guardar
                                                    </button>
                                                    <button
                                                        disabled={saving}
                                                        className="rounded border px-2 py-1 disabled:opacity-50"
                                                        onClick={cancelEditTenant}
                                                    >
                                                        Cancelar
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    disabled={saving}
                                                    className="rounded border border-blue-300 bg-blue-50 px-2 py-1 text-blue-800 disabled:opacity-50"
                                                    onClick={() => startEditTenant(tenant)}
                                                >
                                                    Editar
                                                </button>
                                            )}
                                            <button
                                                disabled={saving}
                                                className="rounded border px-2 py-1 disabled:opacity-50"
                                                onClick={() => handleToggleSuspended(tenant)}
                                            >
                                                {tenant.suspended ? 'Reactivar' : 'Suspender'}
                                            </button>
                                            <button
                                                disabled={saving}
                                                className="rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-emerald-800 disabled:opacity-50"
                                                onClick={() => focusCreateAdminForTenant(tenant)}
                                            >
                                                Crear admin
                                            </button>
                                            <button
                                                disabled={saving}
                                                className="rounded border border-red-300 bg-red-50 px-2 py-1 text-red-700 disabled:opacity-50"
                                                onClick={() => handleDeleteTenant(tenant)}
                                            >
                                                Eliminar
                                            </button>
                                            {PLAN_CODES.map((code) => (
                                                <button
                                                    key={`${tenant.id}-${code}`}
                                                    disabled={saving || currentPlan === code}
                                                    className="rounded border px-2 py-1 disabled:opacity-50"
                                                    onClick={() => handleAssignPlan(tenant.id, code)}
                                                >
                                                    {code}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </section>
        </div>
    );
}
