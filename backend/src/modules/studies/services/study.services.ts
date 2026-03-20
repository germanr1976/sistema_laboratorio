import prisma from "@/config/prisma";

interface CreateStudyData {
  tenantId: number;
  userId: number;
  studyName: string;
  studyDate?: Date | null;
  socialInsurance?: string | null;
  doctor?: string | null;
  statusId: number;
  pdfUrl?: string | undefined;
  biochemistId?: number | undefined;
}

interface UpdateStudyStatusData {
  statusId: number;
}

interface UpdateStudyPdfData {
  pdfUrl: string;
}

export const createStudy = async (data: CreateStudyData) => {
  const payload: any = {
    tenantId: data.tenantId,
    userId: data.userId,
    studyName: data.studyName,
    socialInsurance: data.socialInsurance || null,
    doctor: data.doctor || null,
    statusId: data.statusId,
    pdfUrl: data.pdfUrl || null,
    biochemistId: data.biochemistId || null,
  };
  if (data.studyDate !== undefined && data.studyDate !== null) {
    payload.studyDate = data.studyDate;
  }
  return await prisma.study.create({
    data: payload,
    include: {
      patient: {
        include: {
          profile: true,
        },
      },
      biochemist: {
        include: {
          profile: true,
        },
      },
      status: true,
      attachments: true,
    },
  });
};

export const getStudiesByBiochemist = async (biochemistId: number, tenantId: number) => {
  return await prisma.study.findMany({
    where: {
      biochemistId,
      tenantId,
    },
    include: {
      patient: { include: { profile: true } },
      biochemist: { include: { profile: true } },
      status: true,
      attachments: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getAllStudies = async (tenantId: number) => {
  return await prisma.study.findMany({
    where: {
      tenantId,
    },
    include: {
      patient: { include: { profile: true } },
      biochemist: { include: { profile: true } },
      status: true,
      attachments: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getStudyById = async (studyId: number, tenantId: number) => {
  return await prisma.study.findFirst({
    where: {
      id: studyId,
      tenantId,
    },
    include: {
      patient: { include: { profile: true } },
      biochemist: { include: { profile: true } },
      status: true,
      attachments: true,
    },
  });
};

export const updateStudyStatus = async (
  studyId: number,
  tenantId: number,
  data: UpdateStudyStatusData
) => {
  const existing = await prisma.study.findFirst({
    where: {
      id: studyId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  return await prisma.study.update({
    where: {
      id: existing.id,
    },
    data: {
      statusId: data.statusId,
    },
    include: {
      patient: { include: { profile: true } },
      biochemist: { include: { profile: true } },
      status: true,
      attachments: true,
    },
  });
};

export const updateStudyPdfUrl = async (
  studyId: number,
  tenantId: number,
  data: UpdateStudyPdfData
) => {
  const existing = await prisma.study.findFirst({
    where: {
      id: studyId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  return await prisma.study.update({
    where: { id: existing.id },
    data: { pdfUrl: data.pdfUrl },
    include: {
      patient: { include: { profile: true } },
      biochemist: { include: { profile: true } },
      status: true,
      attachments: true,
    },
  });
};

export const addStudyAttachments = async (
  studyId: number,
  tenantId: number,
  files: { url: string; filename?: string }[]
) => {
  if (files.length === 0) return { count: 0 };
  return await prisma.studyAttachment.createMany({
    data: files.map((f) => ({ tenantId, studyId, url: f.url, filename: f.filename || null })),
  });
};

export const getStudiesByPatient = async (
  userId: number,
  tenantId: number,
  page = 1,
  limit = 10
) => {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 10;
  const skip = (safePage - 1) * safeLimit;

  const [items, total, grouped] = await prisma.$transaction([
    prisma.study.findMany({
      where: { userId, tenantId },
      include: {
        patient: { include: { profile: true } },
        biochemist: { include: { profile: true } },
        status: true,
        attachments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: safeLimit,
    }),
    prisma.study.count({ where: { userId, tenantId } }),
    prisma.study.groupBy({
      by: ["statusId"],
      where: { userId, tenantId },
      orderBy: {
        statusId: "asc",
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const statusIds = grouped.map((g) => g.statusId);
  const statuses = statusIds.length
    ? await prisma.status.findMany({
      where: { id: { in: statusIds } },
      select: { id: true, name: true },
    })
    : [];

  const statusMap = new Map(statuses.map((s) => [s.id, s.name]));
  const summary = grouped.reduce<Record<string, number>>((acc, g) => {
    const name = statusMap.get(g.statusId) || "UNKNOWN";
    const count =
      typeof g._count === "object" && g._count && "_all" in g._count
        ? g._count._all ?? 0
        : 0;
    acc[name] = count;
    return acc;
  }, {});

  return {
    items,
    total,
    summary,
    page: safePage,
    limit: safeLimit,
  };
};

export const deleteStudy = async (studyId: number, tenantId: number) => {
  const existing = await prisma.study.findFirst({
    where: {
      id: studyId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  return await prisma.study.delete({
    where: {
      id: existing.id,
    },
  });
};

export const cancelStudy = async (studyId: number, tenantId: number) => {
  // Obtener el estado CANCELLED
  const cancelledStatus = await getStatusByName("CANCELLED");
  if (!cancelledStatus) {
    throw new Error("Estado CANCELLED no encontrado en la BD");
  }

  const existing = await prisma.study.findFirst({
    where: {
      id: studyId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  return await prisma.study.update({
    where: { id: existing.id },
    data: { statusId: cancelledStatus.id },
    include: {
      patient: { include: { profile: true } },
      biochemist: { include: { profile: true } },
      status: true,
      attachments: true,
    },
  });
};

export const getStatusByName = async (statusName: string) => {
  return await prisma.status.findUnique({
    where: {
      name: statusName,
    },
  });
};

export const getPatientByDni = async (dni: string, tenantId: number) => {
  return await prisma.user.findFirst({
    where: {
      dni,
      tenantId,
      role: {
        name: 'PATIENT',
      },
    },
    include: {
      profile: true,
    },
  });
};

export const getBiochemistById = async (biochemistId: number, tenantId: number) => {
  return await prisma.user.findFirst({
    where: {
      id: biochemistId,
      tenantId,
    },
    include: {
      role: true,
      profile: true,
    },
  });
};

export const getAllBiochemists = async (tenantId: number) => {
  return await prisma.user.findMany({
    where: {
      tenantId,
      role: {
        name: "BIOCHEMIST",
      },
    },
    include: {
      profile: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// Función NUEVA para obtener estudios con paginación
// Servicio de paginación eliminado

export const deleteAttachment = async (attachmentId: number, tenantId: number) => {
  const existing = await prisma.studyAttachment.findFirst({
    where: {
      id: attachmentId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  return await prisma.studyAttachment.delete({
    where: { id: existing.id },
  });
};
