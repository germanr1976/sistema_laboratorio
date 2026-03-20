type StudyAccessUser = {
    id: number;
    role?: {
        name?: string;
    };
};

type StudyAccessStudy = {
    userId: number;
    biochemistId: number | null;
};

export function canAccessStudy(
    user: StudyAccessUser | null | undefined,
    study: StudyAccessStudy
): boolean {
    if (!user) {
        return false;
    }

    const roleName = user.role?.name;

    if (roleName === 'ADMIN') {
        return true;
    }

    if (study.userId === user.id) {
        return true;
    }

    if (roleName === 'BIOCHEMIST') {
        return study.biochemistId == null || study.biochemistId === user.id;
    }

    return false;
}
