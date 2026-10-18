import { z } from 'zod';
import { LIMITS } from '../limits.js';
import { QUESTION_TOPICS } from '../enums.js';

export const updateProfileSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^[0-9+()\- ]{6,20}$/, 'Please enter a valid mobile number.')
    .optional(),
  faculty: z.string().optional(),
  programme: z.string().optional(),
  notificationPrefs: z
    .object({
      newActivities: z.boolean().optional(),
      questionAnswers: z.boolean().optional(),
      communityUpdates: z.boolean().optional()
    })
    .optional()
});

export const askQuestionSchema = z.object({
  topic: z.enum(QUESTION_TOPICS, {
    errorMap: () => ({ message: 'Please select a valid topic.' })
  }),
  text: z
    .string({ required_error: 'Please enter your question.' })
    .trim()
    .min(LIMITS.QUESTION_TEXT_MIN, `Question must be at least ${LIMITS.QUESTION_TEXT_MIN} characters.`)
    .max(LIMITS.QUESTION_TEXT_MAX, `Question cannot exceed ${LIMITS.QUESTION_TEXT_MAX} characters.`)
});

export const wallPostSchema = z.object({
  text: z
    .string({ required_error: 'Please enter your post.' })
    .trim()
    .min(1, 'Post cannot be empty.')
    .max(LIMITS.WALL_POST_MAX, `Post cannot exceed ${LIMITS.WALL_POST_MAX} characters.`)
});

export const shareWordSchema = z.object({
  word: z
    .string({ required_error: 'Please enter a word.' })
    .trim()
    .min(1, 'Word is required.')
    .max(LIMITS.WORD_MAX, `Word cannot exceed ${LIMITS.WORD_MAX} characters.`),
  language: z
    .string({ required_error: 'Please enter the language.' })
    .trim()
    .min(1, 'Language is required.')
    .max(LIMITS.LANGUAGE_MAX, `Language cannot exceed ${LIMITS.LANGUAGE_MAX} characters.`),
  meaning: z
    .string({ required_error: 'Please enter the meaning.' })
    .trim()
    .min(1, 'Meaning is required.')
    .max(LIMITS.MEANING_MAX, `Meaning cannot exceed ${LIMITS.MEANING_MAX} characters.`)
});

export const proposeClubSchema = z.object({
  name: z
    .string({ required_error: 'Please enter a club name.' })
    .trim()
    .min(LIMITS.CLUB_NAME_MIN, `Club name must be at least ${LIMITS.CLUB_NAME_MIN} characters.`)
    .max(LIMITS.CLUB_NAME_MAX, `Club name cannot exceed ${LIMITS.CLUB_NAME_MAX} characters.`),
  idea: z
    .string()
    .trim()
    .max(LIMITS.CLUB_IDEA_MAX, `Idea cannot exceed ${LIMITS.CLUB_IDEA_MAX} characters.`)
    .optional()
    .default(''),
  wantsToHelp: z.boolean().default(false)
});

export const applyAmbassadorSchema = z.object({
  why: z
    .string({ required_error: 'Please tell us why you want to be an ambassador.' })
    .trim()
    .min(LIMITS.AMBASSADOR_WHY_MIN, `Please write at least ${LIMITS.AMBASSADOR_WHY_MIN} characters.`)
    .max(LIMITS.AMBASSADOR_WHY_MAX, `Cannot exceed ${LIMITS.AMBASSADOR_WHY_MAX} characters.`),
  languages: z
    .string({ required_error: 'Please enter the languages you speak.' })
    .trim()
    .min(LIMITS.AMBASSADOR_LANGUAGES_MIN, 'Please enter languages.')
    .max(LIMITS.AMBASSADOR_LANGUAGES_MAX),
  hoursPerMonth: z.enum(['2_to_4', '4_to_8', 'more_than_8'], {
    errorMap: () => ({ message: 'Please select your hours commitment.' })
  })
});

export const rsvpSchema = z.object({
  activityId: z.string({ required_error: 'Activity ID is required.' }).trim().min(1, 'Activity ID is required.'),
  response: z.enum(['going', 'not_going'])
});

export const feedbackSchema = z.object({
  activityId: z.string({ required_error: 'Activity ID is required.' }).trim().min(1, 'Activity ID is required.'),
  rating: z.number().int().min(1).max(5)
});
