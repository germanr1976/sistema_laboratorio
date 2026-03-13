"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import authFetch from '../../../utils/authFetch';

type TenantUser = {
    id: number;
    dni: string;
    email?: string | null;
    role?: { name: string };
    profile?: {
        firstName?: string;
        lastName?: string;
    } | null;
};

type TenantSettings = {
    name?: string;
    slug?: string;
    contactEmail?: string | null;
    supportPhone?: string | null;
    address?: string | null;
};

type PlanStatus = {
    status: string;
    plan?: {
        code: string;
        name: string;
    };
};

const ROLE_OPTIONS = ['ADMIN', 'BIOCHEMIST', 'PATIENT'] as const;

type PermissionDefinition = {
    key: string;
    label: string;
    description: string;
    group: 'Usuarios' | 'Configuracion' | 'Auditoria' | 'Plan';
};

const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
    {
        key: 'users.read',
        label: 'Ver usuarios',
        description: 'Permite listar usuarios del laboratorio.',
        group: 'Usuarios',
    },
    {
        key: 'users.create',
        label: 'Crear usuarios',
        description: 'Permite dar de alta nuevos usuarios.',
        group: 'Usuarios',
    },
    {
        key: 'users.update',
        label: 'Editar usuarios',
        description: 'Permite modificar datos y roles de usuarios.',
        group: 'Usuarios',
    },
    {
        key: 'users.delete',
        label: 'Eliminar usuarios',
        description: 'Permite borrar usuarios sin operaciones asociadas.',
        group: 'Usuarios',
    },
    {
        key: 'roles.manage',
        label: 'Administrar permisos',
        description: 'Permite cambiar permisos por rol.',
        group: 'Configuracion',
    },
    {
        key: 'tenant.settings.manage',
        label: 'Editar configuracion del laboratorio',
        description: 'Permite modificar nombre, contacto y direccion del laboratorio.',
        group: 'Configuracion',
    },
    {
        key: 'audit.read',
        label: 'Ver auditoria',
        description: 'Permite consultar eventos y trazas de actividad.',
        group: 'Auditoria',
    },
    {
        key: 'tenant.plan.read',
        label: 'Ver estado del plan',
        description: 'Permite consultar estado y plan activo del tenant.',
        group: 'Plan',
    },
];

const ROLE_PERMISSION_TEMPLATES: Record<string, string[]> = {
    ADMIN: ['users.read', 'users.create', 'users.update', 'users.delete', 'roles.manage', 'audit.read', 'tenant.settings.manage', 'tenant.plan.read'],
    BIOCHEMIST: ['users.read', 'tenant.plan.read'],
    PATIENT: [],
};

const ADMIN_CRITICAL_PERMISSIONS = ['users.read', 'roles.manage', 'tenant.settings.manage'];

const PERMISSION_GROUPS: Array<PermissionDefinition['group']> = ['Usuarios', 'Configuracion', 'Auditoria', 'Plan'];

function getPermissionLabel(permissionKey: string): string {
    return PERMISSION_DEFINITIONS.find((permission) => permission.key === permissionKey)?.label || permissionKey;
}

function getApiBase() {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}

export default function TenantAdminPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

    const [users, setUsers] = useState<TenantUser[]>([]);
    const [settings, setSettings] = useState<TenantSettings>({});
    const [planStatus, setPlanStatus] = useState<PlanStatus | null>(null);
    const [permissionsView, setPermissionsView] = useState<Array<{ name: string; permissions: string[] }>>([]);
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [permissionRole, setPermissionRole] = useState<string>('ADMIN');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(ROLE_PERMISSION_TEMPLATES.ADMIN);

    const [newUser, setNewUser] = useState({
        dni: '',
        email: '',
        password: '',
        roleName: 'BIOCHEMIST',
        firstName: '',
        lastName: '',
        license: '',
    });

    const apiBase = useMemo(() => getApiBase(), []);

    const loadData = async () => {
        setLoading(true);
        setMessageType('info');
        try {
            const [usersRes, settingsRes, planRes, permissionsRes] = await Promise.all([
                authFetch(`${apiBase}/api/tenant-admin/users`),
                authFetch(`${apiBase}/api/tenant-admin/settings`),
                authFetch(`${apiBase}/api/tenant-admin/plan-status`),
                authFetch(`${apiBase}/api/tenant-admin/permissions`),
            ]);

            const [usersJson, settingsJson, planJson, permissionsJson] = await Promise.all([
                usersRes.json().catch(() => ({})),
                settingsRes.json().catch(() => ({})),
                planRes.json().catch(() => ({})),
                permissionsRes.json().catch(() => ({})),
            ]);

            if (!usersRes.ok || !settingsRes.ok || !planRes.ok || !permissionsRes.ok) {
                setMessage('No se pudieron cargar todos los datos de admin tenant. Verifica permisos ADMIN.');
                setMessageType('error');
            }

            setUsers(Array.isArray(usersJson?.data) ? usersJson.data : []);
            setSettings(settingsJson?.data || {});
            setPlanStatus(planJson?.data || null);
            setPermissionsView(Array.isArray(permissionsJson?.data) ? permissionsJson.data : []);
        } catch (error) {
            console.error(error);
            setMessage('Error cargando admin tenant.');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBase]);

    useEffect(() => {
        const selectedRolePermissions = permissionsView.find((row) => row.name === permissionRole)?.permissions || [];
        setSelectedPermissions(selectedRolePermissions);
    }, [permissionRole, permissionsView]);

    const handleCreateUser = async (e: FormEvent) => {
        e.preventDefault();
        if (!newUser.dni || !newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
            setMessage('Completa todos los campos obligatorios para crear usuario.');
            setMessageType('error');
            return;
        }

        setSaving(true);
        setMessage('');

        try {
            const response = await authFetch(`${apiBase}/api/tenant-admin/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });
            const json = await response.json().catch(() => ({}));
            if (!response.ok) {
                setMessage(json?.message || 'No se pudo crear usuario.');
                setMessageType('error');
                return;
            }

            setNewUser({
                dni: '',
                email: '',
                password: '',
                roleName: 'BIOCHEMIST',
                firstName: '',
                lastName: '',
                license: '',
            });
            setMessage('Usuario creado correctamente.');
            setMessageType('success');
            await loadData();
        } catch (error) {
            console.error(error);
            setMessage('Error de red creando usuario.');
            setMessageType('error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm('Seguro que queres eliminar este usuario?')) return;

        setSaving(true);
        setMessage('');
        try {
            const response = await authFetch(`${apiBase}/api/tenant-admin/users/${userId}`, {
                method: 'DELETE',
            });
            const json = await response.json().catch(() => ({}));
            if (!response.ok) {
                setMessage(json?.message || 'No se pudo eliminar usuario.');
                setMessageType('error');
                return;
            }
            setMessage('Usuario eliminado correctamente.');
            setMessageType('success');
            await loadData();
        } catch (error) {
            console.error(error);
            setMessage('Error de red eliminando usuario.');
            setMessageType('error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSettings = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            const response = await authFetch(`${apiBase}/api/tenant-admin/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: settings.name,
                    contactEmail: settings.contactEmail,
                    supportPhone: settings.supportPhone,
                    address: settings.address,
                }),
            });
            const json = await response.json().catch(() => ({}));
            if (!response.ok) {
                setMessage(json?.message || 'No se pudo guardar configuración.');
                setMessageType('error');
                return;
            }
            setMessage('Configuración actualizada.');
            setMessageType('success');
            await loadData();
        } catch (error) {
            console.error(error);
            setMessage('Error de red guardando configuración.');
            setMessageType('error');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePermissions = async (e: FormEvent) => {
        e.preventDefault();
        const keys = selectedPermissions;

        if (permissionRole === 'ADMIN') {
            const missingCriticalPermissions = ADMIN_CRITICAL_PERMISSIONS.filter((permission) => !keys.includes(permission));
            if (missingCriticalPermissions.length > 0) {
                setMessage(`No se puede guardar. ADMIN debe conservar permisos críticos: ${missingCriticalPermissions.map((permission) => getPermissionLabel(permission)).join(', ')}.`);
                setMessageType('error');
                return;
            }
        }

        const impactMessage = `Rol: ${permissionRole}\nSe agregan: ${addedPermissions.length}\nSe quitan: ${removedPermissions.length}\n\n¿Confirmas guardar estos cambios?`;
        if (!confirm(impactMessage)) {
            return;
        }

        setSaving(true);
        setMessage('');
        try {
            const response = await authFetch(`${apiBase}/api/tenant-admin/permissions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roleName: permissionRole, permissionKeys: keys }),
            });

            const json = await response.json().catch(() => ({}));
            if (!response.ok) {
                setMessage(json?.message || 'No se pudieron actualizar permisos.');
                setMessageType('error');
                return;
            }

            setMessage(`Permisos de ${permissionRole} actualizados.`);
            setMessageType('success');
            await loadData();
        } catch (error) {
            console.error(error);
            setMessage('Error de red actualizando permisos.');
            setMessageType('error');
        } finally {
            setSaving(false);
        }
    };

    const togglePermission = (permissionKey: string) => {
        setSelectedPermissions((prev) => (
            prev.includes(permissionKey)
                ? prev.filter((key) => key !== permissionKey)
                : [...prev, permissionKey]
        ));
    };

    const applyTemplate = (role: string) => {
        setPermissionRole(role);
        setSelectedPermissions(ROLE_PERMISSION_TEMPLATES[role] || []);
    };

    const filteredUsers = users.filter((user) => {
        if (roleFilter === 'ALL') return true;
        return user.role?.name === roleFilter;
    });

    const adminUsersCount = users.filter((user) => user.role?.name === 'ADMIN').length;

    const currentRolePermissions = useMemo(() => {
        return permissionsView.find((row) => row.name === permissionRole)?.permissions || [];
    }, [permissionsView, permissionRole]);

    const addedPermissions = useMemo(() => {
        return selectedPermissions.filter((permission) => !currentRolePermissions.includes(permission));
    }, [selectedPermissions, currentRolePermissions]);

    const removedPermissions = useMemo(() => {
        return currentRolePermissions.filter((permission) => !selectedPermissions.includes(permission));
    }, [currentRolePermissions, selectedPermissions]);

    if (loading) {
        return <div className="p-6">Cargando admin tenant...</div>;
    }

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Admin Tenant</h1>
                    <p className="text-slate-600">Gestión de usuarios, permisos y configuración del laboratorio.</p>
                </div>
                <button
                    type="button"
                    disabled={loading || saving}
                    onClick={loadData}
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

            <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StatCard label="Usuarios totales" value={users.length} />
                <StatCard label="Usuarios ADMIN" value={adminUsersCount} />
                <StatCard label="Plan activo" value={planStatus?.plan?.code || '-'} />
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h2 className="font-semibold mb-2">Estado del plan</h2>
                    <p className="text-sm text-slate-700">Estado: <strong>{planStatus?.status || '-'}</strong></p>
                    <p className="text-sm text-slate-700">Plan: <strong>{planStatus?.plan?.code || '-'}</strong></p>
                    <p className="text-xs text-slate-500">{planStatus?.plan?.name || 'Sin nombre de plan disponible'}</p>
                </div>

                <form className="rounded-xl border border-slate-200 bg-white p-4 space-y-2" onSubmit={handleSaveSettings}>
                    <h2 className="font-semibold mb-2">Configuración del laboratorio</h2>
                    <input
                        className="w-full border rounded px-3 py-2"
                        placeholder="Nombre"
                        value={settings.name || ''}
                        onChange={(e) => setSettings((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    <input
                        className="w-full border rounded px-3 py-2"
                        placeholder="Email de contacto"
                        value={settings.contactEmail || ''}
                        onChange={(e) => setSettings((prev) => ({ ...prev, contactEmail: e.target.value }))}
                    />
                    <input
                        className="w-full border rounded px-3 py-2"
                        placeholder="Teléfono soporte"
                        value={settings.supportPhone || ''}
                        onChange={(e) => setSettings((prev) => ({ ...prev, supportPhone: e.target.value }))}
                    />
                    <input
                        className="w-full border rounded px-3 py-2"
                        placeholder="Dirección"
                        value={settings.address || ''}
                        onChange={(e) => setSettings((prev) => ({ ...prev, address: e.target.value }))}
                    />
                    <button className="rounded bg-blue-600 text-white px-4 py-2" disabled={saving} type="submit">
                        Guardar cambios
                    </button>
                </form>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="font-semibold mb-3">Crear usuario</h2>
                <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={handleCreateUser}>
                    <input className="border rounded px-3 py-2" placeholder="DNI" value={newUser.dni} onChange={(e) => setNewUser((p) => ({ ...p, dni: e.target.value }))} />
                    <input className="border rounded px-3 py-2" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} />
                    <input className="border rounded px-3 py-2" placeholder="Contraseña" type="password" value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} />
                    <select className="border rounded px-3 py-2" value={newUser.roleName} onChange={(e) => setNewUser((p) => ({ ...p, roleName: e.target.value }))}>
                        {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                    <input className="border rounded px-3 py-2" placeholder="Nombre" value={newUser.firstName} onChange={(e) => setNewUser((p) => ({ ...p, firstName: e.target.value }))} />
                    <input className="border rounded px-3 py-2" placeholder="Apellido" value={newUser.lastName} onChange={(e) => setNewUser((p) => ({ ...p, lastName: e.target.value }))} />
                    <input className="border rounded px-3 py-2" placeholder="Matrícula (opcional)" value={newUser.license} onChange={(e) => setNewUser((p) => ({ ...p, license: e.target.value }))} />
                    <button className="rounded bg-emerald-600 text-white px-4 py-2" disabled={saving} type="submit">Crear</button>
                </form>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
                <div className="flex items-center justify-between px-3 py-3 border-b border-slate-200">
                    <h2 className="font-semibold">Usuarios del tenant</h2>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                    >
                        <option value="ALL">Todos los roles</option>
                        {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                        <tr>
                            <th className="text-left p-3">Usuario</th>
                            <th className="text-left p-3">DNI</th>
                            <th className="text-left p-3">Email</th>
                            <th className="text-left p-3">Rol</th>
                            <th className="text-left p-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td className="p-6 text-center text-slate-500" colSpan={5}>
                                    No hay usuarios para el filtro seleccionado.
                                </td>
                            </tr>
                        )}
                        {filteredUsers.map((user) => {
                            const fullName = `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || '-';
                            return (
                                <tr key={user.id} className="border-t">
                                    <td className="p-3">{fullName}</td>
                                    <td className="p-3">{user.dni}</td>
                                    <td className="p-3">{user.email || '-'}</td>
                                    <td className="p-3">{user.role?.name || '-'}</td>
                                    <td className="p-3">
                                        <button className="rounded border px-2 py-1 text-red-700" onClick={() => handleDeleteUser(user.id)} disabled={saving}>
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="font-semibold mb-2">Permisos por rol</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {permissionsView.map((row) => (
                        <div key={row.name} className="border rounded p-3">
                            <p className="font-medium">{row.name}</p>
                            <p className="text-xs text-slate-600 mt-2 wrap-break-word">
                                {row.permissions.length > 0
                                    ? row.permissions.map((permission) => getPermissionLabel(permission)).join(', ')
                                    : 'Sin funciones asignadas'}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {ROLE_OPTIONS.map((role) => (
                        <button
                            key={role}
                            type="button"
                            onClick={() => applyTemplate(role)}
                            className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Aplicar plantilla {role}
                        </button>
                    ))}
                </div>

                <form className="mt-4 space-y-4" onSubmit={handleUpdatePermissions}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                        <label className="text-sm font-medium text-slate-700">Rol a configurar</label>
                        <select
                            className="border rounded px-3 py-2 md:col-span-2"
                            value={permissionRole}
                            onChange={(e) => setPermissionRole(e.target.value)}
                        >
                            {ROLE_OPTIONS.map((role) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-3">

                        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                            <p>
                                Resumen de impacto: <strong>{addedPermissions.length}</strong> funciones nuevas, <strong>{removedPermissions.length}</strong> funciones removidas.
                            </p>
                            {permissionRole === 'ADMIN' && (
                                <p className="mt-1">
                                    Seguridad: ADMIN debe conservar Ver usuarios, Administrar permisos y Editar configuracion del laboratorio.
                                </p>
                            )}
                        </div>
                        {PERMISSION_GROUPS.map((group) => {
                            const groupedPermissions = PERMISSION_DEFINITIONS.filter((permission) => permission.group === group);
                            return (
                                <div key={group} className="rounded border border-slate-200 p-3">
                                    <p className="text-sm font-semibold text-slate-800 mb-2">{group}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {groupedPermissions.map((permission) => {
                                            const isChecked = selectedPermissions.includes(permission.key);
                                            return (
                                                <label key={permission.key} className="flex items-start gap-2 rounded border border-slate-200 p-2 cursor-pointer hover:bg-slate-50">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => togglePermission(permission.key)}
                                                        className="mt-1 h-4 w-4"
                                                    />
                                                    <span>
                                                        <span className="block text-sm font-medium text-slate-800">{permission.label}</span>
                                                        <span className="block text-xs text-slate-500">{permission.description}</span>
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <p className="text-xs text-slate-500">
                            Funciones seleccionadas: <strong>{selectedPermissions.length}</strong>
                        </p>
                        <button type="submit" disabled={saving} className="rounded bg-indigo-600 text-white px-4 py-2 disabled:opacity-60">
                            Guardar funciones del rol
                        </button>
                    </div>
                </form>
                <p className="text-xs text-slate-500 mt-2">Este cambio reemplaza las funciones actuales del rol seleccionado.</p>
            </section>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
            <p className="text-2xl font-semibold text-slate-900">{value}</p>
        </div>
    );
}
