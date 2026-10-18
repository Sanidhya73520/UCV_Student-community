import { z } from 'zod';
import { LIMITS } from '../limits.js';
import { ACTIVITY_COSTS, ACTIVITY_STATUSES, CLUB_STATUSES, PROPOSAL_STATUSES } from '../enums.js';

export const activitySchema = z.object({
  title: z
    .string({ required_error: 'Activity title is required.' })
    .trim()
    .min(LIMITS.ACTIVITY_NAME_MIN)
    .max(LIMITS.ACTIVITY_NAME_MAX),
  dateToConfirm: z.boolean().default(false),
  targetMonth: z.string().optional().default(''),
  date: z.string().optional().nullable(),
  startTime: z.string().optional().default(''),
  endTime: z.string().optional().default(''),
  venue: z.string().trim().max(LIMITS.ACTIVITY_VENUE_MAX).optional().default(''),
  description: z.string().trim().max(LIMITS.ACTIVITY_DESCRIPTION_MAX).optional().default(''),
  costChoice: z.enum(ACTIVITY_COSTS).default('free'),
  askIfGoing: z.boolean().default(true),
  quote: z.string().trim().optional().default(''),
  quoteSource: z.string().trim().optional().default(''),
  whatToBring: z.array(z.string().trim()).optional().default([]),
  goodToKnow: z.array(z.string().trim()).optional().default([]),
  feedbackUrl: z
    .string()
    .trim()
    .refine((val) => !val || val.startsWith('https://'), 'URL must start with https://')
    .optional()
    .default(''),
  itinerary: z
    .array(
      z.object({
        time: z.string().trim().max(LIMITS.ITINERARY_TIME_MAX),
        title: z.string().trim().max(LIMITS.ITINERARY_TITLE_MAX),
        detail: z.string().trim().max(LIMITS.ITINERARY_DETAIL_MAX).optional().default('')
      })
    )
    .optional()
    .default([]),
  checklist: z
    .array(
      z.object({
        text: z.string().trim().max(LIMITS.CHECKLIST_ITEM_MAX),
        done: z.boolean().default(false)
      })
    )
    .optional()
    .default([]),
  status: z.enum(ACTIVITY_STATUSES).default('planning')
});

export const answerQuestionSchema = z.object({
  answer: z
    .string({ required_error: 'Answer cannot be empty.' })
    .trim()
    .min(LIMITS.ANSWER_TEXT_MIN)
    .max(LIMITS.ANSWER_TEXT_MAX)
});

export const wordOfTheMonthSchema = z.object({
  month: z.string().trim().min(1),
  word: z.string().trim().min(1).max(LIMITS.WORD_MAX),
  pronunciation: z.string().trim().min(1),
  meaning: z.string().trim().min(1).max(LIMITS.MEANING_MAX),
  exampleRo: z.string().trim().min(1),
  exampleEn: z.string().trim().min(1),
  challenge: z.string().trim().optional().default(''),
  isPublished: z.boolean().default(false)
});

export const phraseSchema = z.object({
  romanian: z.string().trim().min(1).max(LIMITS.PHRASE_ROMANIAN_MAX),
  pronunciation: z.string().trim().min(1).max(LIMITS.PHRASE_PRONUNCIATION_MAX),
  english: z.string().trim().min(1).max(LIMITS.PHRASE_ENGLISH_MAX),
  order: z.number().int().default(0),
  isPublished: z.boolean().default(true)
});

export const questionOfTheMonthSchema = z.object({
  month: z.string().trim().min(1),
  question: z.string().trim().min(1),
  isOpen: z.boolean().default(true),
  isPublished: z.boolean().default(false),
  wallUpvoteColor: z.string().trim().optional()
});

export const siteSettingsSchema = z.object({
  welcomeLine: z.string().trim().optional(),
  headline: z.string().trim().optional(),
  subline: z.string().trim().optional(),
  officeEmail: z.string().trim().email().optional(),
  officeHours: z.string().trim().optional(),
  whereToFindUs: z.string().trim().optional(),
  officialInfoUrl: z
    .string()
    .trim()
    .refine((u) => !u || u.startsWith('https://'), 'URL must start with https://')
    .optional(),
  ambassadorOpen: z.boolean().optional(),
  ambassadorNumberWanted: z.string().trim().optional(),
  ambassadorApplyByDate: z.string().trim().optional(),
  ambassadorFirstMeeting: z.string().trim().optional(),
  certificateLine: z.string().trim().optional(),
  certificateHours: z.number().int().min(1).optional(),
  wallUpvoteColor: z.string().trim().optional(),
  privacyNotice: z.string().optional()
});

export const clubAreaSchema = z.object({
  name: z.string().trim().min(1).max(LIMITS.CLUB_NAME_MAX),
  description: z.string().trim().max(LIMITS.CLUB_DESCRIPTION_MAX),
  order: z.number().int().default(0),
  isPublished: z.boolean().default(true)
});

export const openClubSchema = z.object({
  name: z.string().trim().min(LIMITS.CLUB_NAME_MIN).max(LIMITS.CLUB_NAME_MAX),
  motto: z.string().trim().max(LIMITS.CLUB_MOTTO_MAX),
  description: z.string().trim().max(LIMITS.CLUB_DESCRIPTION_MAX),
  frequency: z.string().trim().max(LIMITS.CLUB_FREQUENCY_MAX),
  whatsappUrl: z
    .string()
    .trim()
    .refine((u) => !u || u.startsWith('https://'), 'URL must start with https://')
    .optional()
    .default(''),
  status: z.enum(CLUB_STATUSES).default('draft')
});

export const proposalStatusSchema = z.object({
  status: z.enum(PROPOSAL_STATUSES)
});

export const logHoursSchema = z.object({
  studentId: z.string().min(1),
  date: z.string().min(1),
  hours: z.number().min(0.5).max(12),
  whatDidTheyDo: z.string().trim().optional().default('')
});

export const addStudentSchema = z.object({
  fullName: z.string().trim().min(LIMITS.FULL_NAME_MIN).max(LIMITS.FULL_NAME_MAX),
  email: z.string().trim().email().optional().or(z.literal('')),
  mobile: z.string().trim().optional().default(''),
  country: z.string().min(2).max(2),
  faculty: z.string().trim().optional().default(''),
  programme: z.string().trim().optional().default('other'),
  sendInvite: z.boolean().default(true)
});
