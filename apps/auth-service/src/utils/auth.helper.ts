import crypto from "crypto";
import { ValidationError } from "../../../../packages/error-handler";
import redis from "../../../../packages/libs/redis";
import { sendEmail } from "./sendMail/index";
import { NextFunction } from "express";

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
    await sendEmail(email, "Your OTP Code", template, { name, otp });
    await redis.setex(`otp:${email}`, 300, otp);
    await redis.setex(`otp_cooldown:${email}`, 60, "true");
}

export const checkOtpRestrictions = async (email: string, next: NextFunction) => {
    if (await redis.get(`otp_lock:${email}`)) {
        return next(new ValidationError("Account is locked due to multiple failed OTP attempts. Please try again later."));
    }
    if (await redis.get(`otp_spam_lock:${email}`)) {
        return next(new ValidationError("Too many OTP requests. Please wait 1 hour before requesting another OTP."));
    }
    if (await redis.get(`otp_cooldown:${email}`)) {
        return next(new ValidationError("OTP was recently sent. Please wait 1 minute before requesting another OTP."));
    }
  }

  export const trackOptRequests = async (email: string, next: NextFunction) => {
    const requestCountKey = `otp_request_count:${email}`;
    const requestCount = await redis.incr(requestCountKey);
    if (requestCount === 1) {
        await redis.expire(requestCountKey, 3600);
    }
    if (requestCount > 5) {
        await redis.setex(`otp_spam_lock:${email}`, 3600, "true");
        return next(new ValidationError("Too many OTP requests. Please wait 1 hour before requesting another OTP."));
    }
  }

export const trackFailedOtpAttempts = async (email: string, next: NextFunction) => {
    const failedAttemptsKey = `otp_failed_attempts:${email}`;
    const failedAttempts = await redis.incr(failedAttemptsKey);
    if (failedAttempts === 1) {
        await redis.expire(failedAttemptsKey, 900);
    }
    if (failedAttempts >= 5) {
        await redis.setex(`otp_lock:${email}`, 900, "true");
        return next(new ValidationError("Account is locked due to multiple failed OTP attempts. Please try again later."));
    }
}
