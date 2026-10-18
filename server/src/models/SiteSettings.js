import mongoose from 'mongoose';

const siteSettingsSchema = new mongoose.Schema(
  {
    welcomeLine: {
      type: String,
      default: 'Welcome to the University of Craiova'
    },
    headline: {
      type: String,
      default: 'Meet. Connect. Belong.'
    },
    subline: {
      type: String,
      default: 'This is your community. Find your people and make Craiova feel like home.'
    },
    officeEmail: {
      type: String,
      default: 'international@ucv.ro'
    },
    officeHours: {
      type: String,
      default: 'Monday to Friday, 10:00 - 14:00'
    },
    whereToFindUs: {
      type: String,
      default: 'Main Building, Room 102'
    },
    officialInfoUrl: {
      type: String,
      default: 'https://www.ucv.ro'
    },
    isPublished: {
      type: Boolean,
      default: true
    },
    ambassadorOpen: {
      type: Boolean,
      default: true
    },
    ambassadorNumberWanted: {
      type: String,
      default: '10 to 15'
    },
    ambassadorApplyByDate: {
      type: String,
      default: '15 November 2026'
    },
    ambassadorFirstMeeting: {
      type: String,
      default: 'Wednesday 18 November 2026, 16:00, IR Office'
    },
    certificateLine: {
      type: String,
      default: 'Official volunteering certificate from the University of Craiova'
    },
    certificateHours: {
      type: Number,
      default: 10
    },
    wallUpvoteColor: {
      type: String,
      default: '#1E7B4C'
    },
    privacyNotice: {
      type: String,
      default: `Privacy Notice

The International Relations Department at the University of Craiova runs this community platform.

What we keep:
- Your full name, email address, mobile number, home country, and faculty/programme if provided
- Content you post on the International Wall and words you teach
- Your activities RSVP and club proposals

Why we keep it:
To organise international student activities, maintain community communications, and support your stay in Craiova.

Who sees it:
- Staff only for contact details and administrative records
- The public only ever sees your first name and country on the world map, wall answers, and shared words. Never your email, phone, or surname.

How long:
Until you request deletion or up to 12 months after your mobility ends.

To request correction or deletion, contact the IR Office or use "Ask the coordinator".
[to be confirmed by the IR Office]`
    }
  },
  {
    timestamps: true
  }
);

export const SiteSettings =
  mongoose.models.SiteSettings || mongoose.model('SiteSettings', siteSettingsSchema);
