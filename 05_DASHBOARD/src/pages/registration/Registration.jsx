import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Eye,
  EyeOff,
  IdCard,
  ImagePlus,
  Info,
  LockKeyhole,
  Mail,
  Upload,
  UserRound,
  X,
  Loader2,
} from "lucide-react";

import AnimatedWave from "../login/AnimatedWave";
import { supabase } from "../../supabaseClient";
import {
  notifyPendingApproval,
} from "../../services/notificationService";

const inputClass =
  "auth-input w-full h-11 rounded-xl border border-cyan-300/30 bg-slate-800/70 px-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20";

// =========================================================
// PROGRESS
// =========================================================

function Progress({ step }) {
  return (
    <>
      <p className="mb-1 text-xs text-slate-300">
        Step {step} of 3
      </p>

      <div className="relative mb-6 flex items-center justify-between before:absolute before:left-4 before:right-4 before:h-0.5 before:bg-slate-300/75">
        {[1, 2, 3].map((number) => (
          <span
            key={number}
            className={`relative z-10 grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${number < step
              ? "bg-cyan-400 text-slate-950"
              : number === step
                ? "bg-cyan-300 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,.9)]"
                : "bg-slate-200 text-slate-700"
              }`}
          >
            {number < step ? (
              <Check size={15} />
            ) : (
              number
            )}
          </span>
        ))}
      </div>
    </>
  );
}

// =========================================================
// FIELD
// =========================================================

function Field({ icon: Icon, ...props }) {
  return (
    <label className="relative block">
      <Icon
        size={15}
        className="pointer-events-none absolute left-3 top-3 text-cyan-200/75"
      />

      <input
        className={`${inputClass} pl-9`}
        {...props}
      />
    </label>
  );
}

// =========================================================
// MAIN COMPONENT
// =========================================================

export default function Registration() {
  const navigate = useNavigate();

  const [step, setStep] =
    useState(1);

  const [role, setRole] =
    useState("");

  const [photoFile, setPhotoFile] =
    useState(null);

  const [photoPreview, setPhotoPreview] =
    useState("");

  const [photoInputKey, setPhotoInputKey] =
    useState(0);

  const [documents, setDocuments] =
    useState({
      accreditation: null,
      governmentId: null,
    });

  const [accepted, setAccepted] =
    useState(false);

  const [form, setForm] =
    useState({});

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  // Existing rejected profile waiting for resubmission
  const [existingProfile, setExistingProfile] =
    useState(null);

  // Resubmit confirmation modal
  const [showResubmitDialog, setShowResubmitDialog] =
    useState(false);

  // =========================================================
  // ROLE
  // =========================================================

  const isAssessor =
    role === "assessor";

  const heading =
    step === 3
      ? isAssessor
        ? "TESDA Assessor Information & Verification"
        : "Training Information & Verification"
      : "Account Registration";

  // =========================================================
  // VALIDATION
  // =========================================================

  const formReady =
    useMemo(
      () =>
        form.firstName &&
        form.lastName &&
        form.gender &&
        form.birthDate &&
        form.contactNumber &&
        form.email &&
        form.password &&
        form.password ===
        form.confirmPassword,
      [form]
    );

  const stepThreeReady =
    isAssessor
      ? form.assessorId &&
      form.assessmentCenter &&
      form.specialization &&
      photoFile &&
      documents.accreditation &&
      accepted
      : form.trainingCenter &&
      form.ncLevel &&
      form.qualification &&
      photoFile &&
      accepted;

  // =========================================================
  // FORM UPDATE
  // =========================================================

  const update = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]:
        event.target.value,
    }));
  };

  // =========================================================
  // PHOTO
  // =========================================================

  const choosePhoto = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setPhotoFile(file);

    setPhotoPreview(
      URL.createObjectURL(file)
    );
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");

    setPhotoInputKey(
      (key) => key + 1
    );
  };

  // =========================================================
  // NORMALIZE EMAIL
  // =========================================================

  const normalizeEmail = (
    email
  ) => {
    return String(email || "")
      .trim()
      .toLowerCase();
  };

  // =========================================================
  // GET EXISTING PROFILE
  // =========================================================

  const getExistingProfile =
    async (email) => {
      const normalizedEmail =
        normalizeEmail(email);

      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          role,
          registration_status,
          is_approved,
          rejected_reason
        `)
        .eq(
          "email",
          normalizedEmail
        )
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    };

  // =========================================================
  // UPLOAD FILE
  // =========================================================

  const uploadFile =
    async (
      file,
      bucket,
      pathPrefix = ""
    ) => {
      const fileExt =
        file.name
          .split(".")
          .pop() || "bin";

      const uuid =
        crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random()
            .toString(36)
            .substring(2, 11);

      const filePath =
        pathPrefix
          ? `${pathPrefix}/${uuid}.${fileExt}`
          : `${uuid}.${fileExt}`;

      const {
        error,
      } =
        await supabase.storage
          .from(bucket)
          .upload(
            filePath,
            file,
            {
              cacheControl: "3600",
              upsert: false,
            }
          );

      if (error) {
        throw error;
      }

      const {
        data,
      } =
        supabase.storage
          .from(bucket)
          .getPublicUrl(
            filePath
          );

      return (
        data?.publicUrl ||
        filePath
      );
    };

  // =========================================================
  // CHECK EXISTING EMAIL
  // =========================================================

  const checkExistingEmail =
    async () => {
      const normalizedEmail =
        normalizeEmail(
          form.email
        );

      if (!normalizedEmail) {
        return null;
      }

      const profile =
        await getExistingProfile(
          normalizedEmail
        );

      if (!profile) {
        return null;
      }

      const status =
        String(
          profile.registration_status ||
          ""
        )
          .toLowerCase()
          .trim();

      // Rejected registration
      if (
        status.includes(
          "rejected"
        )
      ) {
        return {
          type: "rejected",
          profile,
        };
      }

      // Pending registration
      if (
        status.includes(
          "pending"
        )
      ) {
        return {
          type: "pending",
          profile,
        };
      }

      // Approved registration
      if (
        status.includes(
          "approved"
        )
      ) {
        return {
          type: "approved",
          profile,
        };
      }

      // Fallback
      return {
        type: "existing",
        profile,
      };
    };

  // =========================================================
  // CREATE NEW REGISTRATION
  // =========================================================

  const createNewRegistration =
    async () => {
      const formattedRole =
        isAssessor
          ? "assessor"
          : "trainee";

      // -----------------------------------------------------
      // 1. CREATE AUTH USER
      // -----------------------------------------------------

      const {
        data: authData,
        error: authError,
      } =
        await supabase.auth.signUp({
          email:
            normalizeEmail(
              form.email
            ),

          password:
            form.password,

          options: {
            data: {
              first_name:
                form.firstName,

              last_name:
                form.lastName,

              role:
                formattedRole,
            },
          },
        });

      if (authError) {
        throw authError;
      }

      const userId =
        authData.user?.id;

      if (!userId) {
        throw new Error(
          "Could not create authentication user."
        );
      }

      // -----------------------------------------------------
      // 2. UPLOAD PROFILE PHOTO
      // -----------------------------------------------------

      let profilePhotoUrl =
        "";

      if (photoFile) {
        profilePhotoUrl =
          await uploadFile(
            photoFile,
            "avatars",
            userId
          );
      }

      // -----------------------------------------------------
      // 3. UPDATE PROFILE
      //
      // The auth trigger may already have created the row.
      // upsert safely updates it.
      // -----------------------------------------------------

      const {
        error: profileError,
      } =
        await supabase
          .from("profiles")
          .upsert({
            id:
              userId,

            role:
              formattedRole,

            first_name:
              form.firstName,

            middle_name:
              form.middleName ||
              null,

            last_name:
              form.lastName,

            suffix:
              form.suffix ||
              null,

            gender:
              form.gender,

            date_of_birth:
              form.birthDate,

            contact_number:
              form.contactNumber,

            email:
              normalizeEmail(
                form.email
              ),

            profile_photo_url:
              profilePhotoUrl,

            registration_status:
              "Pending",

            is_approved:
              false,

            rejected_reason:
              null,
          });

      if (profileError) {
        throw profileError;
      }

      // -----------------------------------------------------
      // 3. RECREATE / UPDATE ROLE PROFILE
      // -----------------------------------------------------

      await saveRoleProfile(
        userId,
        formattedRole
      );

      // -----------------------------------------------------
      // 4. NOTIFY ADMINS OF PENDING REGISTRATION
      // -----------------------------------------------------

      try {
        await notifyPendingApproval({
          userId,
          userName:
            `${form.firstName || ""} ${form.lastName || ""}`.trim(),
          role: formattedRole,
        });
      } catch (notificationError) {
        console.error(
          "Failed to send pending registration notification:",
          notificationError
        );
      }

      // -----------------------------------------------------
      // 5. SIGN OUT
      // -----------------------------------------------------

      await supabase.auth.signOut();
    };

  // =========================================================
  // SAVE ROLE PROFILE
  // =========================================================

  const saveRoleProfile =
    async (
      userId,
      formattedRole
    ) => {
      // =====================================================
      // ASSESSOR
      // =====================================================

      if (
        formattedRole ===
        "assessor"
      ) {
        let accreditationUrl =
          "";

        let governmentIdUrl =
          "";

        if (
          documents.accreditation
        ) {
          accreditationUrl =
            await uploadFile(
              documents.accreditation,
              "verification-docs",
              `${userId}/accreditation`
            );
        }

        if (
          documents.governmentId
        ) {
          governmentIdUrl =
            await uploadFile(
              documents.governmentId,
              "verification-docs",
              `${userId}/gov_id`
            );
        }

        const {
          error:
          assessorError,
        } =
          await supabase
            .from(
              "assessor_profiles"
            )
            .upsert(
              {
                user_id:
                  userId,

                assessor_id_number:
                  form.assessorId,

                qualification_specialization:
                  form.specialization,

                assessment_center:
                  form.assessmentCenter,

                years_of_experience:
                  form.experience
                    ? parseInt(
                      form.experience,
                      10
                    )
                    : null,

                accreditation_cert_url:
                  accreditationUrl ||
                  null,

                government_id_url:
                  governmentIdUrl ||
                  null,

                email:
                  normalizeEmail(
                    form.email
                  ),
              },
              {
                onConflict:
                  "user_id",
              }
            );

        if (
          assessorError
        ) {
          throw assessorError;
        }

        return;
      }

      // =====================================================
      // TRAINEE
      // =====================================================

      const {
        error:
        traineeError,
      } =
        await supabase
          .from(
            "trainee_profiles"
          )
          .upsert(
            {
              user_id:
                userId,

              training_center:
                form.trainingCenter,

              nc_level:
                form.ncLevel,

              qualification_course:
                form.qualification,

              batch:
                form.batch ||
                null,
            },
            {
              onConflict:
                "user_id",
            }
          );

      if (
        traineeError
      ) {
        throw traineeError;
      }
    };

  // =========================================================
  // RESUBMIT REJECTED REGISTRATION
  // =========================================================

  const resubmitRegistration =
    async (
      existing
    ) => {
      if (
        !existing?.id
      ) {
        throw new Error(
          "The rejected registration could not be found."
        );
      }

      const userId =
        existing.id;

      const formattedRole =
        isAssessor
          ? "assessor"
          : "trainee";

      // -----------------------------------------------------
      // 1. UPLOAD NEW PHOTO
      // -----------------------------------------------------

      let profilePhotoUrl =
        "";

      if (photoFile) {
        profilePhotoUrl =
          await uploadFile(
            photoFile,
            "avatars",
            userId
          );
      }

      // -----------------------------------------------------
      // 2. UPDATE EXISTING PROFILE
      //
      // IMPORTANT:
      // Do NOT create another auth user.
      // -----------------------------------------------------

      const {
        error:
        profileError,
      } =
        await supabase
          .from(
            "profiles"
          )
          .update({
            role:
              formattedRole,

            first_name:
              form.firstName,

            middle_name:
              form.middleName ||
              null,

            last_name:
              form.lastName,

            suffix:
              form.suffix ||
              null,

            gender:
              form.gender,

            date_of_birth:
              form.birthDate,

            contact_number:
              form.contactNumber,

            email:
              normalizeEmail(
                form.email
              ),

            profile_photo_url:
              profilePhotoUrl ||
              undefined,

            registration_status:
              "Pending",

            is_approved:
              false,

            rejected_reason:
              null,
          })
          .eq(
            "id",
            userId
          );

      if (
        profileError
      ) {
        throw profileError;
      }

      // -----------------------------------------------------
      // 3. RECREATE / UPDATE ROLE PROFILE
      // -----------------------------------------------------

      await saveRoleProfile(
        userId,
        formattedRole
      );

      // -----------------------------------------------------
      // 4. SIGN OUT
      // -----------------------------------------------------

      await supabase.auth.signOut();
    };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit =
    async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const result =
          await checkExistingEmail();

        // ---------------------------------------------------
        // NO EXISTING PROFILE
        // ---------------------------------------------------

        if (!result) {
          await createNewRegistration();

          setStep(4);

          return;
        }

        // ---------------------------------------------------
        // REJECTED PROFILE
        // ---------------------------------------------------

        if (
          result.type ===
          "rejected"
        ) {
          setExistingProfile(
            result.profile
          );

          setShowResubmitDialog(
            true
          );

          return;
        }

        // ---------------------------------------------------
        // PENDING PROFILE
        // ---------------------------------------------------

        if (
          result.type ===
          "pending"
        ) {
          throw new Error(
            "An account with this email is already pending approval. Please wait for the administrator's review."
          );
        }

        // ---------------------------------------------------
        // APPROVED PROFILE
        // ---------------------------------------------------

        if (
          result.type ===
          "approved"
        ) {
          throw new Error(
            "An account with this email has already been approved. Please log in instead."
          );
        }

        // ---------------------------------------------------
        // OTHER EXISTING ACCOUNT
        // ---------------------------------------------------

        throw new Error(
          "An account with this email already exists."
        );
      } catch (
      err
      ) {
        console.error(
          "Registration error:",
          err
        );

        setErrorMessage(
          err.message ||
          "An error occurred during registration."
        );
      } finally {
        setLoading(false);
      }
    };

  // =========================================================
  // CONFIRM RESUBMISSION
  // =========================================================

  const confirmResubmit =
    async () => {
      if (
        !existingProfile
      ) {
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        await resubmitRegistration(
          existingProfile
        );

        setShowResubmitDialog(
          false
        );

        setExistingProfile(
          null
        );

        setStep(4);
      } catch (
      err
      ) {
        console.error(
          "Resubmission error:",
          err
        );

        setErrorMessage(
          err.message ||
          "Could not resubmit your registration."
        );

        setShowResubmitDialog(
          false
        );
      } finally {
        setLoading(false);
      }
    };

  // =========================================================
  // NEXT
  // =========================================================

  const next = () => {
    if (
      step === 1 &&
      !role
    ) {
      return;
    }

    if (
      step === 2 &&
      !formReady
    ) {
      return;
    }

    if (
      step === 3 &&
      stepThreeReady
    ) {
      handleSubmit();

      return;
    }

    if (
      step < 3
    ) {
      setStep(
        step + 1
      );
    }
  };

  // =========================================================
  // BACK
  // =========================================================

  const back = () => {
    if (
      step === 1
    ) {
      navigate(
        "/login"
      );

      return;
    }

    setStep(
      step - 1
    );
  };

  // =========================================================
  // SUCCESS
  // =========================================================

  if (
    step === 4
  ) {
    return (
      <Success
        onLogin={() =>
          navigate(
            "/login"
          )
        }
      />
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#040814] px-4 py-8">

      <AnimatedWave />

      <div className="absolute -left-32 -top-40 h-[500px] w-[500px] bg-cyan-400/20 blur-[180px]" />

      <div className="absolute -bottom-40 -right-32 h-[500px] w-[500px] bg-purple-500/20 blur-[180px]" />

      <main
        className={`relative z-10 w-full ${step === 3 &&
          isAssessor
          ? "max-w-4xl"
          : "max-w-2xl"
          } rounded-[28px] border border-cyan-300/40 bg-slate-950/80 p-5 shadow-[0_0_20px_rgba(0,242,255,.32),0_0_70px_rgba(0,242,255,.18)] backdrop-blur-[30px] sm:p-8`}
      >

        <div className="mb-4 text-center">

          <div className="bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-xl font-extrabold tracking-wider text-transparent">
            NOERION
          </div>

          <h1 className="mt-4 text-2xl font-bold text-white">
            {heading}
          </h1>

          {step < 3 && (
            <p className="mt-1 text-sm text-slate-400">
              Register for a NOERION account.
            </p>
          )}

          {step === 3 &&
            isAssessor && (
              <p className="mt-1 text-xs text-slate-400">
                Provide your professional information and upload documents for administrator verification.
              </p>
            )}

        </div>

        <Progress
          step={step}
        />

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/20 p-3 text-center text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        {step === 1 && (
          <AccountType
            role={role}
            onChange={setRole}
          />
        )}

        {step === 2 && (
          <PersonalForm
            form={form}
            update={update}
          />
        )}

        {step === 3 && (
          <Verification
            isAssessor={
              isAssessor
            }
            form={form}
            update={update}
            documents={
              documents
            }
            setDocuments={
              setDocuments
            }
            photoPreview={
              photoPreview
            }
            photoInputKey={
              photoInputKey
            }
            choosePhoto={
              choosePhoto
            }
            clearPhoto={
              clearPhoto
            }
            accepted={
              accepted
            }
            setAccepted={
              setAccepted
            }
          />
        )}

        <div className="mt-5 flex items-center justify-between border-t border-slate-600/30 pt-5">

          <button
            onClick={back}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-300 px-4 py-2 text-sm font-semibold text-slate-900"
          >
            <ArrowLeft size={16} />

            {step === 1
              ? "Back to Login"
              : "Back"}
          </button>

          <button
            onClick={next}
            disabled={
              loading ||
              (step === 1 &&
                !role) ||
              (step === 2 &&
                !formReady) ||
              (step === 3 &&
                !stepThreeReady)
            }
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_14px_rgba(45,212,191,.55)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading && (
              <Loader2
                size={16}
                className="animate-spin"
              />
            )}

            {step === 3
              ? "Submit Registration"
              : "Continue"}
          </button>

        </div>

        {step === 2 &&
          !formReady &&
          form.password && (
            <p className="mt-3 text-center text-xs text-amber-300">
              Complete the required fields and ensure both passwords match to continue.
            </p>
          )}

      </main>

      {/* RESUBMIT DIALOG */}

      {showResubmitDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">

          <div className="w-full max-w-md rounded-2xl border border-cyan-300/30 bg-slate-950 p-6 shadow-2xl">

            <h2 className="text-xl font-bold text-white">
              Previous Registration Found
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              A previous registration using this email was rejected.
              You can resubmit your updated information for another administrator review.
            </p>

            {existingProfile?.rejected_reason && (
              <div className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-200">

                <span className="mb-1 block font-semibold">
                  Previous rejection reason:
                </span>

                {existingProfile.rejected_reason}

              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setShowResubmitDialog(
                    false
                  );

                  setExistingProfile(
                    null
                  );
                }}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={
                  confirmResubmit
                }
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-teal-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50"
              >
                {loading && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                Resubmit Registration
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// =========================================================
// ACCOUNT TYPE
// =========================================================

function AccountType({
  role,
  onChange,
}) {
  const choices = [
    {
      key: "trainee",
      label: "Trainee",
      Icon: GraduationCap,
      description:
        "Develop your skills, access comprehensive training resources, and track your progress in your professional development journey.",
    },
    {
      key: "assessor",
      label: "Assessor",
      Icon: ClipboardCheck,
      description:
        "Evaluate performances, provide valuable feedback to trainees, and manage assessments within your designated programs.",
    },
  ];

  return (
    <section>

      <h2 className="mb-3 text-base font-semibold text-slate-100">
        Select Account Type
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">

        {choices.map(
          ({
            key,
            label,
            Icon,
            description,
          }) => (

            <button
              key={key}
              onClick={() =>
                onChange(
                  key
                )
              }
              className={`min-h-52 rounded-xl border p-5 text-center transition ${role === key
                ? "border-cyan-300 bg-cyan-300/10 shadow-[0_0_18px_rgba(34,211,238,.4)]"
                : "border-slate-500/40 bg-slate-900/50 hover:border-cyan-300/60"
                }`}
            >

              <Icon
                className="mx-auto mb-3 text-cyan-200"
                size={42}
              />

              <span className="block text-base font-bold text-white">
                {label}
              </span>

              <span className="mt-2 block text-xs leading-5 text-slate-300">
                {description}
              </span>

            </button>

          )
        )}

      </div>

    </section>
  );
}

// =========================================================
// PASSWORD FIELD
// =========================================================

function PasswordField({
  name,
  placeholder,
  value,
  onChange,
}) {
  const [
    visible,
    setVisible,
  ] =
    useState(false);

  return (
    <label className="relative block">

      <LockKeyhole
        size={15}
        className="pointer-events-none absolute left-3 top-3 text-cyan-200/75"
      />

      <input
        className={`${inputClass} px-9 pr-10`}
        name={name}
        value={
          value || ""
        }
        onChange={
          onChange
        }
        placeholder={
          placeholder
        }
        type={
          visible
            ? "text"
            : "password"
        }
      />

      <button
        type="button"
        onClick={() =>
          setVisible(
            !visible
          )
        }
        className="absolute right-3 top-2.5 text-cyan-300"
      >
        {visible ? (
          <EyeOff size={18} />
        ) : (
          <Eye size={18} />
        )}
      </button>

    </label>
  );
}

// =========================================================
// PERSONAL FORM
// =========================================================

function PersonalForm({
  form,
  update,
}) {
  const fields = [
    [
      "firstName",
      "First Name",
      UserRound,
    ],
    [
      "lastName",
      "Last Name",
      UserRound,
    ],
    [
      "middleName",
      "Middle Name (Optional)",
      UserRound,
    ],
    [
      "suffix",
      "Suffix (Optional)",
      UserRound,
    ],
  ];

  return (
    <section>

      <h2 className="mb-3 text-base font-semibold text-slate-100">
        Personal and Account Information
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">

        {fields.map(
          ([
            name,
            placeholder,
            icon,
          ]) => (

            <Field
              key={name}
              icon={icon}
              name={name}
              value={
                form[name] || ""
              }
              onChange={
                update
              }
              placeholder={
                placeholder
              }
            />

          )
        )}

        <select
          name="gender"
          value={
            form.gender || ""
          }
          onChange={
            update
          }
          className={
            inputClass
          }
        >
          <option value="">
            Gender
          </option>

          <option>
            Female
          </option>

          <option>
            Male
          </option>

          <option>
            Prefer not to say
          </option>
        </select>

        <Field
          icon={
            CalendarDays
          }
          name="birthDate"
          value={
            form.birthDate || ""
          }
          onChange={
            update
          }
          type="date"
        />

        <Field
          icon={
            IdCard
          }
          name="contactNumber"
          value={
            form.contactNumber || ""
          }
          onChange={
            update
          }
          placeholder="Contact Number"
        />

        <Field
          icon={Mail}
          name="email"
          value={
            form.email || ""
          }
          onChange={
            update
          }
          placeholder="Personal Email Address"
          type="email"
        />

        <PasswordField
          name="password"
          value={
            form.password
          }
          onChange={
            update
          }
          placeholder="Password"
        />

        <PasswordField
          name="confirmPassword"
          value={
            form.confirmPassword
          }
          onChange={
            update
          }
          placeholder="Confirm Password"
        />

      </div>

    </section>
  );
}

// =========================================================
// VERIFICATION
// =========================================================

function Verification({
  isAssessor,
  form,
  update,
  documents,
  setDocuments,
  photoPreview,
  photoInputKey,
  choosePhoto,
  clearPhoto,
  accepted,
  setAccepted,
}) {
  const fields =
    isAssessor
      ? [
        [
          "assessorId",
          "TESDA Assessor ID Number",
        ],
        [
          "assessmentCenter",
          "Assessment Center / Training Institution",
        ],
        [
          "specialization",
          "Qualification / Specialization",
        ],
        [
          "experience",
          "Years of Experience (Optional)",
        ],
      ]
      : [
        [
          "trainingCenter",
          "Training Center / TVET Institution",
        ],
        [
          "ncLevel",
          "NC Level",
        ],
        [
          "qualification",
          "Qualification / Course",
        ],
        [
          "batch",
          "Batch (Optional)",
        ],
      ];

  return (
    <section>

      <h2 className="mb-3 text-base font-semibold text-slate-100">
        {isAssessor
          ? "Professional Information"
          : "Training Information"}
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">

        {fields.map(
          ([
            name,
            label,
          ]) => (

            <input
              key={name}
              name={name}
              value={
                form[name] || ""
              }
              onChange={
                update
              }
              className={
                inputClass
              }
              placeholder={
                label
              }
            />

          )
        )}

      </div>

      <h2 className="mb-2 mt-4 text-base font-semibold text-slate-100">
        Profile Photo
      </h2>

      <label className="relative flex min-h-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-cyan-200/70 bg-cyan-300/10 p-4 text-center">

        <input
          key={
            photoInputKey
          }
          onChange={
            choosePhoto
          }
          type="file"
          accept="image/jpeg,image/png"
          className="absolute inset-0 cursor-pointer opacity-0"
        />

        {photoPreview ? (
          <>
            <img
              src={
                photoPreview
              }
              alt="Selected profile"
              className="h-24 w-24 rounded-lg border-2 border-cyan-300 object-cover"
            />

            <button
              type="button"
              onClick={(
                event
              ) => {
                event.preventDefault();
                event.stopPropagation();

                clearPhoto();
              }}
              className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full border border-white/40 bg-slate-950/90 text-white hover:bg-rose-500"
            >
              <X size={15} />
            </button>
          </>
        ) : (
          <div>
            <ImagePlus className="mx-auto mb-2 text-cyan-100" />

            <b className="block text-sm">
              Upload Recent 2×2 Formal ID Photo
            </b>

            <span className="text-xs text-slate-300">
              Accepted formats: JPG, PNG
            </span>
          </div>
        )}

      </label>

      {isAssessor && (
        <>
          <h2 className="mb-2 mt-4 text-base font-semibold text-slate-100">
            Supporting Documents
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">

            <Document
              label="TESDA Assessor Accreditation Certificate"
              file={
                documents.accreditation
              }
              required
              onChange={(
                event
              ) => {
                const file =
                  event.target.files?.[0] ||
                  null;

                setDocuments(
                  (
                    current
                  ) => ({
                    ...current,
                    accreditation:
                      file,
                  })
                );
              }}
            />

            <Document
              label="Government-issued ID"
              file={
                documents.governmentId
              }
              onChange={(
                event
              ) => {
                const file =
                  event.target.files?.[0] ||
                  null;

                setDocuments(
                  (
                    current
                  ) => ({
                    ...current,
                    governmentId:
                      file,
                  })
                );
              }}
            />

          </div>
        </>
      )}

      <label className="mt-3 flex cursor-pointer gap-2 rounded-lg border border-cyan-200/55 bg-slate-900/60 p-3 text-xs leading-4 text-slate-200">

        <input
          checked={
            accepted
          }
          onChange={(
            event
          ) =>
            setAccepted(
              event.target.checked
            )
          }
          type="checkbox"
          className="mt-0.5 accent-cyan-400"
        />

        I certify that all information provided is true and accurate. I understand that my registration will remain in Pending status until verified and approved by the TESDA Administrator.

      </label>

    </section>
  );
}

// =========================================================
// DOCUMENT
// =========================================================

function Document({
  label,
  required,
  file,
  onChange,
}) {
  return (
    <label className="block cursor-pointer rounded-lg border border-dashed border-cyan-200/50 bg-slate-900/50 p-3 text-xs text-slate-200">

      <b className="block">
        {label}

        {required && (
          <span className="text-cyan-300">
            {" "}
            *Required
          </span>
        )}
      </b>

      <span className="block py-1 text-slate-400">
        PDF, JPG, or PNG
      </span>

      <div className="mt-1 flex items-center gap-1.5 text-cyan-200">

        <Upload size={13} />

        <span className="max-w-[200px] truncate font-medium">
          {file
            ? file.name
            : "Choose File"}
        </span>

        <input
          onChange={
            onChange
          }
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="hidden"
        />

      </div>

    </label>
  );
}

// =========================================================
// SUCCESS
// =========================================================

function Success({
  onLogin,
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#040814] px-4">

      <AnimatedWave />

      <main className="relative z-10 w-full max-w-xl rounded-[28px] border border-cyan-300/40 bg-slate-950/80 p-8 text-center shadow-[0_0_45px_rgba(34,211,238,.35)] backdrop-blur-[30px]">

        <div className="bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-xl font-extrabold tracking-wider text-transparent">
          NOERION
        </div>

        <h1 className="mt-7 text-3xl font-bold leading-tight text-white">
          Registration Submitted
          <br />

          <span className="inline-flex items-center gap-2">
            Successfully!

            <CheckCircle2
              size={28}
              className="text-emerald-400"
            />
          </span>
        </h1>

        <p className="mt-4 text-sm leading-6 text-slate-300">
          Your registration has been submitted and is now pending review by the TESDA Administrator.
        </p>

        <div className="mt-5 flex justify-between rounded-lg border border-slate-500/40 bg-slate-800/70 p-3 text-sm text-slate-100">

          <span>
            Status
          </span>

          <span className="font-semibold text-amber-300">
            ● Pending
          </span>

        </div>

        <button
          onClick={
            onLogin
          }
          className="mt-5 w-full rounded-lg bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-300 py-3 text-sm font-bold text-slate-950"
        >
          Return to Login
        </button>

      </main>

    </div>
  );
}