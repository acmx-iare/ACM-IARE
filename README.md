# ACM Student Chapter — Institute of Aeronautical Engineering (IARE)

Official web portal for the **ACM Student Chapter** at the **Institute of Aeronautical Engineering (IARE)**, Dundigal, Hyderabad, India.

Built with Next.js (App Router), TypeScript (Strict Mode), Tailwind CSS, and Lucide React. Designed with an understated, premium academic aesthetic reflecting the chapter's focus on computing excellence, algorithmic rigor, and software craftsmanship.

---

## Key Highlights

- **Academic Visual Identity**: Tailored color palette using Navy (`#14213D`), ACM Blue (`#2563EB`), Slate, and Teal accents. No generic AI gradients or arbitrary decorative floating shapes.
- **Centralized Content Store**: All institutional data, event schedules, team rosters, and gallery entries are maintained in [`src/data/chapter.ts`](src/data/chapter.ts) for effortless maintenance by chapter leads without touching code.
- **Full Public Route Coverage**:
  - **Home** (`/`): Chapter identity, hero, mission pillars, upcoming events, technical SIGs, team highlights, verified achievements, and membership CTA.
  - **About** (`/about`): Institutional background, NAAC 'A++' status, ACM global relationship distinction notice, SIG deep dive, governance bylaws, and FAQ.
  - **Events** (`/events`): Real-time searchable and filterable directory (Upcoming, Past, Hackathons, Workshops, Tech Talks, Open Source).
  - **Event Details** (`/events/[slug]`): Prerequisites, takeaways, resource mentors, and interactive registration modal with authenticated reference ticketing.
  - **Team** (`/team`): Categorized directory of Faculty Advisors, Executive Council Office Bearers, Technical Leads, and Committee Coordinators.
  - **Gallery & Achievements** (`/gallery`): Verified honors timeline (ICPC Regional qualification, SIH) and photographic event gallery with category filtering and lightbox modal.
  - **Contact & Join** (`/contact`): Tabbed interface for Student Membership Applications (with interest selection and SOP) and General Inquiries, paired with campus secretariat information and location details.
  - **Legal Policies** (`/privacy`, `/terms`): Student data protection charter and ACM Code of Ethics alignment.
  - **Custom 404** (`/not-found`): Branded academic not-found page with directory navigation shortcuts.
  - **SEO Infrastructure**: Auto-generated `sitemap.xml` and `robots.txt` with OpenGraph metadata and canonical tagging.

---

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/) + Optimized Custom Brand SVGs
- **Motion**: Fluid micro-animations with full `prefers-reduced-motion` compliance
- **Deployment**: [Vercel](https://vercel.com/) / Production Edge

---

## Getting Started Locally

### Prerequisites

- Node.js `v18.17+` (v20+ recommended)
- npm `v9+`

### Installation

```bash
# Clone the repository
git clone https://github.com/acmx-iare/ACM-IARE.git
cd ACM-IARE

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server with Turbopack |
| `npm run build` | Compiles optimized static and dynamic production build |
| `npm run start` | Launches production server |
| `npm run lint` | Runs ESLint and TypeScript code quality checks |

---

## Deployment to Vercel

1. Push your changes to GitHub repository:
   ```bash
   git add .
   git commit -m "feat: complete ACM IARE production web portal"
   git push origin main
   ```
2. Log into [Vercel](https://vercel.com) and import the `acmx-iare/ACM-IARE` repository.
3. Keep the default Next.js build command (`next build`) and output directory.
4. Add environment variables from `.env.example` in the Vercel project settings if connecting persistent backends.
5. Click **Deploy**.

---

## Institutional Affiliation

**Institute of Aeronautical Engineering (Autonomous)**  
Approved by AICTE, Affiliated to JNTUH, Accredited with NAAC 'A++' Grade  
Dundigal Road, Hyderabad - 500043, Telangana, India  
Website: [iare.ac.in](https://www.iare.ac.in)  
Email: [acm@iare.ac.in](mailto:acm@iare.ac.in)
