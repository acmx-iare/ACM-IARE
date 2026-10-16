export interface NavItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

export type EventStatus = "upcoming" | "past" | "postponed" | "cancelled" | "registration_closed";

export type EventCategory = 
  | "All"
  | "Workshop"
  | "Hackathon"
  | "Coding Competition"
  | "Tech Talk"
  | "Open Source"
  | "Career & Seminar";

export interface EventSpeaker {
  name: string;
  role: string;
  organization: string;
  avatarUrl?: string;
}

export interface ChapterEvent {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  category: EventCategory;
  status: EventStatus;
  date: string; // ISO date string (YYYY-MM-DD)
  time: string; // e.g. "10:00 AM - 04:00 PM IST"
  venue: string; // e.g. "Auditorium, Block IV, IARE Campus"
  mode: "In-Person" | "Virtual" | "Hybrid";
  description: string;
  detailedOverview: string[];
  prerequisites: string[];
  takeaways: string[];
  speakers: EventSpeaker[];
  registrationDeadline: string;
  registrationOpen: boolean;
  registrationUrl?: string;
  bannerImage: string;
  capacity?: number;
  featured?: boolean;
}

export type TeamCategory = "Faculty" | "Office Bearers" | "Technical Leads" | "Committee Leads";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: TeamCategory;
  department: string;
  academicYear?: string;
  bio: string;
  imageUrl: string;
  email?: string;
  linkedin?: string;
  github?: string;
  acmMemberId?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  date: string;
  category: "Hackathons" | "Workshops" | "Celebrations" | "Community";
  imageUrl: string;
  caption: string;
}

export interface ChapterStat {
  label: string;
  value: string;
  description: string;
}

export interface TechnicalSIG {
  id: string;
  name: string;
  shortName: string;
  description: string;
  iconName: string;
  technologies: string[];
  activities: string[];
}

export interface ContactSubmission {
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  role: "student" | "faculty" | "industry" | "other";
}

export interface MembershipSubmission {
  fullName: string;
  rollNumber: string;
  email: string;
  phone: string;
  department: string;
  yearOfStudy: string;
  section: string;
  acmId?: string;
  technicalInterests: string[];
  statementOfPurpose: string;
}
