export const USER_ROLES = ['student', 'staff', 'admin'];

export const STUDENT_STATUSES = ['waiting', 'approved', 'rejected'];

export const STAFF_STATUSES = ['invited', 'active', 'removed'];

export const JOIN_SOURCES = ['signup', 'import', 'added_by_staff', 'invitation'];

export const ACTIVITY_STATUSES = ['planning', 'published', 'hidden'];

export const ACTIVITY_COSTS = ['free', 'small_fee', 'bring_share'];

export const GOING_RESPONSES = ['going', 'not_going'];

export const QUESTION_TOPICS = ['events', 'life', 'life_in_craiova', 'profile_change', 'other'];

export const QUESTION_STATUSES = ['waiting', 'pending', 'answered'];

export const CONTENT_STATES = ['visible', 'pending', 'removed', 'deleted'];

export const CLUB_AREA_STATUSES = ['published', 'hidden'];

export const CLUB_STATUSES = ['draft', 'published', 'hidden'];

export const PROPOSAL_STATUSES = ['received', 'pending', 'discussed', 'opened', 'not_now'];

export const AMBASSADOR_STATUSES = ['pending', 'applied', 'approved', 'accepted', 'not_now'];

export const NOTIFICATION_TYPES = [
  'new_activity',
  'reminder_activity',
  'question_answered',
  'proposal_status',
  'club_published',
  'ambassador_accepted',
  'ambassador_not_now',
  'community_update',
  'new_question',
  'new_word'
];

export const AUDIT_ACTIONS = [
  'student_approved',
  'student_rejected',
  'student_approval_undone',
  'student_rejection_undone',
  'student_deleted',
  'students_imported',
  'staff_invited',
  'staff_invitation_resent',
  'staff_access_removed',
  'staff_access_restored',
  'content_removed',
  'content_restored',
  'answer_edited'
];

export const STUDENT_PROGRAMMES = [
  'erasmus_exchange',
  'erasmus_traineeship',
  'full_degree',
  'other'
];

export const EMAIL_TYPES = [
  'approval',
  'staff_invite',
  'password_reset',
  'activate_account',
  'account_exists',
  'question_answered',
  'new_activity',
  'activity_reminder',
  'community_update'
];
