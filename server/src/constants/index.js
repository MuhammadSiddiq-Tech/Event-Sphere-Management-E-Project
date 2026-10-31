/**
 * @module constants
 * All domain-wide enum-style constants.
 * Import from here; never use magic strings in other modules.
 */

export const ROLES = Object.freeze({
  ADMIN: 'admin',
  EXHIBITOR: 'exhibitor',
  ATTENDEE: 'attendee',
});

export const BOOTH_STATUS = Object.freeze({
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  ALLOCATED: 'allocated',
  BLOCKED: 'blocked',
});

export const APPLICATION_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
});

export const SESSION_TYPE = Object.freeze({
  KEYNOTE: 'keynote',
  SESSION: 'session',
  WORKSHOP: 'workshop',
});

export const SESSION_STATUS = Object.freeze({
  SCHEDULED: 'scheduled',
  UPDATED: 'updated',
  CANCELLED: 'cancelled',
});

export const EXPO_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

export const CONVERSATION_TYPE = Object.freeze({
  SUPPORT: 'support',
  EXHIBITOR_ATTENDEE: 'exhibitor-attendee',
  EXHIBITOR_EXHIBITOR: 'exhibitor-exhibitor',
});

export const FEEDBACK_STATUS = Object.freeze({
  OPEN: 'open',
  IN_REVIEW: 'in_review',
  RESOLVED: 'resolved',
});

export const FEEDBACK_CATEGORY = Object.freeze({
  SUGGESTION: 'suggestion',
  ISSUE: 'issue',
  SUPPORT: 'support',
});

export const ANALYTICS_EVENT_TYPE = Object.freeze({
  BOOTH_VIEW: 'booth_view',
  PROFILE_VIEW: 'profile_view',
  SESSION_VIEW: 'session_view',
  SESSION_CHECKIN: 'session_checkin',
  SEARCH: 'search',
});
