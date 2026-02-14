import { NextFunction, Response, Request } from "express";
import { hashPassword, validateUserRegistrationInput } from "../utils/auth.helper";
import prisma from "../../../../packages/libs/prisma";
import { ValidationError } from "../../../../packages/error-handler";

export const userRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = validateUserRegistrationInput(req.body);
    const hashedPassword = hashPassword(password);
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return next(new ValidationError("User already exists with this email"));
    }
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });
    res.status(201).json({ message: "User registered successfully", userId: newUser.id });
  } catch (error) {
    next(error);
  }
};
