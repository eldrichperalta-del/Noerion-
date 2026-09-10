import {
  CalendarDays,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

function BasicInformationForm({
  formData,
  onChange,
  isValidEmail,
  onCancel,
  onNext,
  isStepOneComplete,
}) {
  return (
    <div className="w-full max-w-[820px] rounded-2xl bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.20)]">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#15294b]">
          Step 1: Basic Information
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          Enter the assessor's personal information.
        </p>
      </div>

      {/* ========================================================
          FIRST NAME + LAST NAME
      ======================================================== */}

      <div className="grid gap-5 md:grid-cols-2">
        {/* FIRST NAME */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            First Name *
          </label>

          <div className="relative">
            <UserRound
              size={18}
              className="absolute left-3 top-3 text-gray-400"
            />

            <input
              type="text"
              name="firstName"
              value={
                formData.firstName
              }
              onChange={onChange}
              placeholder="John"
              className="
                w-full
                rounded-lg
                border
                border-gray-300
                py-3
                pl-10
                pr-4
                outline-none
                transition
                focus:border-[#15294b]
                focus:ring-2
                focus:ring-[#15294b]/20
              "
            />
          </div>
        </div>

        {/* LAST NAME */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Last Name *
          </label>

          <div className="relative">
            <UserRound
              size={18}
              className="absolute left-3 top-3 text-gray-400"
            />

            <input
              type="text"
              name="lastName"
              value={
                formData.lastName
              }
              onChange={onChange}
              placeholder="Doe"
              className="
                w-full
                rounded-lg
                border
                border-gray-300
                py-3
                pl-10
                pr-4
                outline-none
                transition
                focus:border-[#15294b]
                focus:ring-2
                focus:ring-[#15294b]/20
              "
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          MIDDLE NAME + SUFFIX
      ======================================================== */}

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {/* MIDDLE NAME */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Middle Name
            <span className="ml-1 text-xs font-normal text-gray-400">
              (Optional)
            </span>
          </label>

          <div className="relative">
            <UserRound
              size={18}
              className="absolute left-3 top-3 text-gray-400"
            />

            <input
              type="text"
              name="middleName"
              value={
                formData.middleName
              }
              onChange={onChange}
              placeholder="Allen"
              className="
                w-full
                rounded-lg
                border
                border-gray-300
                py-3
                pl-10
                pr-4
                outline-none
                transition
                focus:border-[#15294b]
                focus:ring-2
                focus:ring-[#15294b]/20
              "
            />
          </div>
        </div>

        {/* SUFFIX */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Suffix
            <span className="ml-1 text-xs font-normal text-gray-400">
              (Optional)
            </span>
          </label>

          <input
            type="text"
            name="suffix"
            value={
              formData.suffix
            }
            onChange={onChange}
            placeholder="Jr., Sr., III"
            className="
              w-full
              rounded-lg
              border
              border-gray-300
              px-4
              py-3
              outline-none
              transition
              focus:border-[#15294b]
              focus:ring-2
              focus:ring-[#15294b]/20
            "
          />
        </div>
      </div>

      {/* ========================================================
          GENDER + DATE OF BIRTH
      ======================================================== */}

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {/* GENDER */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Gender *
          </label>

          <select
            name="gender"
            value={
              formData.gender
            }
            onChange={onChange}
            className="
              w-full
              rounded-lg
              border
              border-gray-300
              bg-white
              px-4
              py-3
              outline-none
              transition
              focus:border-[#15294b]
              focus:ring-2
              focus:ring-[#15294b]/20
            "
          >
            <option value="">
              Select gender
            </option>

            <option value="Female">
              Female
            </option>

            <option value="Male">
              Male
            </option>

            <option value="Prefer not to say">
              Prefer not to say
            </option>
          </select>
        </div>

        {/* DATE OF BIRTH */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Date of Birth *
          </label>

          <div className="relative">
            <CalendarDays
              size={18}
              className="pointer-events-none absolute left-3 top-3 text-gray-400"
            />

            <input
              type="date"
              name="birthDate"
              value={
                formData.birthDate
              }
              onChange={onChange}
              className="
                w-full
                rounded-lg
                border
                border-gray-300
                py-3
                pl-10
                pr-4
                outline-none
                transition
                focus:border-[#15294b]
                focus:ring-2
                focus:ring-[#15294b]/20
              "
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          CONTACT NUMBER
      ======================================================== */}

      <div className="mt-5">
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Contact Number *
        </label>

        <div className="relative">
          <Phone
            size={18}
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            type="text"
            name="contactNumber"
            value={
              formData.contactNumber
            }
            onChange={onChange}
            placeholder="09123456789"
            className="
              w-full
              rounded-lg
              border
              border-gray-300
              py-3
              pl-10
              pr-4
              outline-none
              transition
              focus:border-[#15294b]
              focus:ring-2
              focus:ring-[#15294b]/20
            "
          />
        </div>
      </div>

      {/* ========================================================
          EMAIL
      ======================================================== */}

      <div className="mt-5">
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Personal Email Address *
        </label>

        <div className="relative">
          <Mail
            size={18}
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            type="email"
            name="email"
            value={
              formData.email
            }
            onChange={onChange}
            placeholder="jdoe@email.com"
            className={`
              w-full
              rounded-lg
              border
              py-3
              pl-10
              pr-4
              outline-none
              transition

              ${
                formData.email.length >
                  0 &&
                !isValidEmail
                  ? `
                    border-red-500
                    focus:ring-2
                    focus:ring-red-500/20
                  `
                  : `
                    border-gray-300
                    focus:border-[#15294b]
                    focus:ring-2
                    focus:ring-[#15294b]/20
                  `
              }
            `}
          />
        </div>

        {formData.email.length >
          0 &&
          !isValidEmail && (
            <p className="mt-2 text-sm text-red-600">
              Please enter a valid email address.
            </p>
          )}
      </div>

      {/* ========================================================
          BUTTONS
      ======================================================== */}

      <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-5">
        {/* CANCEL */}

        <button
          type="button"
          onClick={onCancel}
          className="
            rounded-lg
            border
            border-gray-300
            px-6
            py-2.5
            text-sm
            font-semibold
            text-gray-700
            transition
            hover:bg-gray-100
          "
        >
          Cancel
        </button>

        {/* NEXT */}

        <button
          type="button"
          onClick={onNext}
          disabled={
            !isStepOneComplete
          }
          className={`
            rounded-lg
            px-6
            py-2.5
            text-sm
            font-semibold
            text-white
            shadow-sm
            transition

            ${
              isStepOneComplete
                ? `
                  bg-[#15294b]
                  hover:bg-[#0f1f3b]
                `
                : `
                  cursor-not-allowed
                  bg-gray-400
                `
            }
          `}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default BasicInformationForm;