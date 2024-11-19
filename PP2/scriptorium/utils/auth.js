import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from "./token";

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS);

// Password hashing and comparison
export async function hashPassword(password) {
    return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

// Generate access and refresh tokens for a user
export function createAccessToken(payload) {
    return generateAccessToken(payload);
}

export function createRefreshToken(payload) {
    return generateRefreshToken(payload);
}

// Verify tokens
export function validateAccessToken(token) {
    return verifyAccessToken(token);
}

export function validateRefreshToken(token) {
    return verifyRefreshToken(token);
}
