import { NextFunction, Response, Request } from 'express';
import {
  checkOtpRestrictions,
  sendOtp,
  trackFailedOtpAttempts,
  trackOptRequests,
  validateUserRegistrationInput,
} from '../utils/auth.helper';
import { ValidationError } from '../../../../packages/error-handler';

export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email } = validateUserRegistrationInput(req.body);
    const existingUser = null;
    if (existingUser) {
      return next(new ValidationError('User already exists with this email'));
    }
    await checkOtpRestrictions(email, next);
    await trackOptRequests(email, next);
    await trackFailedOtpAttempts(email, next);
    await sendOtp(email, name, 'user-activation-mail');

    // user creation removed; previously used Prisma client

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    return next(error);
  }
};
