/**
 * Client for communicating with the deployed Google Apps Script Web App
 */

export interface AppsScriptResponse<T = unknown> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
  formId?: string;
  formUrl?: string;
  editUrl?: string;
  formStatus?: string;
  events?: unknown[];
  registrations?: unknown[];
  [key: string]: unknown;
}

export async function callAppsScript<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<AppsScriptResponse<T>> {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const apiKey = process.env.GOOGLE_APPS_SCRIPT_API_KEY || "9e21743b9e6f149ff0f73f369b17dea6f20041913ae3b5565ccc8552041d67cf";

  if (!scriptUrl) {
    return {
      success: false,
      error: "GOOGLE_APPS_SCRIPT_URL is not configured in environment variables.",
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout for Form creation & spreadsheet linking

    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // GAS prefers text/plain for CORS without preflight
      },
      body: JSON.stringify({
        apiKey,
        action,
        payload,
      }),
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await response.text();

    // Check if Google returned an HTML login redirect (happens when "Who has access" is not "Anyone")
    if (
      response.status === 401 ||
      text.includes("accounts.google.com/ServiceLogin") ||
      text.includes("<title>Google Accounts</title>") ||
      text.includes("Sorry, unable to open the file")
    ) {
      return {
        success: false,
        error:
          "Google Apps Script access blocked (HTTP 401 / Google Login redirect). In your Google Sheet Apps Script editor, click Deploy -> Manage deployments -> Edit (pencil icon) -> set 'Who has access' to 'Anyone' -> Deploy (New version).",
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: `Google Apps Script returned HTTP ${response.status}: ${response.statusText}`,
      };
    }

    try {
      const json = JSON.parse(text) as AppsScriptResponse<T>;
      return json;
    } catch {
      return {
        success: false,
        error: `Invalid response format from Google Apps Script: ${text.slice(0, 200)}`,
      };
    }
  } catch (err: unknown) {
    if (err instanceof Error && (err.name === "AbortError" || err.message.toLowerCase().includes("abort"))) {
      return {
        success: false,
        error:
          "Google Apps Script request timed out after 60s. Generating a customized Google Form, creating questions, and linking the responses spreadsheet takes 20-40 seconds. Please check your Google Drive/Forms to see if the form was created, or click submit again.",
      };
    }
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Failed to connect to Google Apps Script: ${errorMessage}`,
    };
  }
}
