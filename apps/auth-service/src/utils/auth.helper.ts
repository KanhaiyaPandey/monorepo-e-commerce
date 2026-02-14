import crypto from "crypto";
import { ValidationError } from "../../../../packages/error-handler";
import redis from "../../../../packages/libs/redis";
import { send } from "process";

export interface UserRegistrationInput {
  name: string;
  email: string;
  password: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateUserRegistrationInput = (payload: unknown): UserRegistrationInput => {
  if (!payload || typeof payload !== "object") {
    throw new ValidationError("Registration payload is required");
  }

  const { name, email, password } = payload as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 60) {
    errors.push("name must be between 2 and 60 characters");
  }

  if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
    errors.push("email must be a valid email address");
  }

  const passwordValue = typeof password === "string" ? password : "";
  if (passwordValue.length < 8 || passwordValue.length > 64) {
    errors.push("password must be between 8 and 64 characters");
  }
  if (!/[A-Z]/.test(passwordValue)) {
    errors.push("password must include at least one uppercase letter");
  }
  if (!/[a-z]/.test(passwordValue)) {
    errors.push("password must include at least one lowercase letter");
  }
  if (!/[0-9]/.test(passwordValue)) {
    errors.push("password must include at least one number");
  }
  if (!/[^A-Za-z0-9]/.test(passwordValue)) {
    errors.push("password must include at least one special character");
  }

  if (errors.length > 0) {
    throw new ValidationError("Invalid registration data", errors);
  }

  const nameValue = (name as string).trim();
  const emailValue = (email as string).trim().toLowerCase();

  return {
    name: nameValue,
    email: emailValue,
    password: passwordValue,
  };
};

export const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
};

export const verifyPassword = (password: string, storedHash: string): boolean => {
  const [salt, hash] = storedHash.split(":");
  const hashToVerify = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === hashToVerify;
};

export const sendOtp = async (email: string, name: string, template: string) => {
    const otp = crypto.randomInt(1000, 9999).toString();
    await redis.setex(`otp:${email}`, 300, otp);
    await redis.setex(`otp-cooldown:${email}`, 60, "true");
}
