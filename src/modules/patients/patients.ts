import { Study, Status } from "@prisma/client";

export interface AnalysisResponse {
    success: boolean;
    message: string;
    data?: Study | Study[]
    status: Status
}

export interface GetAnalysisByIdRequest {
    id: string; // viene como string desde los parámetros de ruta
}