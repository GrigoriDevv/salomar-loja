const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const POLICY_VERSION = "privacy-1.0";

const VISITOR_KEY = "salomar_visitor_id";
const PREFS_KEY = "salomar_consent_prefs";
export const PRIVACY_CENTER_EVENT = "salomar:open-privacy-center";

export type ConsentCategory = "essential" | "analytics" | "marketing";

export type ConsentPreferences = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  policyVersion: string;
  savedAt: string;
};

export const DEFAULT_PREFERENCES: Omit<
  ConsentPreferences,
  "savedAt"
> = {
  essential: true,
  analytics: false,
  marketing: false,
  policyVersion: POLICY_VERSION,
};

function authHeader(): HeadersInit {
  try {
    const token = localStorage.getItem("salomar-access-token");
    return token
      ? {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
      : { "Content-Type": "application/json" };
  } catch {
    return { "Content-Type": "application/json" };
  }
}

export function getVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return `v-session-${Date.now()}`;
  }
}

export function getPreferences(): ConsentPreferences | null {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentPreferences;
    if (
      typeof parsed?.analytics !== "boolean" ||
      typeof parsed?.marketing !== "boolean"
    ) {
      return null;
    }
    return {
      ...parsed,
      essential: true,
      policyVersion: parsed.policyVersion || POLICY_VERSION,
    };
  } catch {
    return null;
  }
}

export function hasConsent(category: "analytics" | "marketing"): boolean {
  const prefs = getPreferences();
  if (!prefs) return false;
  return Boolean(prefs[category]);
}

/**
 * Gate for future analytics/marketing scripts (GA, Meta Pixel, etc.).
 * Call only after checking hasConsent(category).
 */
export function runIfConsented(
  category: "analytics" | "marketing",
  fn: () => void,
): void {
  if (hasConsent(category)) {
    fn();
  }
}

export function openPrivacyCenter(): void {
  window.dispatchEvent(new CustomEvent(PRIVACY_CENTER_EVENT));
}

export async function savePreferences(input: {
  analytics: boolean;
  marketing: boolean;
}): Promise<ConsentPreferences> {
  const prefs: ConsentPreferences = {
    essential: true,
    analytics: input.analytics,
    marketing: input.marketing,
    policyVersion: POLICY_VERSION,
    savedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota */
  }

  const body: {
    visitorId?: string;
    categories: {
      essential: true;
      analytics: boolean;
      marketing: boolean;
    };
    policyVersion: string;
  } = {
    categories: {
      essential: true,
      analytics: prefs.analytics,
      marketing: prefs.marketing,
    },
    policyVersion: POLICY_VERSION,
  };

  const headers = authHeader();
  const hasAuth =
    typeof headers === "object" &&
    "Authorization" in headers &&
    Boolean((headers as Record<string, string>).Authorization);

  if (!hasAuth) {
    body.visitorId = getVisitorId();
  }

  try {
    await fetch(new URL("/consent", API_URL), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    /* offline / API down — local prefs still apply */
  }

  window.dispatchEvent(
    new CustomEvent("salomar:consent-updated", { detail: prefs }),
  );

  return prefs;
}
