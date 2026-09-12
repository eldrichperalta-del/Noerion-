import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { supabase } from "../../supabaseClient";

function ReadOnlyField({
  label,
  children,
  calendar = false,
  className = "",
}) {
  return (
    <div className={className}>
      <p className="text-sm font-semibold text-slate-800">
        {label}
      </p>

      <div className="relative mt-2 flex min-h-12 items-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800">
        {children}

        {calendar && (
          <CalendarDays
            className="absolute right-3 text-slate-700"
            size={19}
          />
        )}
      </div>
    </div>
  );
}

function LoadingField() {
  return (
    <div>
      <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-12 animate-pulse rounded-lg bg-slate-100" />
    </div>
  );
}

function formatRegistrationDate(value) {
  if (!value) {
    return "Not provided";
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) {
    return "Not provided";
  }

  const [, year, month, day] = match;

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthIndex = Number(month) - 1;

  if (
    monthIndex < 0 ||
    monthIndex > 11 ||
    Number(day) < 1 ||
    Number(day) > 31
  ) {
    return "Not provided";
  }

  return `${monthNames[monthIndex]} ${Number(day)}, ${year}`;
}


function formatQualification(course, ncLevel) {
  if (!course && !ncLevel) {
    return "Not provided";
  }

  if (!ncLevel) {
    return course;
  }

  const normalizedLevel = String(ncLevel)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  let formattedLevel = normalizedLevel;

  if (/^NC\d+$/.test(normalizedLevel)) {
    formattedLevel = `NC ${normalizedLevel.replace("NC", "")}`;
  } else if (/^\d+$/.test(normalizedLevel)) {
    formattedLevel = `NC ${normalizedLevel}`;
  }

  if (!course) {
    return formattedLevel;
  }

  return `${course} ${formattedLevel}`;
}

function formatBatch(batch) {
  if (batch === null || batch === undefined || batch === "") {
    return "Not provided";
  }

  return String(batch);
}



export default function TraineeInformationSettings() {
  const [profile, setProfile] = useState(null);
  const [traineeProfile, setTraineeProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadTraineeInformation = async () => {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error("No authenticated user was found.");
        }

        const [
          { data: profileData, error: profileError },
          { data: traineeData, error: traineeError },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              `
                id,
                email,
                role,
                is_approved,
                registration_status,
                created_at
              `
            )
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("trainee_profiles")
            .select(
              `
                user_id,
                training_center,
                nc_level,
                qualification_course,
                batch,
                center_id
              `
            )
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        if (profileError) {
          throw profileError;
        }

        if (traineeError) {
          throw traineeError;
        }

        if (!mounted) return;

        setProfile(profileData);
        setTraineeProfile(traineeData);
      } catch (loadError) {
        console.error(
          "Error loading trainee information:",
          loadError
        );

        if (mounted) {
          setError(
            loadError.message ||
            "Unable to load your trainee information."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadTraineeInformation();

    return () => {
      mounted = false;
    };
  }, []);

  const isApproved = Boolean(profile?.is_approved);

  const accountStatus = isApproved
    ? "Active"
    : profile?.registration_status || "Pending Approval";

  const qualification = formatQualification(
    traineeProfile?.qualification_course,
    traineeProfile?.nc_level
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-950">
        Trainee Information
      </h2>

      <p className="mt-1 text-sm text-slate-600">
        View your trainee details.
      </p>

      {error && (
        <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <LoadingField />
          <LoadingField />
          <LoadingField />
          <LoadingField />
          <LoadingField />
          <LoadingField />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {/*
           * The current database schema does not contain a separate
           * trainee_id field. The authenticated user's UUID is therefore
           * used as the available account identifier.
           */}
          <ReadOnlyField label="Trainee ID">
            {traineeProfile?.user_id || profile?.id || "Not provided"}
          </ReadOnlyField>

          <ReadOnlyField
            label="Registration Date"
            calendar
          >
            {formatRegistrationDate(profile?.created_at)}
          </ReadOnlyField>

          <ReadOnlyField label="Qualification / Program">
            {qualification}
          </ReadOnlyField>

          <ReadOnlyField label="Account Status">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${isApproved
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
                }`}
            >
              {accountStatus}
            </span>
          </ReadOnlyField>

          <ReadOnlyField label="Training Institution">
            {traineeProfile?.training_center || "Not provided"}
          </ReadOnlyField>

          <ReadOnlyField label="Batch">
            {formatBatch(traineeProfile?.batch)}
          </ReadOnlyField>

          {traineeProfile?.center_id && (
            <ReadOnlyField label="Training Center ID">
              {traineeProfile.center_id}
            </ReadOnlyField>
          )}
        </div>
      )}
    </div>
  );
}