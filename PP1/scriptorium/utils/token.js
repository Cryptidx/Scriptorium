/*oken Management Only
Move all token-specific functions to token.js, so it manages token storage, 
generation, and verification. */
import jwt from "jsonwebtoken";

const JWT_SECRET_REFRESH = process.env.JWT_SECRET_REFRESH;
const JWT_SECRET_ACCESS = process.env.JWT_SECRET_ACCESS;
const JWT_EXPIRES_IN_REFRESH = process.env.JWT_EXPIRES_IN_REFRESH;
const JWT_EXPIRES_IN_ACCESS = process.env.JWT_EXPIRES_IN_ACCESS;

// Set and get tokens in localStorage
export function setAccessToken(token) {
    return localStorage.setItem('AccessToken', token);
}

export function setRefreshToken(token) {
    return localStorage.setItem('RefreshToken', token);
}

export function getAccessToken() {
    return localStorage.getItem('AccessToken');
}

export function getRefreshToken() {
    return localStorage.getItem('RefreshToken');
}

// Generate access and refresh tokens
export function generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET_ACCESS, { expiresIn: JWT_EXPIRES_IN_ACCESS });
}

export function generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_SECRET_REFRESH, { expiresIn: JWT_EXPIRES_IN_REFRESH });
}

// Verify access and refresh tokens
export function verifyAccessToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET_ACCESS);
    } catch (err) {
        return null;
    }
}

export function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET_REFRESH);
    } catch (err) {
        return null;
    }
}
