import { NextFunction, Response, Request } from 'express';
import {
  checkOtpRestrictions,
  sendOtp,
  trackFailedOtpAttempts,
  trackOptRequests,
  validateUserRegistrationInput,
} from '../utils/auth.helper';
import { ValidationError } from '../../../../packages/error-handler';
import { prisma } from '../prisma';

export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email } = validateUserRegistrationInput(req.body);
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new ValidationError('User already exists with this email'));
    }
    await checkOtpRestrictions(email, next);
    await trackOptRequests(email, next);
    await trackFailedOtpAttempts(email, next);
    await sendOtp(email, name, 'user-activation-mail');

    // await prisma.user.create({
    //   data: {
    //     name,
    //     email,
    //     isActive: false,
    //   },
    // });

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    return next(error);
  }
};
