interface User {
  id: number;
  role: {
    name: string;
  };
}

interface Study {
  id: number;
  userId: number;
  biochemistId: number | null;
}

export class PermissionHelper {
  /**
   * Verifica si el usuario puede ver un estudio específico
   */
  static canViewStudy(user: User, study: Study): boolean {
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
  static canUpdateStudy(user: User, study: Study): boolean {
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
  static isBiochemist(user: User): boolean {
    return user.role.name === "BIOCHEMIST";
  }

  /**
   * Verifica si el usuario es un administrador
   */
  static isAdmin(user: User): boolean {
    return user.role.name === "ADMIN";
  }

  /**
   * Verifica si el usuario es un paciente
   */
  static isPatient(user: User): boolean {
    return user.role.name === "PATIENT";
  }
}
