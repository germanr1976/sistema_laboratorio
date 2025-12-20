import { Study, User, Profile, Status } from "@prisma/client";

type StudyWithRelations = Study & {
  patient?: User & {
    profile?: Profile | null;
  };
  biochemist?: (User & {
    profile?: Profile | null;
  }) | null;
  status?: Status;
};

export const formatStudy = (study: any) => {
  return {
    id: study.id,
    studyName: study.studyName,
    studyDate: study.studyDate,
    socialInsurance: study.socialInsurance,
    pdfUrl: study.pdfUrl,
    status: study.status
      ? {
          id: study.status.id,
          name: study.status.name,
        }
      : null,
    patient: study.patient
      ? {
          id: study.patient.id,
          dni: study.patient.dni,
          fullName: study.patient.profile
            ? `${study.patient.profile.firstName} ${study.patient.profile.lastName}`
            : null,
        }
      : null,
    biochemist: study.biochemist
      ? {
          id: study.biochemist.id,
          fullName: study.biochemist.profile
            ? `${study.biochemist.profile.firstName} ${study.biochemist.profile.lastName}`
            : null,
          license: study.biochemist.license,
        }
      : null,
    createdAt: study.createdAt,
    updatedAt: study.updatedAt,
  };
};

export const formatStudyList = (studies: StudyWithRelations[]) => {
  return studies.map(formatStudy);
};
