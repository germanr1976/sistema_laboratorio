export * from './validators/validators';

export interface JWTPayload{
    userId: number;
    dni: string;
    roleId:number;
    roleName: string;
    iat?:number;
    exp?:number;
}

export interface LoginRequest{
    dni: string;
    password?: string
}

export interface RegisterBiochemistRequest{
    firstName: string; 
    lastName: string;
    dni: string;
    license: string; 
    email: string;
    password: string; 
}

export interface RegisterPatientRequest{
    firstName: string; 
    lastName: string; 
    dni: string; 
    birthDate: string;
}

export interface AuthResponse{
    success: boolean;
    message: string;
    data?:{
        user:{
            id: number;
            dni: string; 
            email?:string;
            role: string;
            profile:{
                firstName: string;
                lastName: string; 
            } 
        }
        token?: string;
    }
}

export const ROLE_NAMES = {
  PATIENT: 'PATIENT',
  BIOCHEMIST: 'BIOCHEMIST',
  ADMIN: 'ADMIN'
} as const;