import prisma from "@/config/prisma";

interface CreateStudyData {
  userId: number;
  studyName: string;
  studyDate: Date;
  socialInsurance?: string | undefined;
  statusId: number;
  pdfUrl?: string | undefined;
  biochemistId?: number | undefined;
}

interface UpdateStudyStatusData {
  statusId: number;
}

export const createStudy = async (data: CreateStudyData) => {
  return await prisma.study.create({
    data: {
      userId: data.userId,
      studyName: data.studyName,
      studyDate: data.studyDate,
      socialInsurance: data.socialInsurance || null,
      statusId: data.statusId,
      pdfUrl: data.pdfUrl || null,
      biochemistId: data.biochemistId || null,
    },
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
    },
  });
};

export const getStudiesByBiochemist = async (biochemistId: number) => {
  return await prisma.study.findMany({
    where: {
      biochemistId,
    },
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getAllStudies = async () => {
  return await prisma.study.findMany({
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
    },
  });
};

export const getStudiesByPatient = async (userId: number) => {
  return await prisma.study.findMany({
    where: {
      userId,
    },
    include: {
      biochemist: {
        include: {
          profile: true,
        },
      },
      status: true,
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
