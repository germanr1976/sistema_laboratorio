"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatStudyList = exports.formatStudy = void 0;
const formatStudy = (study) => {
    // Convertir fecha a formato YYYY-MM-DD (sin zona horaria) para evitar desfase
    const formatDateToString = (date) => {
        if (!date)
            return null;
        const d = new Date(date);
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    return {
        id: study.id,
        studyName: study.studyName,
        studyDate: formatDateToString(study.studyDate),
        socialInsurance: study.socialInsurance,
        doctor: study.doctor,
        pdfUrl: study.pdfUrl,
        pdfs: Array.isArray(study.attachments) ? study.attachments.map((a) => a.url) : [],
        attachments: Array.isArray(study.attachments) ? study.attachments.map((a) => ({
            id: a.id,
            url: a.url,
            filename: a.filename,
            createdAt: a.createdAt,
        })) : [],
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
exports.formatStudy = formatStudy;
const formatStudyList = (studies) => {
    return studies.map(exports.formatStudy);
};
exports.formatStudyList = formatStudyList;
//# sourceMappingURL=study.formatter.js.map