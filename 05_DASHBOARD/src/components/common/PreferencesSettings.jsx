import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Globe2,
  Monitor,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

/* =========================================================
   AVAILABLE LANGUAGES
   ========================================================= */

const languageCodes = ["en", "fil", "es", "ja"];

const displayNames = new Intl.DisplayNames(["en"], {
  type: "language",
});

/* =========================================================
   SELECT FIELD
   ========================================================= */

function SelectField({
  value,
  onChange,
  options,
  getLabel = (option) => option,
}) {
  return (
    <span className="relative block w-full sm:w-72">
      <select
        value={value}
        onChange={onChange}
        className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {getLabel(option)}
          </option>
        ))}
      </select>

      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
        size={18}
      />
    </span>
  );
}

/* =========================================================
   PREFERENCE ROW
   ========================================================= */

function PreferenceRow({
  icon: Icon,
  title,
  description,
  children,
  last = false,
}) {
  return (
    <div
      className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between ${last ? "" : "border-b border-slate-200"
        }`}
    >
      <div className="flex items-center gap-4">
        <Icon
          className="shrink-0 text-slate-700"
          size={23}
        />

        <div>
          <p className="text-sm font-bold text-slate-900">
            {title}
          </p>

          <p className="mt-0.5 text-sm text-slate-600">
            {description}
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}

/* =========================================================
   PREFERENCES SETTINGS
   ========================================================= */

export default function PreferencesSettings() {
  const {
    preferences,
    updatePreferences,
    savePreferences,
  } = useTheme();

  const { t } = useTranslation();

  const [draft, setDraft] = useState(preferences);

  const [previewDate, setPreviewDate] =
    useState("2026-08-17");

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  /* =======================================================
     TIME ZONES
     ======================================================= */

  const timeZones = useMemo(
    () =>
      Intl.supportedValuesOf?.("timeZone") || [
        "Asia/Manila",
      ],
    []
  );

  /* =======================================================
     LANGUAGES
     ======================================================= */

  const languages = useMemo(
    () =>
      languageCodes.map((code) => ({
        code,
        label: displayNames.of(code) || code,
      })),
    []
  );

  /* =======================================================
     KEEP DRAFT SYNCHRONIZED
     ======================================================= */

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  /* =======================================================
     UPDATE DRAFT
     ======================================================= */

  const updateDraft = (updates) => {
    const next = {
      ...draft,
      ...updates,
    };

    setDraft(next);

    setSaved(false);
    setError("");

    /*
     * Language and theme are applied immediately.
     * Save Changes will persist them to the user's account.
     */
    if (updates.language || updates.theme) {
      updatePreferences(updates);
    }
  };

  /* =======================================================
     SAVE PREFERENCES
     ======================================================= */

  const save = async () => {
    try {
      setError("");

      await savePreferences(draft);

      setSaved(true);
    } catch (err) {
      console.error(
        "Failed to save preferences:",
        err
      );

      setError(
        "Preferences were applied locally but could not be saved to your account."
      );
    }
  };

  /* =======================================================
     CANCEL
     ======================================================= */

  const cancel = () => {
    setDraft(preferences);

    updatePreferences({
      language: preferences.language,
      theme: preferences.theme,
    });

    setSaved(false);
    setError("");
  };

  /* =======================================================
     UI
     ======================================================= */

  return (
    <div>
      {/* ===================================================
          TITLE
          =================================================== */}

      <h2 className="text-2xl font-bold text-slate-950">
        {t("preferences.title")}
      </h2>

      <p className="mt-1 text-sm text-slate-600">
        {t("preferences.description")}
      </p>

      {/* ===================================================
          PREFERENCES
          =================================================== */}

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">

        {/* =================================================
            LANGUAGE
            ================================================= */}

        <PreferenceRow
          icon={Globe2}
          title={t("preferences.language")}
          description={t(
            "preferences.languageDescription"
          )}
        >
          <SelectField
            value={draft.language}
            onChange={(event) =>
              updateDraft({
                language: event.target.value,
              })
            }
            options={languages.map(
              (language) => language.code
            )}
            getLabel={(code) =>
              displayNames.of(code) || code
            }
          />
        </PreferenceRow>

        {/* =================================================
            TIME ZONE
            ================================================= */}

        <PreferenceRow
          icon={Clock3}
          title={t("preferences.timeZone")}
          description={t(
            "preferences.timeZoneDescription"
          )}
        >
          <SelectField
            value={draft.timeZone}
            onChange={(event) =>
              updateDraft({
                timeZone: event.target.value,
              })
            }
            options={timeZones}
          />
        </PreferenceRow>

        {/* =================================================
            DATE FORMAT
            ================================================= */}

        <PreferenceRow
          icon={CalendarDays}
          title={t("preferences.dateFormat")}
          description={t(
            "preferences.dateFormatDescription"
          )}
        >
          <div className="w-full sm:w-72">
            <span className="relative block">

              <CalendarDays
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
              />

              <input
                type="date"
                value={previewDate}
                onChange={(event) =>
                  setPreviewDate(event.target.value)
                }
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
              />

            </span>
          </div>
        </PreferenceRow>

        {/* =================================================
            THEME / APPEARANCE
            ================================================= */}

        <PreferenceRow
          icon={Monitor}
          title={t("preferences.theme")}
          description={t(
            "preferences.themeDescription"
          )}
          last
        >
          <SelectField
            value={
              draft.theme === "dark"
                ? "Dark"
                : "Light"
            }
            onChange={(event) =>
              updateDraft({
                theme:
                  event.target.value.toLowerCase(),
              })
            }
            options={["Light", "Dark"]}
          />
        </PreferenceRow>

      </div>

      {/* ===================================================
          BUTTONS
          =================================================== */}

      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">

        {/* SUCCESS / ERROR MESSAGE */}

        {(saved || error) && (
          <span
            className={`mr-auto text-sm font-medium ${error
                ? "text-amber-600"
                : "text-emerald-600"
              }`}
          >
            {error ||
              t("preferences.saved") ||
              "Preferences saved."}
          </span>
        )}

        {/* CANCEL BUTTON */}

        <button
          type="button"
          onClick={cancel}
          className="rounded-lg border border-slate-400 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>

        {/* SAVE CHANGES BUTTON */}

        <button
          type="button"
          onClick={save}
          className="rounded-lg bg-[#002f86] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(0,47,134,0.25)] transition hover:bg-[#00266b]"
        >
          Save Changes
        </button>

      </div>
    </div>
  );
}