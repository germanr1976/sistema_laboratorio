import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function hashPassword(password: string):Promise<string>{
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    const passwordHashed = await bcrypt.hash(password,saltRounds);
    return passwordHashed;
} 

export async function comparePassword(password:string,hashedPassword:string):Promise<boolean> {
    const isPassEquals = await bcrypt.compare(password,hashedPassword);
    return isPassEquals;
}

export async function generateToken(userData: {
    userId: number,
    dni: string,
    roleId: number,
    roleName: string
}): Promise<string> {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    
    const token = jwt.sign(userData, jwtSecret, { expiresIn } as jwt.SignOptions);
    return token;
}

export async function verifyToken(token:string): Promise<any> {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    try{
        const isTokenCorrect = jwt.verify(token,jwtSecret)
        return isTokenCorrect
    }catch(error){
        console.error(error)
        throw error   
    }
}