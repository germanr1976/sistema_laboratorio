"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionHelper = void 0;
class PermissionHelper {
    /**
     * Verifica si el usuario puede ver un estudio específico
     */
    static canViewStudy(user, study) {
        const { role, id: userId } = user;
        // Admin puede ver todo
        if (role.name === "ADMIN") {
            return true;
        }
        // Bioquímico puede ver sus estudios asignados
        if (role.name === "BIOCHEMIST" && study.biochemistId === userId) {
            return true;
        }
        // Paciente puede ver sus propios estudios
        if (role.name === "PATIENT" && study.userId === userId) {
            return true;
        }
        return false;
    }
    /**
     * Verifica si el usuario puede actualizar un estudio
     */
    static canUpdateStudy(user, study) {
        const { role, id: userId } = user;
        // Admin puede actualizar todo
        if (role.name === "ADMIN") {
            return true;
        }
        // Bioquímico solo puede actualizar sus estudios asignados
        if (role.name === "BIOCHEMIST" && study.biochemistId === userId) {
            return true;
        }
        return false;
    }
    /**
     * Verifica si el usuario es un bioquímico
     */
    static isBiochemist(user) {
        return user.role.name === "BIOCHEMIST";
    }
    /**
     * Verifica si el usuario es un administrador
     */
    static isAdmin(user) {
        return user.role.name === "ADMIN";
    }
    /**
     * Verifica si el usuario es un paciente
     */
    static isPatient(user) {
        return user.role.name === "PATIENT";
    }
}
exports.PermissionHelper = PermissionHelper;
//# sourceMappingURL=permission.helper.js.map