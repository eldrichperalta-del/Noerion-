import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Megaphone,
  ShieldAlert,
  UserPlus,
  Award,
  Clock,
  CheckCircle2,
  Search,
  Users,
  UserCheck,
} from "lucide-react";

import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../supabaseClient";
import { createNotification } from "../../services/notificationService";

/*
|--------------------------------------------------------------------------
| ROLE-SPECIFIC NOTIFICATION SETTINGS
|--------------------------------------------------------------------------
|
| These IDs MUST match the column names in:
| public.notification_preferences
|
*/

const ROLE_NOTIFICATION_ITEMS = {
  admin: [
    {
      id: "assessment_notifications",
      title: "Assessment notifications",
      description:
        "Receive notifications when new assessments are created or updated.",
      icon: ClipboardCheck,
    },
    {
      id: "assessment_schedule_notifications",
      title: "Assessment schedule notifications",
      description:
        "Receive reminders and updates regarding assessment schedules.",
      icon: CalendarDays,
    },
    {
      id: "assessment_completion_notifications",
      title: "Assessment completion notifications",
      description:
        "Receive notifications when assessments are completed.",
      icon: CheckCircle2,
    },
    {
      id: "results_notifications",
      title: "Results notifications",
      description:
        "Receive notifications when assessment results are available.",
      icon: FileText,
    },
    {
      id: "certificate_notifications",
      title: "Certificate notifications",
      description:
        "Receive notifications when certificates are generated or issued.",
      icon: Award,
    },
    {
      id: "user_registration_notifications",
      title: "User registration notifications",
      description:
        "Receive notifications when new users register in the system.",
      icon: UserPlus,
    },
    {
      id: "system_announcements",
      title: "System announcements",
      description:
        "Receive important updates and announcements from the system.",
      icon: Megaphone,
    },
    {
      id: "administrative_alerts",
      title: "Administrative alerts",
      description:
        "Receive critical system and administrative alerts.",
      icon: ShieldAlert,
    },
  ],

  assessor: [
    {
      id: "assessment_assignment_notifications",
      title: "Assessment assignment notifications",
      description:
        "Receive notifications when new assessments are assigned.",
      icon: ClipboardCheck,
    },
    {
      id: "upcoming_assessment_reminders",
      title: "Upcoming assessment reminders",
      description:
        "Receive reminders about your upcoming scheduled assessments.",
      icon: Clock,
    },
    {
      id: "assessment_schedule_changes",
      title: "Assessment schedule changes",
      description:
        "Receive alerts when there are changes to assessment schedules.",
      icon: CalendarDays,
    },
    {
      id: "trainee_submission_notifications",
      title: "Trainee submission notifications",
      description:
        "Receive notifications when trainees submit their work or assessments.",
      icon: FileText,
    },
    {
      id: "evaluation_reminders",
      title: "Evaluation reminders",
      description:
        "Receive reminders to complete pending evaluations.",
      icon: UserCheck,
    },
    {
      id: "results_related_notifications",
      title: "Results-related notifications",
      description:
        "Receive notifications regarding assessment results.",
      icon: Search,
    },
    {
      id: "certificate_related_notifications",
      title: "Certificate-related notifications",
      description:
        "Receive notifications regarding certificate statuses.",
      icon: Award,
    },
    {
      id: "system_announcements",
      title: "System announcements",
      description:
        "Receive important updates and announcements from the system.",
      icon: Megaphone,
    },
  ],

  trainee: [
    {
      id: "assessment_availability_notifications",
      title: "Assessment availability notifications",
      description:
        "Receive notifications when new assessments are available for you.",
      icon: ClipboardCheck,
    },
    {
      id: "assessment_schedule_reminders",
      title: "Assessment schedule reminders",
      description:
        "Receive reminders about your upcoming assessment schedules.",
      icon: CalendarDays,
    },
    {
      id: "assessment_reminder_notifications",
      title: "Assessment reminder notifications",
      description:
        "Receive reminders before your scheduled assessments.",
      icon: Clock,
    },
    {
      id: "assessment_completed_notifications",
      title: "Assessment completion notifications",
      description:
        "Receive notifications after you complete an assessment.",
      icon: CheckCircle2,
    },
    {
      id: "results_availability_notifications",
      title: "Results availability notifications",
      description:
        "Receive notifications when your assessment results are available.",
      icon: FileText,
    },
    {
      id: "certificate_availability_notifications",
      title: "Certificate availability notifications",
      description:
        "Receive notifications when your certificates are available.",
      icon: Award,
    },
    {
      id: "system_announcements",
      title: "System announcements",
      description:
        "Receive important updates and announcements from the system.",
      icon: Megaphone,
    },
  ],
};

/*
|--------------------------------------------------------------------------
| ROLE NORMALIZATION
|--------------------------------------------------------------------------
*/

function normalizeRole(scope) {
  const value = String(scope || "").toLowerCase();

  if (value.includes("admin")) {
    return "admin";
  }

  if (value.includes("assessor")) {
    return "assessor";
  }

  if (value.includes("trainee")) {
    return "trainee";
  }

  return "trainee";
}

/*
|--------------------------------------------------------------------------
| DEFAULT BOOLEAN VALUES
|--------------------------------------------------------------------------
*/

function createDefaultState(items, emailEnabled = true) {
  const state = {};

  items.forEach((item) => {
    state[item.id] = true;
  });

  state.email_notifications = emailEnabled;

  return state;
}

export default function NotificationSettings({ items }) {
  const { userId, dashboardScope } = useTheme();

  /*
  |--------------------------------------------------------------------------
  | DETERMINE CURRENT ROLE
  |--------------------------------------------------------------------------
  */

  const role = normalizeRole(dashboardScope);

  /*
  |--------------------------------------------------------------------------
  | USE DATABASE-BASED ROLE SETTINGS
  |
  | `items` is retained for compatibility with the existing Settings page,
  | but the actual notification IDs now come from the database schema.
  |--------------------------------------------------------------------------
  */

  const notificationItems = useMemo(() => {
    const roleItems = ROLE_NOTIFICATION_ITEMS[role] || [];

    /*
     * If the parent provides items, we still preserve its ordering/title
     * where possible, but the database IDs remain authoritative.
     */
    if (!Array.isArray(items) || items.length === 0) {
      return roleItems;
    }

    const suppliedMap = new Map(
      items.map((item) => [item.id, item])
    );

    return roleItems.map((item) => ({
      ...item,
      title: suppliedMap.get(item.id)?.title || item.title,
      description:
        suppliedMap.get(item.id)?.description || item.description,
    }));
  }, [items, role]);

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [enabled, setEnabled] = useState(() =>
    createDefaultState(notificationItems)
  );

  const [delivery, setDelivery] = useState("Email");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [saved, setSaved] = useState(false);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD PREFERENCES FROM SUPABASE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let isMounted = true;

    async function loadPreferences() {
      if (!userId) {
        if (isMounted) {
          setLoading(false);
        }

        return;
      }

      setLoading(true);
      setError("");
      setSaved(false);

      try {
        /*
         * We use the authenticated user's ID.
         */
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          throw new Error("No authenticated user found.");
        }

        /*
         * Fetch this user's notification preferences.
         */
        const {
          data: preferences,
          error: preferencesError,
        } = await supabase
          .from("notification_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (preferencesError) {
          throw preferencesError;
        }

        /*
         * If the user does not have a preference row yet,
         * create one using the database defaults.
         */
        if (!preferences) {
          const defaultState =
            createDefaultState(notificationItems);

          const newPreferences = {
            user_id: user.id,
            role,
          };

          notificationItems.forEach((item) => {
            newPreferences[item.id] =
              defaultState[item.id];
          });

          newPreferences.email_notifications = true;

          const {
            error: insertError,
          } = await supabase
            .from("notification_preferences")
            .insert(newPreferences);

          if (insertError) {
            throw insertError;
          }

          if (isMounted) {
            setEnabled(defaultState);
            setDelivery("Email");
          }

          return;
        }

        /*
         * Convert database values into the React state.
         */
        const loadedState = {};

        notificationItems.forEach((item) => {
          loadedState[item.id] =
            preferences[item.id] !== false;
        });

        const emailEnabled =
          preferences.email_notifications !== false;

        if (isMounted) {
          setEnabled(loadedState);
          setDelivery(
            emailEnabled ? "Email" : "In-app"
          );
        }
      } catch (loadError) {
        console.error(
          "Error loading notification preferences:",
          loadError
        );

        if (isMounted) {
          setError(
            "Unable to load your notification preferences."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, [userId, role, notificationItems]);

  /*
  |--------------------------------------------------------------------------
  | TOGGLE NOTIFICATION
  |--------------------------------------------------------------------------
  */

  const toggleNotification = (id) => {
    setEnabled((current) => ({
      ...current,
      [id]: !current[id],
    }));

    setSaved(false);
    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | SAVE TO SUPABASE
  |--------------------------------------------------------------------------
  */

  const save = async () => {
    if (!userId) {
      setError("No authenticated user found.");
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      /*
       * We deliberately do NOT use upsert here.
       *
       * Your current table has a primary key on `id`, but we have not
       * confirmed a UNIQUE constraint on `user_id`.
       *
       * Therefore:
       *   1. Find the existing row.
       *   2. UPDATE it if it exists.
       *   3. INSERT it if it doesn't.
       */

      const {
        data: existingPreferences,
        error: findError,
      } = await supabase
        .from("notification_preferences")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (findError) {
        throw findError;
      }

      const preferenceData = {
        role,
        email_notifications: delivery === "Email",
      };

      notificationItems.forEach((item) => {
        preferenceData[item.id] =
          Boolean(enabled[item.id]);
      });

      let saveError = null;

      if (existingPreferences?.id) {
        /*
         * UPDATE existing preference row.
         */
        const {
          error: updateError,
        } = await supabase
          .from("notification_preferences")
          .update(preferenceData)
          .eq("id", existingPreferences.id);

        saveError = updateError;
      } else {
        /*
         * INSERT preference row.
         */
        const {
          error: insertError,
        } = await supabase
          .from("notification_preferences")
          .insert({
            user_id: userId,
            ...preferenceData,
          });

        saveError = insertError;
      }

      if (saveError) {
        throw saveError;
      }

      setSaved(true);
    } catch (saveError) {
      console.error(
        "Error saving notification preferences:",
        saveError
      );

      setError(
        "Unable to save your notification preferences. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CANCEL
  |
  | Reload the actual database values rather than using localStorage.
  |--------------------------------------------------------------------------
  */

  const cancel = async () => {
    if (!userId) {
      return;
    }

    setLoading(true);
    setSaved(false);
    setError("");

    try {
      const {
        data: preferences,
        error: preferencesError,
      } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (preferencesError) {
        throw preferencesError;
      }

      if (preferences) {
        const restoredState = {};

        notificationItems.forEach((item) => {
          restoredState[item.id] =
            preferences[item.id] !== false;
        });

        setEnabled(restoredState);

        setDelivery(
          preferences.email_notifications !== false
            ? "Email"
            : "In-app"
        );
      } else {
        const defaultState =
          createDefaultState(notificationItems);

        setEnabled(defaultState);
        setDelivery("Email");
      }
    } catch (cancelError) {
      console.error(
        "Error restoring notification preferences:",
        cancelError
      );

      setError(
        "Unable to restore your saved notification preferences."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-950">
          Notifications
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Manage your notification preferences.
        </p>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm font-medium text-slate-500">
          Loading notification preferences...
        </div>
      </div>
    );
  }

  const sendTestNotification = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("[NotificationSettings] No authenticated user found.");
      return;
    }

    const result = await createNotification({
      recipientId: user.id,
      type: "results",
      title: "Test Notification",
      message: "The notification system is connected.",
    });

    console.log(
      "[NotificationSettings] Test notification result:",
      result
    );
  };
  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-950">
        Notifications
      </h2>

      <p className="mt-1 text-sm text-slate-600">
        Manage your notification preferences.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {notificationItems.map((item) => {
          const Icon = item.icon || Bell;
          const isEnabled = enabled[item.id];

          return (
            <div
              key={item.id}
              className="flex items-center gap-4 border-b border-slate-200 px-4 py-3.5"
            >
              <Icon
                className="shrink-0 text-slate-700"
                size={20}
              />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">
                  {item.title}
                </p>

                <p className="mt-0.5 text-xs text-slate-600">
                  {item.description}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isEnabled}
                aria-label={item.title}
                onClick={() =>
                  toggleNotification(item.id)
                }
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${isEnabled
                  ? "bg-blue-700"
                  : "bg-slate-300"
                  }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${isEnabled
                    ? "left-6"
                    : "left-1"
                    }`}
                />
              </button>
            </div>
          );
        })}

        {/* ================================================================
            EMAIL NOTIFICATION PREFERENCE
        ================================================================= */}

        <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Bell
              className="shrink-0 text-slate-700"
              size={20}
            />

            <div>
              <p className="text-sm font-bold text-slate-900">
                Email notification preference
              </p>

              <p className="mt-0.5 text-xs text-slate-600">
                Choose whether email notifications are enabled.
              </p>
            </div>
          </div>

          <span className="relative block sm:w-40">
            <select
              value={delivery}
              onChange={(event) => {
                setDelivery(event.target.value);
                setSaved(false);
                setError("");
              }}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2 pr-9 text-sm font-semibold text-slate-800 outline-none focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
            >
              <option value="Email">
                Email
              </option>

              <option value="In-app">
                In-app
              </option>
            </select>

            <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </div>
      </div>

      {/* ================================================================
          ACTIONS
      ================================================================= */}

      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        {saved && (
          <span className="mr-auto text-sm font-medium text-emerald-600">
            Notification preferences saved.
          </span>
        )}

        <button
          type="button"
          onClick={cancel}
          disabled={saving}
          className="rounded-lg border border-slate-400 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-[#002f86] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(0,47,134,0.25)] transition hover:bg-[#00266b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        
      </div>
    </div>
  );
}

