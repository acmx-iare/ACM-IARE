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
  // Google Form & Sheets Automation Metadata
  googleFormId?: string;
  googleFormUrl?: string;
  googleFormEditUrl?: string; // Kept server-side / admin-only
  formStatus?: "active" | "closed" | "failed" | "not_created";
  formCreationError?: string;
  responseCount?: number;
  registrationQuestions?: FormQuestion[];
  formConfig?: FormConfiguration;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type QuestionType =
  | "text"
  | "paragraph"
  | "multiple_choice"
  | "checkboxes"
  | "dropdown"
  | "scale"
  | "date"
  | "time"
  | "section";

export interface FormQuestion {
  id: string;
  title: string;
  type: QuestionType;
  required: boolean;
  helpText?: string;
  options?: string[]; // For multiple_choice, checkboxes, dropdown
  scaleMin?: number; // 0 or 1 for linear scale (default 1)
  scaleMax?: number; // 3 to 10 for linear scale (default 5)
  scaleMinLabel?: string; // Label for lower bound
  scaleMaxLabel?: string; // Label for upper bound
}

export interface FormSettings {
  collectEmail: boolean;
  limitOneResponsePerUser: boolean;
  allowResponseEdits: boolean;
  confirmationMessage: string;
  customClosedMessage?: string;
  registrationDeadline?: string;
}

export interface FormConfiguration {
  formTitle: string;
  formDescription: string;
  settings: FormSettings;
  questions: FormQuestion[];
  templateId?: string;
  version?: number;
  updatedAt?: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
  submittedAt: string;
  fullName: string;
  rollNumber: string;
  email: string;
  phone: string;
  department: string;
  yearOfStudy: string;
  acmId?: string;
  rawResponses?: Record<string, string>;
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

export type CertificateStatus = "valid" | "revoked";
export type CertificateType = "participation" | "winner" | "runner_up" | "appreciation" | "speaker" | "coordinator";

export interface CertificateSignatory {
  name: string;
  role: string;
  title?: string;
  signatureUrl?: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
  type: CertificateType;
  title: string;
  subtitle?: string;
  bodyTemplate: string;
  issuerOrganization: string;
  signatories: CertificateSignatory[];
  branding: {
    primaryColor?: string;
    accentColor?: string;
    ribbonText?: string;
    logoUrl?: string;
  };
  layout: {
    orientation?: "landscape" | "portrait";
    borderStyle?: string;
  };
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IssuedCertificate {
  id: string;
  certificateNumber: string;
  eventId?: string;
  registrationId?: string;
  templateId?: string;
  recipientName: string;
  recipientEmail: string;
  recipientRollNumber?: string;
  recipientDepartment?: string;
  eventTitle: string;
  eventDate?: string;
  certificateType: CertificateType;
  status: CertificateStatus;
  revokedAt?: string | null;
  revokedReason?: string | null;
  pdfStorageKey: string;
  pdfFileSize?: number;
  qrVerificationUrl: string;
  issuedAt: string;
  issuedBy?: string;
}

export interface CertificateVerificationResult {
  status: "valid" | "revoked" | "not_found";
  certificate?: {
    certificateNumber: string;
    recipientName: string;
    eventTitle: string;
    eventDate?: string;
    certificateType: CertificateType;
    issuedAt: string;
    issuerOrganization?: string;
    revokedAt?: string | null;
    revokedReason?: string | null;
  };
  verificationMessage?: string;
}
