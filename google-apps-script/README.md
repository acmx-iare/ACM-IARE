# Google Apps Script & Google Sheets Automation Setup Guide

This guide explains how to connect your **ACM IARE** website to Google Sheets and Google Forms so that whenever you create an event in the Admin Dashboard, a **real Google Form** is created in your Google account and attendee data is saved to Google Sheets.

---

## 1. Create Your Google Spreadsheet

1. Go to [Google Sheets](https://sheets.new) and create a new blank spreadsheet.
2. Name it: **`ACM IARE - Events & Registrations Registry`**.
3. Copy your **Spreadsheet ID** from the URL bar in your browser:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID_HERE/edit
   ```

---

## 2. Paste the Script Code

1. In your Google Sheet, click **Extensions** → **Apps Script**.
2. Rename the project at top left to: **`ACM-IARE-Automation`**.
3. Delete any default code in `Code.gs` and paste the entire contents of [`google-apps-script/Code.gs`](./Code.gs).
4. Click the **Save** icon (disk icon).

---

## 3. Run One-Click Initialization (`setupAll`)

Instead of manually creating sheets and tabs, run the built-in helper:

1. In the toolbar at the top of Apps Script, find the function dropdown (it might say `myFunction` or `doPost`).
2. Click the dropdown and select **`setupAll`**.
3. Click **Run**.
4. A popup will ask for **Authorization**:
   - Click **Review permissions**.
   - Select your Google account.
   - Click **Advanced** (at the bottom of the prompt).
   - Click **Go to ACM-IARE-Automation (unsafe)**.
   - Click **Allow**.
5. Once finished, check the execution log at the bottom. It will confirm:
   - All 5 tabs initialized: **`Events`**, **`FormRegistry`**, **`Registrations`**, **`AuditLog`**, **`FormConfigurations`**.
   - Script properties configured with your API key.
   - Automatic form-submit trigger installed.

---

## 4. Deploy as a Web App (CRITICAL SETTING)

> [!IMPORTANT]
> The setting **"Who has access"** MUST be set to **"Anyone"**.
> If it is set to "Only myself", Google will block all calls from the website with an HTTP 401 login screen.

### If you are deploying for the first time:
1. Click **Deploy** (blue button top right) → **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in:
   - **Description**: `ACM IARE Event Automation v2`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: **`Anyone`**  *(REQUIRED!)*
4. Click **Deploy**.
5. Copy the **Web app URL** (starts with `https://script.google.com/macros/s/.../exec`).

### If you ALREADY have a deployment and need to update it:
1. Click **Deploy** → **Manage deployments**.
2. Click the **Pencil (Edit)** icon next to your active deployment.
3. Under **Version**, select **`New version`**.
4. Ensure **Who has access** is set to **`Anyone`**.
5. Click **Deploy**.
6. Copy the Web app URL.

---

## 5. Add the URL to Your Website

Open `.env.local` in your website root folder (`d:\ACM IARE\.env.local`) and paste your URL:

```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ACTUAL_DEPLOYMENT_ID/exec
GOOGLE_APPS_SCRIPT_API_KEY=9e21743b9e6f149ff0f73f369b17dea6f20041913ae3b5565ccc8552041d67cf
ADMIN_PASSWORD=acmiare2026admin
```

Restart your Next.js server so it loads the updated `.env.local`.

---

## 6. How It Works

1. **Admin creates an event**: In `/admin/events/new`, submit the event details.
2. **Real Google Form created**: Next.js sends the data to your Google Apps Script, which runs `FormApp.create()`.
3. **Connected to Google Sheets**: The form's responses are automatically linked to your Google Sheet.
4. **Public Link**: The real Google Form URL (e.g., `https://docs.google.com/forms/d/e/.../viewform`) is saved and displayed on the event page.
5. **Attendee registers**: When a student clicks "Register on Official Google Form", they submit the real Google Form, and their response lands in your spreadsheet's `Registrations` tab.
6. **Admin deletes an event**: Clicking the Delete icon in `/admin/events` removes the event from the website and Google Sheets, and safely closes the linked Google Form.
