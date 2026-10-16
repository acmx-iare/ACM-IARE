import { FormQuestion, FormSettings, FormConfiguration } from "@/types";

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  badge: string;
  defaultSettings: FormSettings;
  questions: FormQuestion[];
}

export const STANDARD_ATTENDEE_QUESTIONS: FormQuestion[] = [
  {
    id: "q_std_fullname",
    title: "Full Name",
    type: "text",
    required: true,
    helpText: "Enter your full name as registered in college records.",
  },
  {
    id: "q_std_rollno",
    title: "IARE Roll Number",
    type: "text",
    required: true,
    helpText: "e.g., 23951A05XX",
  },
  {
    id: "q_std_email",
    title: "Email Address",
    type: "text",
    required: true,
    helpText: "Official college email or active personal email for schedule & venue updates.",
  },
  {
    id: "q_std_phone",
    title: "Phone / WhatsApp Number",
    type: "text",
    required: true,
    helpText: "Used for emergency event communication & WhatsApp group invites.",
  },
  {
    id: "q_std_dept",
    title: "Department / Branch",
    type: "dropdown",
    required: true,
    options: [
      "Computer Science & Engineering (CSE)",
      "CSE - Artificial Intelligence & Machine Learning (CS-AIML)",
      "CSE - Data Science (CS-DS)",
      "CSE - Cyber Security (CS-CS)",
      "Information Technology (IT)",
      "Electronics & Communication Engineering (ECE)",
      "Electrical & Electronics Engineering (EEE)",
      "Mechanical Engineering (ME)",
      "Aeronautical Engineering (AE)",
      "Civil Engineering (CE)",
    ],
  },
  {
    id: "q_std_year",
    title: "Year of Study",
    type: "multiple_choice",
    required: true,
    options: [
      "1st Year (B.Tech)",
      "2nd Year (B.Tech)",
      "3rd Year (B.Tech)",
      "4th Year (B.Tech)",
      "Post-Graduate (M.Tech / MBA)",
    ],
  },
];

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "workshop",
    name: "Workshop Registration",
    description: "Hands-on coding, systems or AI masterclasses requiring software setup and prior experience checks.",
    badge: "Hands-on Technical",
    defaultSettings: {
      collectEmail: true,
      limitOneResponsePerUser: true,
      allowResponseEdits: true,
      confirmationMessage:
        "Thank you for registering for the ACM IARE Workshop! Your registration has been confirmed. Please check your email for installation instructions and pre-requisites.",
      customClosedMessage: "Registrations for this workshop are now closed as laboratory seating capacity has been reached.",
    },
    questions: [
      ...STANDARD_ATTENDEE_QUESTIONS,
      {
        id: "q_ws_experience",
        title: "Prior Knowledge Level with Workshop Topic",
        type: "multiple_choice",
        required: true,
        options: [
          "Complete beginner (Zero prior background)",
          "Basic familiarity (Know syntax / concepts)",
          "Intermediate (Built 1-2 small projects)",
          "Advanced (Comfortable with production/frameworks)",
        ],
      },
      {
        id: "q_ws_laptop",
        title: "Laptop Availability",
        type: "multiple_choice",
        required: true,
        options: [
          "Yes, I will bring my personal laptop with charger",
          "No, I request allocation of a campus lab terminal",
        ],
      },
      {
        id: "q_ws_os",
        title: "Primary Operating System",
        type: "dropdown",
        required: false,
        options: ["Linux (Ubuntu / Fedora / Arch)", "macOS", "Windows 11 / 10", "Dual-Boot / WSL2"],
      },
      {
        id: "q_ws_expectations",
        title: "What key skills or concepts do you hope to master in this workshop?",
        type: "paragraph",
        required: false,
        helpText: "Helps instructors calibrate pacing and live code walkthroughs.",
      },
      {
        id: "q_ws_acm_id",
        title: "ACM International Member ID (Optional)",
        type: "text",
        required: false,
        helpText: "Members receive priority seating and certificate badges.",
      },
    ],
  },
  {
    id: "hackathon",
    name: "Hackathon Registration",
    description: "Team-based sprints, project competitions, ideathons, and weekend hackathons.",
    badge: "Team Hackathon",
    defaultSettings: {
      collectEmail: true,
      limitOneResponsePerUser: true,
      allowResponseEdits: true,
      confirmationMessage:
        "Your team registration has been recorded for the ACM IARE Hackathon! The hackathon committee will verify team rosters and send Discord/Slack invitations shortly.",
      customClosedMessage: "Hackathon team registrations are now closed.",
    },
    questions: [
      {
        id: "q_hack_team_name",
        title: "Team Name",
        type: "text",
        required: true,
        helpText: "Unique name for your hackathon squad.",
      },
      {
        id: "q_hack_team_size",
        title: "Team Size",
        type: "dropdown",
        required: true,
        options: ["1 Member (Solo Innovator)", "2 Members", "3 Members", "4 Members (Full Squad)"],
      },
      {
        id: "q_hack_leader_name",
        title: "Team Leader - Full Name",
        type: "text",
        required: true,
      },
      {
        id: "q_hack_leader_roll",
        title: "Team Leader - Roll Number",
        type: "text",
        required: true,
      },
      {
        id: "q_hack_leader_email",
        title: "Team Leader - Email Address",
        type: "text",
        required: true,
      },
      {
        id: "q_hack_leader_phone",
        title: "Team Leader - WhatsApp Number",
        type: "text",
        required: true,
      },
      {
        id: "q_hack_members_info",
        title: "Team Members' Details (Name, Roll No, Branch, Email)",
        type: "paragraph",
        required: true,
        helpText: "List each additional teammate on a new line (e.g., 2. Jane Doe - 23951A05XX - CSE - jane@iare.ac.in).",
      },
      {
        id: "q_hack_track",
        title: "Preferred Problem Track",
        type: "multiple_choice",
        required: true,
        options: [
          "AI / Machine Learning & Intelligent Agents",
          "Web3, Distributed Systems & Cloud",
          "Cybersecurity, Privacy & Safe Tech",
          "Smart Campus & Open Innovation",
        ],
      },
      {
        id: "q_hack_portfolio",
        title: "Team GitHub / Portfolio / Devpost Link (Optional)",
        type: "text",
        required: false,
        helpText: "Showcase any previous projects or repositories.",
      },
    ],
  },
  {
    id: "seminar",
    name: "Seminar / Webinar Registration",
    description: "Distinguished speaker lectures, career panels, tech talks, and virtual webinars.",
    badge: "Lecture & Talk",
    defaultSettings: {
      collectEmail: true,
      limitOneResponsePerUser: true,
      allowResponseEdits: false,
      confirmationMessage:
        "Thank you for RSVPing for the ACM IARE Distinguished Talk! We look forward to seeing you at the auditorium.",
      customClosedMessage: "Registration has concluded for this session.",
    },
    questions: [
      ...STANDARD_ATTENDEE_QUESTIONS,
      {
        id: "q_sem_mode",
        title: "Attendance Mode",
        type: "multiple_choice",
        required: true,
        options: ["In-Person (Auditorium)", "Virtual (YouTube Live Stream)"],
      },
      {
        id: "q_sem_questions",
        title: "Questions for the Speaker (Q&A Session)",
        type: "paragraph",
        required: false,
        helpText: "Top questions will be asked directly to the speaker during the moderated Q&A.",
      },
      {
        id: "q_sem_referral",
        title: "How did you hear about this talk?",
        type: "checkboxes",
        required: false,
        options: [
          "ACM Student Chapter WhatsApp Group",
          "Class Announcement / Faculty",
          "Instagram (@acm_iare)",
          "Campus Noticeboard / Digital Displays",
          "Senior Student Recommendation",
        ],
      },
    ],
  },
  {
    id: "competition",
    name: "Technical Competition",
    description: "Competitive programming contests, algorithm sprints, code golf, and CTF challenges.",
    badge: "Contest & Algo",
    defaultSettings: {
      collectEmail: true,
      limitOneResponsePerUser: true,
      allowResponseEdits: true,
      confirmationMessage:
        "Your contest entry is registered! Contest platform credentials and problem links will be distributed via email 30 minutes before kick-off.",
      customClosedMessage: "Registrations have closed. Contest environment is now locked for contest launch.",
    },
    questions: [
      ...STANDARD_ATTENDEE_QUESTIONS,
      {
        id: "q_comp_handle",
        title: "Competitive Programming Handle (LeetCode / Codeforces / HackerRank)",
        type: "text",
        required: true,
        helpText: "Used for leaderboard verification and rating categorization.",
      },
      {
        id: "q_comp_lang",
        title: "Primary Contest Programming Language",
        type: "dropdown",
        required: true,
        options: ["C++ (GCC / C++20)", "Java (OpenJDK 17)", "Python (Python 3.11 / PyPy)", "C", "Go / Rust"],
      },
      {
        id: "q_comp_rating",
        title: "Self-Assessed Algorithmic Skill Level (1 = Novice, 5 = Grandmaster)",
        type: "scale",
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleMinLabel: "Novice",
        scaleMaxLabel: "Grandmaster",
      },
      {
        id: "q_comp_rules",
        title: "Honor Code & Plagiarism Policy",
        type: "checkboxes",
        required: true,
        options: [
          "I agree to follow the ACM IARE Code of Conduct and will not use unauthorized AI generators or consult others during individual contests.",
        ],
      },
    ],
  },
  {
    id: "general",
    name: "General Event Registration",
    description: "Standard, versatile chapter event registration covering all academic and community activities.",
    badge: "General Chapter Event",
    defaultSettings: {
      collectEmail: true,
      limitOneResponsePerUser: true,
      allowResponseEdits: true,
      confirmationMessage:
        "Thank you for registering with ACM IARE! You will receive confirmation and event updates via email.",
      customClosedMessage: "Registrations are currently closed for this event.",
    },
    questions: [
      ...STANDARD_ATTENDEE_QUESTIONS,
      {
        id: "q_gen_acm_status",
        title: "Are you an official ACM Member?",
        type: "multiple_choice",
        required: true,
        options: [
          "Yes, I hold an active ACM International Student Membership",
          "No, but I am interested in joining ACM IARE",
          "No, attending as a general IARE student",
        ],
      },
      {
        id: "q_gen_comments",
        title: "Any questions, special accommodations, or topics you want covered?",
        type: "paragraph",
        required: false,
      },
    ],
  },
  {
    id: "blank",
    name: "Blank Custom Form",
    description: "Start with an empty canvas and build a completely custom questionnaire from scratch.",
    badge: "Custom Slate",
    defaultSettings: {
      collectEmail: true,
      limitOneResponsePerUser: false,
      allowResponseEdits: true,
      confirmationMessage: "Thank you! Your response has been submitted successfully.",
      customClosedMessage: "This form is currently closed.",
    },
    questions: [
      {
        id: "q_blank_name",
        title: "Full Name",
        type: "text",
        required: true,
      },
      {
        id: "q_blank_email",
        title: "Email Address",
        type: "text",
        required: true,
      },
    ],
  },
];

export function getTemplateById(id: string): FormTemplate {
  return FORM_TEMPLATES.find((t) => t.id === id) || FORM_TEMPLATES[0];
}

export function createDefaultFormConfig(
  eventTitle: string,
  eventDescription: string,
  templateId = "workshop"
): FormConfiguration {
  const template = getTemplateById(templateId);
  return {
    formTitle: `Registration: ${eventTitle || "ACM Event"} | ACM IARE`,
    formDescription:
      (eventDescription ? `${eventDescription}\n\n` : "") +
      "ACM Student Chapter, Institute of Aeronautical Engineering (IARE), Dundigal, Hyderabad.\n" +
      "Please fill out this form accurately to reserve your seat.",
    settings: { ...template.defaultSettings },
    questions: template.questions.map((q, idx) => ({
      ...q,
      id: q.id || `q_${templateId}_${idx + 1}`,
      options: q.options ? [...q.options] : undefined,
    })),
    templateId,
    version: 1,
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}
