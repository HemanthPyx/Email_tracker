# 📬 MailTracker — Feature Documentation

MailTracker is an automated email intelligence tool designed to solve a very specific modern problem: **forgetting which email address was used to register for a particular website or service.** 

By securely scanning your connected inboxes, MailTracker autonomously builds a searchable, central directory of all your digital accounts.

---

## 🚀 Core Features

### 1. Zero-Touch Automation (Inbox Scanning)
- **Historical Scanning:** Retroactively scans inboxes (up to 3 years back) to find accounts you created long ago.
- **Smart Detection Engine:** Uses multiple signals to detect registration emails:
  - **Subject Keywords:** Detects phrases like *"Welcome to"*, *"Verify your account"*, and *"Thanks for joining"*.
  - **Sender Pattern Recognition:** Identifies automated sending addresses (e.g., `noreply@`, `hello@`).
  - **Brand Extraction:** Automatically extracts the site/brand name from the sender alias or subject line.
- **Confidence Scoring:** Assigns a 0% to 100% confidence score to each detection to separate definite registrations from promotional spam.
- **Auto-Favicon Fetching:** Automatically pulls the logo/favicon of the detected website for visual recognition.

### 2. Multi-Account Management
- **Centralized Hub:** Connect an unlimited number of Gmail accounts into one single dashboard.
- **Account Categorization:** Tag accounts by their purpose (e.g., *Personal*, *Work*, *Gaming*, *Shopping*, *Finance*) for better organization.
- **Stat Tracking:** View exactly how many registrations are tied to each individual email account.
- **Independent Scanning:** Trigger manual scans for all accounts at once, or refresh accounts individually.

### 3. Powerful Search & Filtering
- **Instant Global Search:** Type a website name or domain into the search bar and instantly see which email address was used to sign up.
- **Granular Filters:** Filter your entire registration history by:
  - Specific connected email accounts
  - Email categories (e.g., "Show me all *Gaming* accounts")
- **Action Shortcuts:**
  - **One-Click Copy:** Copy the registered email address to your clipboard instantly.
  - **Direct Site Link:** Click a button to open the website directly in a new tab.

### 4. Interactive Dashboard & Analytics
- **At-a-Glance Metrics:** See total connected accounts, total unique site registrations, and the date of your last scan.
- **Visual Categorization:** A dynamic pie chart breaks down your digital footprint, showing you exactly how your registrations are distributed across your life categories (Personal vs. Work vs. Finance, etc.).
- **Recent Activity Feed:** A chronological timeline of the most recently detected website registrations.

### 5. Data Curation & Accuracy Tools
- **Verify Detections:** Mark uncertain detections as "Verified" with a single click to lock them in as accurate.
- **Dismiss False Positives:** Easily remove incorrect detections (like newsletters mistaken for registrations) to keep your database clean.

---

## 🔒 Security & Privacy Features

Because MailTracker handles sensitive inbox data, security is built into its core architecture:

- **OAuth 2.0 Authentication:** Passwords are never seen or stored. Authentication is handled entirely through Google's secure OAuth flow.
- **Strict Read-Only Access:** The application requests `gmail.readonly` scopes. It physically cannot send emails, delete emails, or modify your inbox in any way.
- **Stateless Verification (PKCE):** Uses Proof Key for Code Exchange to ensure the authentication flow cannot be intercepted.
- **Local Data Processing:** Email data is parsed locally by the backend. Your data isn't shared with or sold to third-party marketing services.

---

## 💻 Technical Capabilities

- **Modern Architecture:** Built with a decoupled React.js (Vite) frontend and a robust Django REST Framework backend.
- **JWT Session Management:** Uses secure JSON Web Tokens for API authentication and session persistence.
- **Responsive Design:** The UI is built with Tailwind CSS, ensuring the dashboard looks perfect on both desktop monitors and mobile devices.
- **Dark Mode Native:** A sleek, custom-designed dark theme designed to reduce eye strain.
