import prisma from "@/config/prisma";

interface CreateStudyData {
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

export const getStudiesByBiochemist = async (biochemistId: number) => {
  return await prisma.study.findMany({
    where: {
      biochemistId,
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

export const getAllStudies = async () => {
  return await prisma.study.findMany({
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

export const getStudyById = async (studyId: number) => {
  return await prisma.study.findUnique({
    where: {
      id: studyId,
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
  data: UpdateStudyStatusData
) => {
  return await prisma.study.update({
    where: {
      id: studyId,
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
  data: UpdateStudyPdfData
) => {
  return await prisma.study.update({
    where: { id: studyId },
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
  files: { url: string; filename?: string }[]
) => {
  if (files.length === 0) return { count: 0 };
  return await prisma.studyAttachment.createMany({
    data: files.map((f) => ({ studyId, url: f.url, filename: f.filename || null })),
  });
};

export const getStudiesByPatient = async (userId: number) => {
  return await prisma.study.findMany({
    where: {
      userId,
    },
    include: {
      biochemist: { include: { profile: true } },
      status: true,
      attachments: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const deleteStudy = async (studyId: number) => {
  return await prisma.study.delete({
    where: {
      id: studyId,
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

export const getPatientByDni = async (dni: string) => {
  return await prisma.user.findUnique({
    where: {
      dni,
    },
    include: {
      profile: true,
    },
  });
};

export const getBiochemistById = async (biochemistId: number) => {
  return await prisma.user.findUnique({
    where: {
      id: biochemistId,
    },
    include: {
      role: true,
      profile: true,
    },
  });
};

export const getAllBiochemists = async () => {
  return await prisma.user.findMany({
    where: {
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

export const deleteAttachment = async (attachmentId: number) => {
  return await prisma.studyAttachment.delete({
    where: { id: attachmentId },
  });
};
