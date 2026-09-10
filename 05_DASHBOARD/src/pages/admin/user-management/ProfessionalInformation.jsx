import { useMemo, useState } from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Hash,
  Send,
} from "lucide-react";

import AddAssessorStepper from "../../../components/admin/add-assessor/AddAssessorStepper";

export default function ProfessionalInformation() {
  const navigate = useNavigate();

  const location = useLocation();

  const assessorData =
    location.state?.assessorData;

  const [formData, setFormData] =
    useState({
      assessorIdNumber: "",
      assessmentCenter: "",
      qualificationSpecialization: "",
      yearsOfExperience: "",
    });

  /*
   * Redirect back to Step 1 if the user
   * opens this page without registration data.
   */

  const hasPreviousData =
    Boolean(
      assessorData?.firstName
    ) &&
    Boolean(
      assessorData?.lastName
    );

  const isFormComplete =
    useMemo(() => {
      return (
        formData.assessorIdNumber
          .trim() !== "" &&
        formData.assessmentCenter
          .trim() !== "" &&
        formData.qualificationSpecialization
          .trim() !== ""
      );
    }, [formData]);

  /*
   * Handle field updates.
   */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /*
   * Go back to Step 2.
   */

  const handleBack = () => {
    navigate(
      "/admin/user-management/add-assessor/account-setup",
      {
        state: {
          assessorData,
        },
      }
    );
  };

  /*
   * Final submission.
   *
   * We will connect this to Supabase
   * in the next step.
   */

  const handleSubmit = () => {
    if (!isFormComplete) {
      return;
    }

    const completeAssessorData = {
      ...assessorData,
      ...formData,
    };

    console.log(
      "Complete Assessor Registration:",
      completeAssessorData
    );

    /*
     * NEXT:
     * Connect this data to Supabase.
     */
  };

  /*
   * Protect against direct navigation.
   */

  if (!hasPreviousData) {
    navigate(
      "/admin/user-management/add-assessor",
      {
        replace: true,
      }
    );

    return null;
  }

  return (
    <div className="h-full overflow-y-auto px-6 pb-6 pt-4">
      {/* ========================================
          PAGE HEADER
      ======================================== */}

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#15294b]">
          Add New Assessor
        </h1>

        <p className="mt-1 text-sm text-gray-600">
          Complete the assessor's professional
          information to finish registration.
        </p>
      </div>

      {/* ========================================
          STEPPER
      ======================================== */}

      <AddAssessorStepper
        currentStep={3}
      />

      {/* ========================================
          MAIN CONTENT
      ======================================== */}

      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* ==================================
              SECTION HEADER
          ================================== */}

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#15294b] text-white">
              <ClipboardCheck
                size={21}
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#15294b]">
                Professional Information
              </h2>

              <p className="text-sm text-gray-500">
                Provide the assessor's TESDA
                professional details.
              </p>
            </div>
          </div>

          {/* ==================================
              PERSONAL SUMMARY
          ================================== */}

          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#15294b]">
              Assessor Being Registered
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs text-gray-500">
                  Full Name
                </span>

                <p className="font-semibold text-gray-900">
                  {[
                    assessorData.firstName,
                    assessorData.middleName,
                    assessorData.lastName,
                    assessorData.suffix,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </p>
              </div>

              <div>
                <span className="text-xs text-gray-500">
                  Email Address
                </span>

                <p className="font-semibold text-gray-900">
                  {assessorData.email}
                </p>
              </div>
            </div>
          </div>

          {/* ==================================
              FORM
          ================================== */}

          <div className="grid gap-5 sm:grid-cols-2">
            {/* TESDA ASSESSOR ID */}

            <div className="sm:col-span-2">
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Hash
                  size={16}
                  className="text-[#15294b]"
                />

                TESDA Assessor ID Number
              </label>

              <input
                type="text"
                name="assessorIdNumber"
                value={
                  formData.assessorIdNumber
                }
                onChange={
                  handleChange
                }
                placeholder="Enter TESDA Assessor ID Number"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#15294b] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* ASSESSMENT CENTER */}

            <div className="sm:col-span-2">
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Building2
                  size={16}
                  className="text-[#15294b]"
                />

                Assessment Center / Training Institution
              </label>

              <input
                type="text"
                name="assessmentCenter"
                value={
                  formData.assessmentCenter
                }
                onChange={
                  handleChange
                }
                placeholder="Enter assessment center or training institution"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#15294b] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* SPECIALIZATION */}

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <BriefcaseBusiness
                  size={16}
                  className="text-[#15294b]"
                />

                Qualification / Specialization
              </label>

              <input
                type="text"
                name="qualificationSpecialization"
                value={
                  formData.qualificationSpecialization
                }
                onChange={
                  handleChange
                }
                placeholder="Enter qualification or specialization"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#15294b] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* EXPERIENCE */}

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <CalendarDays
                  size={16}
                  className="text-[#15294b]"
                />

                Years of Experience
              </label>

              <input
                type="number"
                min="0"
                name="yearsOfExperience"
                value={
                  formData.yearsOfExperience
                }
                onChange={
                  handleChange
                }
                placeholder="Optional"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#15294b] focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* ==================================
              REGISTRATION SUMMARY
          ================================== */}

          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2">
              <FileText
                size={17}
                className="text-[#15294b]"
              />

              <h3 className="font-semibold text-gray-800">
                Registration Summary
              </h3>
            </div>

            <p className="mt-2 text-sm text-gray-600">
              Review all information before
              submitting the new assessor
              registration.
            </p>
          </div>

          {/* ==================================
              ACTIONS
          ================================== */}

          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-5">
            <button
              type="button"
              onClick={
                handleBack
              }
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Back
            </button>

            <button
              type="button"
              onClick={
                handleSubmit
              }
              disabled={
                !isFormComplete
              }
              className="flex items-center gap-2 rounded-lg bg-[#15294b] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f1f3b] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send
                size={16}
              />

              Complete Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
