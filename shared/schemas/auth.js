import { z } from 'zod';
import { LIMITS } from '../limits.js';
import { isCommonPassword } from '../commonPasswords.js';
import { COUNTRIES } from '../countries.js';

const validCountryCodes = new Set(COUNTRIES.map((c) => c.code));

export const signUpSchema = z
  .object({
    fullName: z
      .string({ required_error: 'Please enter your full name.' })
      .trim()
      .min(LIMITS.FULL_NAME_MIN, 'Please enter your full name.')
      .max(LIMITS.FULL_NAME_MAX, `Full name cannot exceed ${LIMITS.FULL_NAME_MAX} characters.`),
    email: z
      .string({ required_error: 'Please enter a valid email address.' })
      .trim()
      .email('Please enter a valid email address.')
      .min(LIMITS.EMAIL_MIN)
      .max(LIMITS.EMAIL_MAX)
      .toLowerCase(),
    password: z
      .string({ required_error: 'Use at least 8 characters.' })
      .min(LIMITS.PASSWORD_STUDENT_MIN, 'Use at least 8 characters.')
      .max(LIMITS.PASSWORD_MAX, `Password cannot exceed ${LIMITS.PASSWORD_MAX} characters.`)
      .refine((p) => !isCommonPassword(p), 'This password is too common. Please choose a stronger password.'),
    confirmPassword: z.string({ required_error: 'Please confirm your password.' }),
    mobile: z
      .string({ required_error: 'Please enter a valid mobile number.' })
      .trim()
      .regex(/^[0-9+()\- ]{6,20}$/, 'Please enter a valid mobile number.'),
    country: z
      .string({ required_error: 'Choose your country from the list.' })
      .refine((val) => validCountryCodes.has(val), 'Choose your country from the list.'),
    faculty: z.string().optional().default(''),
    programme: z.string().optional().default('erasmus_exchange'),
    consent: z
      .boolean({ required_error: 'Please tick this box to continue.' })
      .refine((val) => val === true, 'Please tick this box to continue.')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword']
  });

export const signInSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .trim()
    .email('Please enter a valid email address.')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(1, 'Password is required.')
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Please enter a valid email address.' })
    .trim()
    .email('Please enter a valid email address.')
    .toLowerCase()
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required.'),
    password: z
      .string({ required_error: 'Password is required.' })
      .min(LIMITS.PASSWORD_STUDENT_MIN, 'Use at least 8 characters.')
      .max(LIMITS.PASSWORD_MAX)
      .refine((p) => !isCommonPassword(p), 'This password is too common.'),
    confirmPassword: z.string({ required_error: 'Please confirm your password.' }),
    consent: z.boolean().optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword']
  });

export const staffSetPasswordSchema = z
  .object({
    password: z
      .string({ required_error: 'At least 10 characters required.' })
      .min(LIMITS.PASSWORD_STAFF_MIN, 'At least 10 characters required.')
      .max(LIMITS.PASSWORD_MAX)
      .refine((p) => !isCommonPassword(p), 'This password is too common.'),
    confirmPassword: z.string({ required_error: 'Please confirm your password.' })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword']
  });

export const inviteStaffSchema = z.object({
  fullName: z
    .string({ required_error: 'Please enter full name.' })
    .trim()
    .min(LIMITS.FULL_NAME_MIN, 'Name must be at least 2 characters.')
    .max(LIMITS.FULL_NAME_MAX),
  email: z
    .string({ required_error: 'Please enter a valid email.' })
    .trim()
    .email('Please enter a valid email address.')
    .toLowerCase()
});
