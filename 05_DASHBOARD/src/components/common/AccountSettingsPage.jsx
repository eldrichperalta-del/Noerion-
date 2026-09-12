import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import PreferencesSettings from "./PreferencesSettings";
import AccountSecuritySettings from "./AccountSecuritySettings";
import NotificationSettings from "./NotificationSettings";
import SystemPreferencesSettings from "./SystemPreferencesSettings";
import AssessmentPreferencesSettings from "../assessordashboard/AssessmentPreferencesSettings";
import { supabase } from "../../supabaseClient";

const commonTabs = [
  {
    id: "personal",
    label: "Personal Information",
    icon: UserRound,
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
  {
    id: "system",
    label: "System Preferences",
    icon: ClipboardList,
  },
];

const EMPTY_VALUES = {
  fullName: "",
  email: "",
  mainContact: "",
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
      middle_name: "",
      last_name: "",
      suffix: "",
    };
  }

  if (parts.length === 1) {
    return {
      first_name: parts[0],
      middle_name: "",
      last_name: "",
      suffix: "",
    };
  }

  if (parts.length === 2) {
    return {
      first_name: parts[0],
      middle_name: "",
      last_name: parts[1],
      suffix: "",
    };
  }

  return {
    first_name: parts[0],
    middle_name: parts.slice(1, -1).join(" "),
    last_name: parts[parts.length - 1],
    suffix: "",
  };
}

export default function AccountSettingsPage({
  role,
  avatar,
  officeLabel,
  officeValue,
  fields,
  initialValues,
  extraTabs = [],
  accreditation,
  hideSystemPreferences = false,
  notificationItems = [],
  showAssessmentPreferences = false,
}) {
  const [activeTab, setActiveTab] = useState("personal");
  const [securityViewKey, setSecurityViewKey] = useState(0);

  /*
   * Keep the supplied initial values instead of replacing the entire
   * object with only the fields available in the profiles table.
   *
   * This is important because admin/assessor-specific fields such as
   * position, office, center, qualification, and accreditation may come
   * from role-specific data sources.
   */
  const baseInitialValues = {
    ...EMPTY_VALUES,
    ...(initialValues || {}),
  };

  const [values, setValues] = useState(baseInitialValues);
  const [initialProfileValues, setInitialProfileValues] =
    useState(baseInitialValues);

  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const tabs = [
    ...commonTabs.slice(0, 3),
    ...extraTabs,
    ...commonTabs.slice(3),
  ].filter(
    (tab) => !(hideSystemPreferences && tab.id === "system")
  );

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

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

        const { data: profileData, error: profileError } =
          await supabase
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
                contact_number,
                registration_status,
                profile_photo_url
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

        const fullName = buildFullName(profileData);

        /*
         * Only overwrite fields that are actually represented by
         * the profiles table.
         *
         * Role-specific fields remain available from initialValues
         * until those fields are connected to their own tables.
         */
        const databaseValues = {
          ...baseInitialValues,
          fullName,
          email:
            profileData.email ||
            authenticatedUser.email ||
            "",
          mainContact: profileData.contact_number
            ? String(profileData.contact_number)
            : "",
        };

        setUser(authenticatedUser);
        setProfile(profileData);
        setValues(databaseValues);
        setInitialProfileValues(databaseValues);
      } catch (loadError) {
        console.error(
          "Error loading account profile:",
          loadError
        );

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

  const updateField = (key, value) => {
    setSaved(false);
    setError("");

    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    if (!user?.id || !profile) {
      setError("Unable to identify the current user.");
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const nameParts = splitFullName(values.fullName);

      const updates = {
        first_name: nameParts.first_name,
        middle_name: nameParts.middle_name || null,
        last_name: nameParts.last_name || null,
        suffix: nameParts.suffix || null,
        contact_number: values.mainContact || null,
        updated_at: new Date().toISOString(),
      };

      /*
       * Email is intentionally NOT updated in profiles here.
       *
       * Supabase Auth owns the login email. Email changes should continue
       * through the Email Verification / Change Email flow.
       */

      const { data: updatedProfile, error: updateError } =
        await supabase
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
              contact_number,
              registration_status,
              profile_photo_url
            `
          )
          .single();

      if (updateError) {
        throw updateError;
      }

      const updatedValues = {
        ...values,
        fullName: buildFullName(updatedProfile),
        email:
          updatedProfile.email ||
          user.email ||
          "",
        mainContact: updatedProfile.contact_number
          ? String(updatedProfile.contact_number)
          : "",
      };

      setProfile(updatedProfile);
      setValues(updatedValues);
      setInitialProfileValues(updatedValues);
      setSaved(true);
    } catch (saveError) {
      console.error(
        "Error saving account profile:",
        saveError
      );

      setError(
        saveError.message ||
        "Unable to save your account information."
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelChanges = () => {
    setValues(initialProfileValues);
    setSaved(false);
    setError("");
  };

  const profileAvatar =
    profile?.profile_photo_url ||
    avatar ||
    "/admin.jpg";

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
              <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
              <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
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
                alt={values.fullName || "Profile"}
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
                {values.fullName || "Not provided"}
              </p>

              <p className="mt-5 text-sm font-semibold text-slate-700">
                Role:
              </p>

              <span className="mt-2 inline-flex rounded-full bg-[#002f86] px-3 py-1 text-sm font-semibold capitalize text-white">
                {profile?.role || role || "User"}
              </span>
            </div>

            <div className="border-slate-200 lg:border-r lg:pr-6">
              <p className="text-sm font-semibold text-slate-700">
                {officeLabel}:
              </p>

              <p className="mt-2 font-bold text-slate-950">
                {officeValue || "Administrator Account"}
              </p>

              {accreditation && (
                <>
                  <div className="my-4 border-t border-slate-200" />

                  <p className="text-sm font-semibold text-slate-700">
                    Accreditation Status:
                  </p>

                  <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                    {accreditation}
                  </span>
                </>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-700">
                Account Status:
              </p>

              <p className="flex items-center gap-3 font-semibold text-slate-900">
                <span
                  className={`h-3 w-3 rounded-full ${profile?.is_approved
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                    }`}
                />

                {profile?.is_approved
                  ? "Active"
                  : "Pending Approval"}
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
        <aside className="h-fit rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.10)]">
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
                      setSecurityViewKey(
                        (key) => key + 1
                      );
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
            <AccountSecuritySettings
              resetKey={securityViewKey}
            />
          ) : activeTab === "notifications" ? (
            <NotificationSettings
              items={notificationItems}
            />
          ) : activeTab === "assessment" &&
            showAssessmentPreferences ? (
            <AssessmentPreferencesSettings />
          ) : activeTab === "system" ? (
            <SystemPreferencesSettings />
          ) : activeTab !== "personal" ? (
            <div>
              <h2 className="text-2xl font-bold text-slate-950">
                {activeTabData?.label}
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Manage{" "}
                {activeTabData?.label?.toLowerCase()} settings.
              </p>

              <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                {activeTabData?.label} settings will appear
                here.
              </div>
            </div>
          ) : (
            <form onSubmit={saveProfile}>
              <h2 className="text-2xl font-bold text-slate-950">
                Personal Information Details
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                View and update your personal details.
              </p>

              {loadingProfile ? (
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {fields.map((field) => (
                    <div key={field.id}>
                      <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                      <div className="mt-2 h-12 animate-pulse rounded-lg bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {fields.map((field) => (
                    <label
                      key={field.id}
                      className="text-sm font-semibold text-slate-800"
                    >
                      {field.label}

                      {field.type === "select" ? (
                        <select
                          value={values[field.id] || ""}
                          onChange={(event) =>
                            updateField(
                              field.id,
                              event.target.value
                            )
                          }
                          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
                        >
                          {field.options.map((option) => (
                            <option
                              key={option}
                              value={option}
                            >
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type || "text"}
                          value={values[field.id] || ""}
                          onChange={(event) =>
                            updateField(
                              field.id,
                              event.target.value
                            )
                          }
                          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
                        />
                      )}
                    </label>
                  ))}
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