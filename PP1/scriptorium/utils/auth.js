import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS);
const JWT_SECRET_REFRESH = process.env.JWT_SECRET_REFRESH;
const JWT_SECRET_ACCESS = process.env.JWT_SECRET_ACCESS;
const JWT_EXPIRES_IN_REFRESH = process.env.JWT_EXPIRES_IN_REFRESH;
const JWT_EXPIRES_IN_ACCESS = process.env.JWT_EXPIRES_IN_ACCESS;


export function setAccessToken(token) {
    return localStorage.setItem('AccessToken', token)
}

export function setRefreshToken(token) {
    return localStorage.setItem('RefreshToken', token)
}

export function getAccessToken() {
    return localStorage.getItem('AccessToken')
}

export function getRefreshToken() {
    return localStorage.getItem('RefreshToken')
}

export async function hashPassword(pwd){
    
    return await bcrypt.hash(pwd,BCRYPT_SALT_ROUNDS); 
}

export async function comparePassword(pwd,hash){
    return await bcrypt.compare(pwd,hash);
}

export function generateToken(obj,which){
    // tokens can be generated from any obj 

    
    if(which == 0){
        // generate access token
        return jwt.sign(obj, JWT_SECRET_ACCESS, {expiresIn: JWT_EXPIRES_IN_ACCESS})
    }
    else{
        return jwt.sign(obj, JWT_SECRET_REFRESH, {expiresIn: JWT_EXPIRES_IN_REFRESH})
    }
   
}

export function verifyToken(token, which){
    if(!token){
        // could throw exception
        return null
    }
    try{
        // will return json object which we generated the token from
        if(which === 0){
            //access
            return jwt.verify(token,JWT_SECRET_ACCESS);
        }
        else{
            return jwt.verify(token,JWT_SECRET_REFRESH);
        }
    }
    
    catch(err){
        return null;
    }
}