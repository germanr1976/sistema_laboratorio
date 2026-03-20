"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import authFetch from '../../../utils/authFetch';

type TenantUser = {
    id: number;
    dni: string;
    email?: string | null;
    license?: string | null;
    role?: { name: string };
    profile?: {
        firstName?: string;
        lastName?: string;
    } | null;
};

type EditableRole = (typeof ROLE_OPTIONS)[number];

type EditUserFormState = {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    roleName: EditableRole;
    license: string;
    password: string;
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

type TenantAuditEventRow = {
    id: number;
    eventType: string;
    actorUserId?: number | null;
    targetUserId?: number | null;
    requestId?: string | null;
    createdAt: string;
    actorUser?: {
        id: number;
        dni: string;
        email?: string | null;
    } | null;
    targetUser?: {
        id: number;
        dni: string;
        email?: string | null;
    } | null;
};

type TenantAuditPagination = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

type TenantAdminSection = 'laboratorio' | 'usuarios' | 'permisos' | 'auditoria';

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

const TENANT_AUDIT_EVENT_TYPES = [
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
    'PERMISSION_CHANGED',
] as const;

const AUDIT_EVENT_LABELS: Record<string, string> = {
    LOGIN_SUCCESS: 'Inicio de sesión exitoso',
    LOGIN_FAILED: 'Inicio de sesión fallido',
    STUDY_CREATED: 'Estudio creado',
    STUDY_STATUS_CHANGED: 'Estado de estudio modificado',
    STUDY_EDITED: 'Estudio editado',
    STUDY_DOWNLOADED: 'Estudio descargado',
    ROLE_CHANGED: 'Rol modificado',
    TENANT_SUSPENDED: 'Laboratorio suspendido',
    USER_CREATED: 'Usuario creado',
    USER_UPDATED: 'Usuario actualizado',
    USER_DELETED: 'Usuario eliminado',
    TENANT_SETTINGS_UPDATED: 'Configuración del laboratorio actualizada',
    PERMISSION_CHANGED: 'Permiso modificado',
};

function getAuditEventLabel(eventType: string): string {
    return AUDIT_EVENT_LABELS[eventType] ?? eventType;
}

function getPermissionLabel(permissionKey: string): string {
    return PERMISSION_DEFINITIONS.find((permission) => permission.key === permissionKey)?.label || permissionKey;
}

function getApiBase() {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}

function formatAuditDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('es-AR');
}

export default function TenantAdminPage() {
    const USERS_PER_PAGE = 10;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

    const [users, setUsers] = useState<TenantUser[]>([]);
    const [settings, setSettings] = useState<TenantSettings>({});
    const [planStatus, setPlanStatus] = useState<PlanStatus | null>(null);
    const [permissionsView, setPermissionsView] = useState<Array<{ name: string; permissions: string[] }>>([]);
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [usersPage, setUsersPage] = useState(1);
    const [permissionRole, setPermissionRole] = useState<string>('ADMIN');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(ROLE_PERMISSION_TEMPLATES.ADMIN);
    const [activeSection, setActiveSection] = useState<TenantAdminSection>('laboratorio');
    const [auditLoading, setAuditLoading] = useState(false);
    const [auditRows, setAuditRows] = useState<TenantAuditEventRow[]>([]);
    const [auditPagination, setAuditPagination] = useState<TenantAuditPagination>({ total: 0, page: 1, limit: 10, totalPages: 0 });
    const [auditMessage, setAuditMessage] = useState('');
    const [auditMessageType, setAuditMessageType] = useState<'success' | 'error' | 'info'>('info');
    const [auditEventType, setAuditEventType] = useState('');
    const [auditActorUserId, setAuditActorUserId] = useState('');
    const [auditRequestId, setAuditRequestId] = useState('');
    const [auditDateFrom, setAuditDateFrom] = useState('');
    const [auditDateTo, setAuditDateTo] = useState('');

    const [newUser, setNewUser] = useState({
        dni: '',
        email: '',
        password: '',
        roleName: 'BIOCHEMIST',
        firstName: '',
        lastName: '',
        license: '',
    });
    const [editUser, setEditUser] = useState<EditUserFormState | null>(null);

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

    const fetchTenantAudit = async (page = 1) => {
        setAuditLoading(true);
        setAuditMessageType('info');
        try {
            const query = new URLSearchParams();
            query.set('page', String(page));
            query.set('limit', String(auditPagination.limit));
            if (auditEventType) query.set('eventType', auditEventType);
            if (auditActorUserId.trim()) query.set('actorUserId', auditActorUserId.trim());
            if (auditRequestId.trim()) query.set('requestId', auditRequestId.trim());
            if (auditDateFrom) query.set('dateFrom', auditDateFrom);
            if (auditDateTo) query.set('dateTo', auditDateTo);

            const response = await authFetch(`${apiBase}/api/audit?${query.toString()}`);
            const json = await response.json().catch(() => ({}));
            if (!response.ok) {
                setAuditMessage(json?.message || 'No se pudo obtener auditoría del tenant.');
                setAuditMessageType('error');
                return;
            }

            setAuditRows(Array.isArray(json?.data) ? json.data : []);
            setAuditPagination(json?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
            setAuditMessage('Auditoría actualizada.');
            setAuditMessageType('success');
        } catch (error) {
            console.error(error);
            setAuditMessage('Error de red consultando auditoría del tenant.');
            setAuditMessageType('error');
        } finally {
            setAuditLoading(false);
        }
    };

    useEffect(() => {
        fetchTenantAudit(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBase]);

    const handleAuditSearch = async (e: FormEvent) => {
        e.preventDefault();
        await fetchTenantAudit(1);
    };

    const handleCreateUser = async (e: FormEvent) => {
        e.preventDefault();
        if (!newUser.dni || !newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
            setMessage('Completa todos los campos obligatorios para crear usuario.');
            setMessageType('error');
            return;
        }

        const payload = {
            ...newUser,
            license: newUser.roleName === 'BIOCHEMIST' ? newUser.license : '',
        };

        setSaving(true);
        setMessage('');

        try {
            const response = await authFetch(`${apiBase}/api/tenant-admin/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
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

    const handleStartEditUser = (user: TenantUser) => {
        const roleName = String(user.role?.name || '').toUpperCase();
        if (!ROLE_OPTIONS.includes(roleName as EditableRole)) {
            setMessage('Este rol no es gestionable desde admin tenant.');
            setMessageType('error');
            return;
        }

        setEditUser({
            id: user.id,
            email: user.email || '',
            firstName: user.profile?.firstName || '',
            lastName: user.profile?.lastName || '',
            roleName: roleName as EditableRole,
            license: user.license || '',
            password: '',
        });
        setMessage('');
    };

    const handleCancelEditUser = () => {
        setEditUser(null);
    };

    const handleUpdateUser = async (e: FormEvent) => {
        e.preventDefault();
        if (!editUser) return;

        if (!editUser.email || !editUser.firstName || !editUser.lastName) {
            setMessage('Email, nombre y apellido son obligatorios para editar usuario.');
            setMessageType('error');
            return;
        }

        const payload: {
            email: string;
            firstName: string;
            lastName: string;
            roleName: EditableRole;
            license: string;
            password?: string;
        } = {
            email: editUser.email,
            firstName: editUser.firstName,
            lastName: editUser.lastName,
            roleName: editUser.roleName,
            license: editUser.roleName === 'BIOCHEMIST' ? editUser.license : '',
        };

        if (editUser.password.trim()) {
            payload.password = editUser.password.trim();
        }

        setSaving(true);
        setMessage('');
        try {
            const response = await authFetch(`${apiBase}/api/tenant-admin/users/${editUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const json = await response.json().catch(() => ({}));
            if (!response.ok) {
                setMessage(json?.message || 'No se pudo actualizar usuario.');
                setMessageType('error');
                return;
            }

            setMessage('Usuario actualizado correctamente.');
            setMessageType('success');
            setEditUser(null);
            await loadData();
        } catch (error) {
            console.error(error);
            setMessage('Error de red actualizando usuario.');
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

    const tenantScopedUsers = useMemo(() => {
        return users.filter((user) => ROLE_OPTIONS.includes((user.role?.name || '').toUpperCase() as EditableRole));
    }, [users]);

    const filteredUsers = tenantScopedUsers.filter((user) => {
        if (roleFilter === 'ALL') return true;
        return user.role?.name === roleFilter;
    });

    const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
    const safeUsersPage = Math.min(usersPage, totalUserPages);
    const paginatedUsers = filteredUsers.slice((safeUsersPage - 1) * USERS_PER_PAGE, safeUsersPage * USERS_PER_PAGE);

    const adminUsersCount = tenantScopedUsers.filter((user) => user.role?.name === 'ADMIN').length;

    const currentRolePermissions = useMemo(() => {
        return permissionsView.find((row) => row.name === permissionRole)?.permissions || [];
    }, [permissionsView, permissionRole]);

    const tenantPermissionsView = useMemo(() => {
        return permissionsView.filter((row) => ROLE_OPTIONS.includes(row.name as (typeof ROLE_OPTIONS)[number]));
    }, [permissionsView]);

    const addedPermissions = useMemo(() => {
        return selectedPermissions.filter((permission) => !currentRolePermissions.includes(permission));
    }, [selectedPermissions, currentRolePermissions]);

    const removedPermissions = useMemo(() => {
        return currentRolePermissions.filter((permission) => !selectedPermissions.includes(permission));
    }, [currentRolePermissions, selectedPermissions]);

    useEffect(() => {
        setUsersPage(1);
    }, [roleFilter, users.length]);

    useEffect(() => {
        setEditUser(null);
    }, [activeSection]);

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

            <section className="rounded-xl border border-slate-200 bg-white p-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveSection('laboratorio')}
                        className={`rounded-lg px-3 py-3 text-left ${activeSection === 'laboratorio' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                        <span className="block text-sm font-semibold">Laboratorio</span>
                        <span className={`block text-xs mt-0.5 ${activeSection === 'laboratorio' ? 'text-blue-100' : 'text-slate-500'}`}>Configuración y estado</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection('usuarios')}
                        className={`rounded-lg px-3 py-3 text-left ${activeSection === 'usuarios' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                        <span className="block text-sm font-semibold">Usuarios</span>
                        <span className={`block text-xs mt-0.5 ${activeSection === 'usuarios' ? 'text-blue-100' : 'text-slate-500'}`}>Alta, baja y edición de personal</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection('permisos')}
                        className={`rounded-lg px-3 py-3 text-left ${activeSection === 'permisos' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                        <span className="block text-sm font-semibold">Permisos</span>
                        <span className={`block text-xs mt-0.5 ${activeSection === 'permisos' ? 'text-blue-100' : 'text-slate-500'}`}>Qué puede hacer cada rol</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection('auditoria')}
                        className={`rounded-lg px-3 py-3 text-left ${activeSection === 'auditoria' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                        <span className="block text-sm font-semibold">Auditoría</span>
                        <span className={`block text-xs mt-0.5 ${activeSection === 'auditoria' ? 'text-blue-100' : 'text-slate-500'}`}>Registro de actividad</span>
                    </button>
                </div>
            </section>

            {activeSection === 'laboratorio' && (
                <>
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <StatCard label="Usuarios totales" value={tenantScopedUsers.length} />
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
                </>
            )}

            {activeSection === 'usuarios' && (
                <>
                    <section className="rounded-xl border border-slate-200 bg-white p-4">
                        <h2 className="font-semibold mb-3">Crear usuario</h2>
                        <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={handleCreateUser}>
                            <input className="border rounded px-3 py-2" placeholder="DNI" value={newUser.dni} onChange={(e) => setNewUser((p) => ({ ...p, dni: e.target.value }))} />
                            <input className="border rounded px-3 py-2" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} />
                            <input className="border rounded px-3 py-2" placeholder="Contraseña" type="password" value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} />
                            <select
                                className="border rounded px-3 py-2"
                                value={newUser.roleName}
                                onChange={(e) => {
                                    const roleName = e.target.value as EditableRole;
                                    setNewUser((p) => ({ ...p, roleName, license: roleName === 'BIOCHEMIST' ? p.license : '' }));
                                }}
                            >
                                {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
                            </select>
                            <input className="border rounded px-3 py-2" placeholder="Nombre" value={newUser.firstName} onChange={(e) => setNewUser((p) => ({ ...p, firstName: e.target.value }))} />
                            <input className="border rounded px-3 py-2" placeholder="Apellido" value={newUser.lastName} onChange={(e) => setNewUser((p) => ({ ...p, lastName: e.target.value }))} />
                            {newUser.roleName === 'BIOCHEMIST' && (
                                <input
                                    className="border rounded px-3 py-2"
                                    placeholder="Matrícula (opcional)"
                                    value={newUser.license}
                                    onChange={(e) => setNewUser((p) => ({ ...p, license: e.target.value }))}
                                />
                            )}
                            <button className="rounded bg-emerald-600 text-white px-4 py-2" disabled={saving} type="submit">Crear</button>
                        </form>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
                        <div className="flex items-center justify-between px-3 py-3 border-b border-slate-200">
                            <h2 className="font-semibold">Usuarios del tenant</h2>
                            <select
                                value={roleFilter}
                                onChange={(e) => {
                                    setRoleFilter(e.target.value);
                                    setUsersPage(1);
                                }}
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
                                {paginatedUsers.length === 0 && (
                                    <tr>
                                        <td className="p-6 text-center text-slate-500" colSpan={5}>
                                            No hay usuarios para el filtro seleccionado.
                                        </td>
                                    </tr>
                                )}
                                {paginatedUsers.map((user) => {
                                    const fullName = `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || '-';
                                    return (
                                        <tr key={user.id} className="border-t">
                                            <td className="p-3">{fullName}</td>
                                            <td className="p-3">{user.dni}</td>
                                            <td className="p-3">{user.email || '-'}</td>
                                            <td className="p-3">{user.role?.name || '-'}</td>
                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        className="rounded border border-blue-300 px-2 py-1 text-blue-700 disabled:opacity-50"
                                                        onClick={() => handleStartEditUser(user)}
                                                        disabled={saving || !ROLE_OPTIONS.includes((user.role?.name || '').toUpperCase() as EditableRole)}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button className="rounded border px-2 py-1 text-red-700" onClick={() => handleDeleteUser(user.id)} disabled={saving}>
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div className="flex flex-col gap-2 border-t border-slate-200 px-3 py-3 md:flex-row md:items-center md:justify-between">
                            <p className="text-xs text-slate-600">
                                Mostrando {filteredUsers.length === 0 ? 0 : (safeUsersPage - 1) * USERS_PER_PAGE + 1}
                                {' '}-{' '}
                                {Math.min(safeUsersPage * USERS_PER_PAGE, filteredUsers.length)}
                                {' '}de {filteredUsers.length} usuarios
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                                    onClick={() => setUsersPage((prev) => Math.max(1, prev - 1))}
                                    disabled={safeUsersPage <= 1}
                                >
                                    Anterior
                                </button>
                                <span className="text-sm text-slate-700">
                                    Página {safeUsersPage} de {totalUserPages}
                                </span>
                                <button
                                    type="button"
                                    className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                                    onClick={() => setUsersPage((prev) => Math.min(totalUserPages, prev + 1))}
                                    disabled={safeUsersPage >= totalUserPages}
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    </section>
                </>
            )}

            {activeSection === 'permisos' && (
                <section className="rounded-xl border border-slate-200 bg-white p-4">
                    <h2 className="font-semibold mb-2">Permisos por rol</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {tenantPermissionsView.map((row) => (
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
            )}

            {activeSection === 'auditoria' && (
                <section className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h2 className="font-semibold">Auditoría del tenant</h2>
                        <button
                            type="button"
                            onClick={() => fetchTenantAudit(auditPagination.page || 1)}
                            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700"
                        >
                            Refrescar auditoría
                        </button>
                    </div>

                    <form onSubmit={handleAuditSearch} className="mb-4 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
                        <select className="border rounded px-3 py-2" value={auditEventType} onChange={(e) => setAuditEventType(e.target.value)}>
                            <option value="">Todos los eventos</option>
                            {TENANT_AUDIT_EVENT_TYPES.map((event) => (
                                <option key={event} value={event}>{getAuditEventLabel(event)}</option>
                            ))}
                        </select>
                        <input
                            className="border rounded px-3 py-2"
                            placeholder="Actor User ID"
                            value={auditActorUserId}
                            onChange={(e) => setAuditActorUserId(e.target.value.replace(/\D/g, ''))}
                        />
                        <input
                            className="border rounded px-3 py-2"
                            placeholder="Request ID"
                            value={auditRequestId}
                            onChange={(e) => setAuditRequestId(e.target.value)}
                        />
                        <input className="border rounded px-3 py-2" type="date" value={auditDateFrom} onChange={(e) => setAuditDateFrom(e.target.value)} />
                        <input className="border rounded px-3 py-2" type="date" value={auditDateTo} onChange={(e) => setAuditDateTo(e.target.value)} />
                        <button type="submit" className="rounded bg-blue-600 text-white px-4 py-2">Aplicar filtros</button>
                    </form>

                    {auditMessage && (
                        <div className={`mb-3 rounded border p-3 text-sm ${auditMessageType === 'error' ? 'border-red-200 bg-red-50 text-red-700' : auditMessageType === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-700'}`}>
                            {auditMessage}
                        </div>
                    )}

                    <div className="overflow-x-auto rounded border border-slate-200">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100 text-slate-700">
                                <tr>
                                    <th className="text-left p-3">Fecha</th>
                                    <th className="text-left p-3">Evento</th>
                                    <th className="text-left p-3">Actor</th>
                                    <th className="text-left p-3">Afectado</th>
                                    <th className="text-left p-3">Request ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLoading && (
                                    <tr>
                                        <td className="p-6 text-center text-slate-500" colSpan={5}>Cargando auditoría...</td>
                                    </tr>
                                )}
                                {!auditLoading && auditRows.length === 0 && (
                                    <tr>
                                        <td className="p-6 text-center text-slate-500" colSpan={5}>No hay eventos para los filtros aplicados.</td>
                                    </tr>
                                )}
                                {!auditLoading && auditRows.map((row) => (
                                    <tr key={row.id} className="border-t">
                                        <td className="p-3">{formatAuditDate(row.createdAt)}</td>
                                        <td className="p-3 font-medium">{getAuditEventLabel(row.eventType)}</td>
                                        <td className="p-3">{row.actorUser ? `${row.actorUser.id} · ${row.actorUser.dni}` : row.actorUserId || '-'}</td>
                                        <td className="p-3">{row.targetUser ? `${row.targetUser.id} · ${row.targetUser.dni}` : row.targetUserId || '-'}</td>
                                        <td className="p-3">{row.requestId || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                        <p>Total eventos: {auditPagination.total}</p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={auditPagination.page <= 1 || auditLoading}
                                onClick={() => fetchTenantAudit(auditPagination.page - 1)}
                                className="rounded border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <span>Página {auditPagination.page} de {Math.max(auditPagination.totalPages, 1)}</span>
                            <button
                                type="button"
                                disabled={auditPagination.page >= auditPagination.totalPages || auditLoading || auditPagination.totalPages === 0}
                                onClick={() => fetchTenantAudit(auditPagination.page + 1)}
                                className="rounded border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {editUser && activeSection === 'usuarios' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={handleCancelEditUser}>
                    <section
                        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 md:p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-semibold text-lg">Editar usuario</h2>
                            <button
                                type="button"
                                className="rounded border border-slate-300 px-3 py-1.5 text-sm"
                                onClick={handleCancelEditUser}
                                disabled={saving}
                            >
                                Cerrar
                            </button>
                        </div>

                        <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={handleUpdateUser}>
                            <input
                                className="border rounded px-3 py-2"
                                placeholder="Nombre"
                                value={editUser.firstName}
                                onChange={(e) => setEditUser((prev) => prev ? { ...prev, firstName: e.target.value } : prev)}
                            />
                            <input
                                className="border rounded px-3 py-2"
                                placeholder="Apellido"
                                value={editUser.lastName}
                                onChange={(e) => setEditUser((prev) => prev ? { ...prev, lastName: e.target.value } : prev)}
                            />
                            <input
                                className="border rounded px-3 py-2"
                                placeholder="Email"
                                value={editUser.email}
                                onChange={(e) => setEditUser((prev) => prev ? { ...prev, email: e.target.value } : prev)}
                            />
                            <select
                                className="border rounded px-3 py-2"
                                value={editUser.roleName}
                                onChange={(e) => {
                                    const roleName = e.target.value as EditableRole;
                                    setEditUser((prev) => prev ? { ...prev, roleName, license: roleName === 'BIOCHEMIST' ? prev.license : '' } : prev);
                                }}
                            >
                                {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
                            </select>

                            {editUser.roleName === 'BIOCHEMIST' && (
                                <input
                                    className="border rounded px-3 py-2"
                                    placeholder="Matrícula (opcional)"
                                    value={editUser.license}
                                    onChange={(e) => setEditUser((prev) => prev ? { ...prev, license: e.target.value } : prev)}
                                />
                            )}

                            <input
                                className="border rounded px-3 py-2"
                                type="password"
                                placeholder="Nueva contraseña (opcional)"
                                value={editUser.password}
                                onChange={(e) => setEditUser((prev) => prev ? { ...prev, password: e.target.value } : prev)}
                            />

                            <div className="flex gap-2 md:col-span-2 mt-2">
                                <button className="rounded bg-blue-600 text-white px-4 py-2" disabled={saving} type="submit">
                                    Guardar edición
                                </button>
                                <button
                                    className="rounded border border-slate-300 px-4 py-2"
                                    type="button"
                                    onClick={handleCancelEditUser}
                                    disabled={saving}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
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
