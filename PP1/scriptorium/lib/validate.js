/* validation helpers for user account data */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Helper function to validate password
export function isValidPassword(password) {
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasMinLength = password.length >= 8;
    return hasLowercase && hasUppercase && hasDigit && hasMinLength;
}

export function isValidPhoneNumber(phoneNumber) {
    const phoneNumberRegex = /^[0-9]{10,15}$/;
    return phoneNumberRegex.test(phoneNumber);
  }