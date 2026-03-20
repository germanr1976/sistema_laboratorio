export const TENANT_PERMISSION_KEYS = {
    USERS_READ: 'tenant.users.read',
    USERS_WRITE: 'tenant.users.write',
    USERS_DELETE: 'tenant.users.delete',
    SETTINGS_READ: 'tenant.settings.read',
    SETTINGS_WRITE: 'tenant.settings.write',
    PLAN_READ: 'tenant.plan.read',
    ROLE_PERMISSIONS_READ: 'tenant.permissions.read',
    ROLE_PERMISSIONS_WRITE: 'tenant.permissions.write',
    STUDIES_CREATE: 'tenant.studies.create',
    STUDIES_READ_ASSIGNED: 'tenant.studies.read.assigned',
    STUDIES_PATIENT_LOOKUP: 'tenant.studies.patient.lookup',
    STUDIES_UPDATE: 'tenant.studies.update',
    STUDIES_STATUS_UPDATE: 'tenant.studies.status.update',
    STUDIES_ATTACHMENTS_DELETE: 'tenant.studies.attachments.delete',
    STUDIES_CANCEL: 'tenant.studies.cancel',
    STUDY_REQUESTS_READ: 'tenant.studyRequests.read',
    STUDY_REQUESTS_VALIDATE: 'tenant.studyRequests.validate',
    STUDY_REQUESTS_REJECT: 'tenant.studyRequests.reject',
    STUDY_REQUESTS_CONVERT: 'tenant.studyRequests.convert',
} as const;

export const ALL_TENANT_PERMISSION_KEYS = Object.values(TENANT_PERMISSION_KEYS);

export const BIOCHEMIST_DEFAULT_PERMISSION_KEYS = [
    TENANT_PERMISSION_KEYS.STUDIES_CREATE,
    TENANT_PERMISSION_KEYS.STUDIES_READ_ASSIGNED,
    TENANT_PERMISSION_KEYS.STUDIES_PATIENT_LOOKUP,
    TENANT_PERMISSION_KEYS.STUDIES_UPDATE,
    TENANT_PERMISSION_KEYS.STUDIES_STATUS_UPDATE,
    TENANT_PERMISSION_KEYS.STUDIES_ATTACHMENTS_DELETE,
    TENANT_PERMISSION_KEYS.STUDIES_CANCEL,
    TENANT_PERMISSION_KEYS.STUDY_REQUESTS_READ,
    TENANT_PERMISSION_KEYS.STUDY_REQUESTS_VALIDATE,
    TENANT_PERMISSION_KEYS.STUDY_REQUESTS_REJECT,
    TENANT_PERMISSION_KEYS.STUDY_REQUESTS_CONVERT,
] as const;

export const PLATFORM_PERMISSION_KEYS = {
    TENANTS_CREATE: 'platform.tenants.create',
    TENANTS_UPDATE: 'platform.tenants.update',
    TENANTS_DELETE: 'platform.tenants.delete',
    TENANT_ADMINS_CREATE: 'platform.tenants.admins.create',
    TENANTS_SUSPEND: 'platform.tenants.suspend',
    TENANTS_PLAN_ASSIGN: 'platform.tenants.plan.assign',
} as const;

export const ALL_PLATFORM_PERMISSION_KEYS = Object.values(PLATFORM_PERMISSION_KEYS);
