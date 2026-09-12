import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import PreferencesSettings from "../../components/common/PreferencesSettings";
import AccountSecuritySettings from "../../components/common/AccountSecuritySettings";
import NotificationSettings from "../../components/common/NotificationSettings";
import TraineeInformationSettings from "../../components/traineedashboard/TraineeInformationSettings";
import { supabase } from "../../supabaseClient";

const tabs = [
  {
    id: "personal",
    label: "Personal Information",
    icon: UserRound,
  },
  {
    id: "trainee",
    label: "Trainee Information",
    icon: ClipboardList,
  },
  {
    id: "security",
    label: "Account & Security",
    icon: LockKeyhole,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
  },
  {
    id: "preferences",
    label: "Preferences",
    icon: SlidersHorizontal,
  },
];

const notificationItems = [
  {
    id: "assessment_availability_notifications",
    title: "Assessment availability notifications",
    description:
      "Receive notifications when new assessments are available for you.",
  },
  {
    id: "assessment_schedule_reminders",
    title: "Assessment schedule reminders",
    description:
      "Receive reminders about your upcoming assessment schedules.",
  },
  {
    id: "assessment_reminder_notifications",
    title: "Assessment reminder notifications",
    description:
      "Receive reminders before your scheduled assessments.",
  },
  {
    id: "assessment_completed_notifications",
    title: "Assessment completion notifications",
    description:
      "Receive notifications after you complete an assessment.",
  },
  {
    id: "results_availability_notifications",
    title: "Results availability notifications",
    description:
      "Receive notifications when your assessment results are available.",
  },
  {
    id: "certificate_availability_notifications",
    title: "Certificate availability notifications",
    description:
      "Receive notifications when your certificates are available.",
  },
  {
    id: "system_announcements",
    title: "System announcements",
    description:
      "Receive important updates and announcements from the system.",
  },
];

const EMPTY_FORM = {
  fullName: "",
  birthDate: "",
  email: "",
  contactNumber: "",
};

function buildFullName(profile) {
  return [
    profile?.first_name,
    profile?.middle_name,
    profile?.last_name,
    profile?.suffix,
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" ");
}

function splitFullName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return {
      first_name: "",
      middle_name: null,
      last_name: "",
      suffix: null,
    };
  }

  if (parts.length === 1) {
    return {
      first_name: parts[0],
      middle_name: null,
      last_name: "",
      suffix: null,
    };
  }

  if (parts.length === 2) {
    return {
      first_name: parts[0],
      middle_name: null,
      last_name: parts[1],
      suffix: null,
    };
  }

  return {
    first_name: parts[0],
    middle_name: parts.slice(1, -1).join(" "),
    last_name: parts[parts.length - 1],
    suffix: null,
  };
}

function formatDateForInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatDateForDisplay(value) {
  if (!value) return "Not provided";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("personal");
  const [securityViewKey, setSecurityViewKey] = useState(0);

  const [form, setForm] = useState(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_FORM);

  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setLoadingProfile(true);
      setError("");

      try {
        const {
          data: { user: authenticatedUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!authenticatedUser) {
          throw new Error("No authenticated user was found.");
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            `
              id,
              email,
              role,
              is_approved,
              first_name,
              middle_name,
              last_name,
              suffix,
              date_of_birth,
              contact_number,
              registration_status,
              profile_photo_url,
              created_at
            `
          )
          .eq("id", authenticatedUser.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (!profileData) {
          throw new Error(
            "Your profile could not be found in the profiles table."
          );
        }

        if (!mounted) return;

        const databaseForm = {
          fullName: buildFullName(profileData),
          birthDate: formatDateForInput(profileData.date_of_birth),
          email: profileData.email || authenticatedUser.email || "",
          contactNumber: profileData.contact_number
            ? String(profileData.contact_number)
            : "",
        };

        setUser(authenticatedUser);
        setProfile(profileData);
        setForm(databaseForm);
        setInitialForm(databaseForm);
      } catch (loadError) {
        console.error("Error loading trainee profile:", loadError);

        if (mounted) {
          setError(
            loadError.message ||
            "Unable to load your account information."
          );
        }
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (field, value) => {
    setSaved(false);
    setError("");

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const saveChanges = async (event) => {
    event.preventDefault();

    if (!user?.id) {
      setError("Unable to identify the current user.");
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const nameParts = splitFullName(form.fullName);

      const updates = {
        first_name: nameParts.first_name,
        middle_name: nameParts.middle_name,
        last_name: nameParts.last_name || null,
        suffix: nameParts.suffix,
        date_of_birth: form.birthDate || null,
        contact_number: form.contactNumber || null,
        updated_at: new Date().toISOString(),
      };

      /*
       * Email is intentionally not updated here.
       *
       * Supabase Auth owns the login email. Email changes should continue
       * through the application's email verification/change-email flow.
       */
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select(
          `
            id,
            email,
            role,
            is_approved,
            first_name,
            middle_name,
            last_name,
            suffix,
            date_of_birth,
            contact_number,
            registration_status,
            profile_photo_url,
            created_at
          `
        )
        .single();

      if (updateError) {
        throw updateError;
      }

      const updatedForm = {
        fullName: buildFullName(updatedProfile),
        birthDate: formatDateForInput(updatedProfile.date_of_birth),
        email: updatedProfile.email || user.email || "",
        contactNumber: updatedProfile.contact_number
          ? String(updatedProfile.contact_number)
          : "",
      };

      setProfile(updatedProfile);
      setForm(updatedForm);
      setInitialForm(updatedForm);
      setSaved(true);
    } catch (saveError) {
      console.error("Error saving trainee profile:", saveError);

      setError(
        saveError.message ||
        "Unable to save your account information."
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelChanges = () => {
    setForm(initialForm);
    setSaved(false);
    setError("");
  };

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  const profileAvatar =
    profile?.profile_photo_url || "/trainee.jpg";

  const accountName = form.fullName || "Not provided";

  const accountStatus = profile?.is_approved
    ? "Active"
    : profile?.registration_status || "Pending Approval";

  const isActive = Boolean(profile?.is_approved);

  return (
    <div className="p-0 pb-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-950">
          My Account
        </h1>

        <p className="mt-1 text-base text-slate-600">
          Manage your personal information, account security, and
          preferences.
        </p>
      </header>

      {error && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.10)]">
        <h2 className="text-xl font-bold text-slate-950">
          Account Overview
        </h2>

        {loadingProfile ? (
          <div className="mt-5 grid gap-6 lg:grid-cols-[180px_1fr_1.25fr_0.9fr] lg:items-center">
            <div className="flex justify-center lg:justify-start">
              <div className="h-32 w-32 animate-pulse rounded-full bg-slate-200" />
            </div>

            <div className="space-y-4">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
              <div className="h-7 w-48 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
              <div className="h-7 w-28 animate-pulse rounded-full bg-slate-200" />
            </div>

            <div className="space-y-4">
              <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
              <div className="h-6 w-56 animate-pulse rounded bg-slate-200" />
            </div>

            <div className="space-y-4">
              <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
              <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
              <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-6 lg:grid-cols-[180px_1fr_1.25fr_0.9fr] lg:items-center">
            <div className="flex justify-center lg:justify-start">
              <img
                src={profileAvatar}
                alt={accountName}
                className="h-32 w-32 rounded-full border-4 border-slate-100 object-cover"
                onError={(event) => {
                  event.currentTarget.src = "/admin.jpg";
                }}
              />
            </div>

            <div className="border-slate-200 lg:border-r lg:pr-6">
              <p className="text-sm font-semibold text-slate-700">
                Full Name:
              </p>

              <p className="mt-2 text-xl font-bold text-slate-950">
                {accountName}
              </p>

              <p className="mt-5 text-sm font-semibold text-slate-700">
                Role:
              </p>

              <span className="mt-2 inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                {profile?.role || "Trainee"}
              </span>
            </div>

            <div className="border-slate-200 lg:border-r lg:pr-6">
              <p className="text-sm font-semibold text-slate-700">
                Email Address:
              </p>

              <p className="mt-2 break-words font-bold text-slate-950">
                {form.email || "Not provided"}
              </p>

              <div className="my-4 border-t border-slate-200" />

              <p className="text-sm font-semibold text-slate-700">
                Registration Date:
              </p>

              <p className="mt-2 font-bold text-slate-950">
                {formatDateForDisplay(profile?.created_at)}
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-700">
                Account Status:
              </p>

              <p className="flex items-center gap-3 font-semibold text-slate-900">
                <span
                  className={`h-3 w-3 rounded-full ${isActive
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                    }`}
                />

                {accountStatus}
              </p>

              <p className="flex items-center gap-3 font-semibold text-slate-900">
                <CheckCircle2
                  className="text-emerald-500"
                  size={21}
                />

                Email Verified
              </p>
            </div>
          </div>
        )}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_16px_rgba(15,23-42,0.10)]">
          <h2 className="text-xl font-bold text-slate-950">
            Settings
          </h2>

          <p className="mt-1 text-sm font-medium text-slate-700">
            Navigation
          </p>

          <nav className="mt-5 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSaved(false);

                    if (tab.id === "security") {
                      setSecurityViewKey((key) => key + 1);
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border-l-4 px-4 py-3 text-left text-sm font-semibold transition ${selected
                      ? "border-[#002f86] bg-slate-100 text-slate-950"
                      : "border-transparent text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  <Icon size={22} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.10)]">
          {activeTab === "preferences" ? (
            <PreferencesSettings />
          ) : activeTab === "security" ? (
            <AccountSecuritySettings resetKey={securityViewKey} />
          ) : activeTab === "notifications" ? (
            <NotificationSettings items={notificationItems} />
          ) : activeTab === "trainee" ? (
            <TraineeInformationSettings />
          ) : activeTab !== "personal" ? (
            <div>
              <h2 className="text-2xl font-bold text-slate-950">
                {activeTabData?.label}
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                {activeTabData?.label} settings.
              </p>

              <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                {activeTabData?.label} settings will appear here.
              </div>
            </div>
          ) : (
            <form onSubmit={saveChanges}>
              <h2 className="text-2xl font-bold text-slate-950">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                View and update your personal details.
              </p>

              {loadingProfile ? (
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item}>
                      <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                      <div className="mt-2 h-12 animate-pulse rounded-lg bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-800">
                    Full Name

                    <input
                      value={form.fullName}
                      onChange={(event) =>
                        updateField(
                          "fullName",
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label className="text-sm font-semibold text-slate-800">
                    Date of Birth

                    <span className="relative mt-2 block">
                      <CalendarDays
                        size={19}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                      />

                      <input
                        type="date"
                        value={form.birthDate}
                        onChange={(event) =>
                          updateField(
                            "birthDate",
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 pr-11 outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
                      />
                    </span>
                  </label>

                  <label className="text-sm font-semibold text-slate-800">
                    Email Address

                    <input
                      type="email"
                      value={form.email}
                      readOnly
                      className="mt-2 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600 outline-none"
                    />

                    <span className="mt-1 block text-xs font-normal text-slate-500">
                      Email changes are managed through account
                      verification.
                    </span>
                  </label>

                  <label className="text-sm font-semibold text-slate-800">
                    Contact Number

                    <input
                      value={form.contactNumber}
                      onChange={(event) =>
                        updateField(
                          "contactNumber",
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                {saved && (
                  <span className="mr-auto text-sm font-medium text-emerald-600">
                    Changes saved successfully.
                  </span>
                )}

                <button
                  type="button"
                  onClick={cancelChanges}
                  disabled={saving || loadingProfile}
                  className="rounded-lg border border-slate-400 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || loadingProfile}
                  className="rounded-lg bg-[#002f86] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(0,47,134,0.25)] transition hover:bg-[#00266b] disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}