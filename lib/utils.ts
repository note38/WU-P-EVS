import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate a random secure password
export function generatePassword(length: number = 10): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  // Ensure at least one character from each category
  password += getRandomChar("ABCDEFGHIJKLMNOPQRSTUVWXYZ"); // Uppercase
  password += getRandomChar("abcdefghijklmnopqrstuvwxyz"); // Lowercase
  password += getRandomChar("0123456789"); // Number
  password += getRandomChar("!@#$%^&*"); // Special character

  // Fill the rest of the password
  for (let i = password.length; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  // Shuffle the password to make it more random
  return shuffleString(password);
}

// Helper function to get a random character from a string
function getRandomChar(characters: string): string {
  const randomIndex = Math.floor(Math.random() * characters.length);
  return characters[randomIndex];
}

// Helper function to shuffle a string
function shuffleString(str: string): string {
  const array = str.split("");
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.join("");
}

// Generate a voter ID
export function generateVoterId(): string {
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `VOTER-${timestamp}-${random}`;
}

// Password validation utilities
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
  };
  feedback: string[];
} {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;
  const isValid = score === 4;

  const feedback: string[] = [];
  if (!requirements.length) feedback.push("At least 8 characters");
  if (!requirements.uppercase) feedback.push("One uppercase letter");
  if (!requirements.lowercase) feedback.push("One lowercase letter");
  if (!requirements.number) feedback.push("One number");

  return {
    isValid,
    score,
    requirements,
    feedback,
  };
}

// Check if password contains common patterns to avoid
export function checkPasswordSecurity(password: string): {
  hasCommonPatterns: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let hasCommonPatterns = false;

  // Check for sequential patterns
  const sequential =
    /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789|012)/i;
  if (sequential.test(password)) {
    hasCommonPatterns = true;
    warnings.push("Avoid sequential characters");
  }

  // Check for repeated patterns
  const repeated = /(.)\1{2,}/;
  if (repeated.test(password)) {
    hasCommonPatterns = true;
    warnings.push("Avoid repeated characters");
  }

  // Check for keyboard patterns
  const keyboard = /(?:qwerty|asdfgh|zxcvbn|123456|654321)/i;
  if (keyboard.test(password)) {
    hasCommonPatterns = true;
    warnings.push("Avoid keyboard patterns");
  }

  return {
    hasCommonPatterns,
    warnings,
  };
}

// Sanitize error messages for logs (remove sensitive data)
export function sanitizeErrorForLog(error: any, userId?: number): string {
  if (typeof error === "string") {
    return `User ${userId}: ${error}`;
  }

  if (error instanceof Error) {
    return `User ${userId}: ${error.message}`;
  }

  return `User ${userId}: Unknown error occurred`;
}
