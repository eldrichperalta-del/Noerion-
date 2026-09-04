import { useEffect, useRef, useState } from "react";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import RegistrationProfileModal from "../shared/RegistrationProfileModal";

function TraineeTable({
  trainees = [],
  onApprove,
  onReject,
  onDeactivate,
  onReactivate,
}) {
  // ==========================================
  // STATE
  // ==========================================

  const [openMenuId, setOpenMenuId] =
    useState(null);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [selectedTrainee, setSelectedTrainee] =
    useState(null);

  const menuRef =
    useRef(null);

  const rowsPerPage =
    5;

  // ==========================================
  // CLOSE ACTION MENU WHEN CLICKING OUTSIDE
  // ==========================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target
        )
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // ==========================================
  // RESET PAGE WHEN DATA CHANGES
  // ==========================================

  useEffect(() => {
    setCurrentPage(1);
  }, [trainees.length]);

  // ==========================================
  // KEEP SELECTED PROFILE UPDATED
  // ==========================================

  useEffect(() => {
    if (!selectedTrainee) {
      return;
    }

    const updatedTrainee =
      trainees.find(
        (trainee) =>
          trainee.id ===
          selectedTrainee.id
      );

    if (!updatedTrainee) {
      setSelectedTrainee(null);
      return;
    }

    setSelectedTrainee(
      updatedTrainee
    );
  }, [trainees]);

  // ==========================================
  // PAGINATION
  // ==========================================

  const totalPages =
    Math.max(
      Math.ceil(
        trainees.length /
          rowsPerPage
      ),
      1
    );

  const startIndex =
    (currentPage - 1) *
    rowsPerPage;

  const endIndex =
    startIndex +
    rowsPerPage;

  const paginatedTrainees =
    trainees.slice(
      startIndex,
      endIndex
    );

  const showingStart =
    trainees.length === 0
      ? 0
      : startIndex + 1;

  const showingEnd =
    Math.min(
      endIndex,
      trainees.length
    );

  // ==========================================
  // STATUS STYLE
  // ==========================================

  const getStatusClass = (
    status
  ) => {
    const normalizedStatus =
      String(
        status ?? ""
      )
        .toLowerCase()
        .trim();

    if (
      normalizedStatus ===
      "pending"
    ) {
      return "bg-yellow-100 text-yellow-700";
    }

    if (
      normalizedStatus ===
        "approved" ||
      normalizedStatus ===
        "active"
    ) {
      return "bg-green-100 text-green-700";
    }

    if (
      normalizedStatus ===
      "rejected"
    ) {
      return "bg-red-100 text-red-700";
    }

    if (
      normalizedStatus ===
        "inactive" ||
      normalizedStatus ===
        "deactivated"
    ) {
      return "bg-gray-200 text-gray-700";
    }

    return "bg-gray-100 text-gray-700";
  };

  // ==========================================
  // OPEN PROFILE
  // ==========================================

  const handleOpenProfile = (
    trainee
  ) => {
    setSelectedTrainee(
      trainee
    );

    setOpenMenuId(null);
  };

  // ==========================================
  // DIRECT DEACTIVATE ACTION
  // ==========================================

  const handleDeactivate = (
    trainee
  ) => {
    if (onDeactivate) {
      onDeactivate(
        trainee.id
      );
    }

    setOpenMenuId(null);
  };

  // ==========================================
  // REACTIVATE
  // ==========================================

  const handleReactivate = (
    trainee
  ) => {
    if (!onReactivate) {
      return;
    }

    onReactivate(
      trainee.id
    );

    setOpenMenuId(null);
  };

  // ==========================================
  // PREVIOUS PROFILE
  // ==========================================

  const handlePreviousProfile = () => {
    if (!selectedTrainee) {
      return;
    }

    const currentIndex =
      trainees.findIndex(
        (trainee) =>
          trainee.id ===
          selectedTrainee.id
      );

    if (
      currentIndex > 0
    ) {
      setSelectedTrainee(
        trainees[
          currentIndex - 1
        ]
      );
    }
  };

  // ==========================================
  // NEXT PROFILE
  // ==========================================

  const handleNextProfile = () => {
    if (!selectedTrainee) {
      return;
    }

    const currentIndex =
      trainees.findIndex(
        (trainee) =>
          trainee.id ===
          selectedTrainee.id
      );

    if (
      currentIndex !== -1 &&
      currentIndex <
        trainees.length - 1
    ) {
      setSelectedTrainee(
        trainees[
          currentIndex + 1
        ]
      );
    }
  };

  // ==========================================
  // SELECTED PROFILE POSITION
  // ==========================================

  const selectedIndex =
    selectedTrainee
      ? trainees.findIndex(
          (trainee) =>
            trainee.id ===
            selectedTrainee.id
        )
      : -1;

  const canGoPrevious =
    selectedIndex > 0;

  const canGoNext =
    selectedIndex !== -1 &&
    selectedIndex <
      trainees.length - 1;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      <div className="overflow-hidden rounded-xl border-2 border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.20)]">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-200">

              <tr>

                <th className="px-4 py-4 text-left font-bold text-gray-800">
                  #
                </th>

                <th className="px-4 py-4 text-left font-bold text-gray-800">
                  Full Name
                </th>

                <th className="px-4 py-4 text-left font-bold text-gray-800">
                  Trainee ID
                </th>

                <th className="px-4 py-4 text-left font-bold text-gray-800">
                  Email
                </th>

                <th className="px-4 py-4 text-left font-bold text-gray-800">
                  Status
                </th>

                <th className="px-4 py-4 text-left font-bold text-gray-800">
                  Verification Status
                </th>

                <th className="px-4 py-4 text-center font-bold text-gray-800">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {paginatedTrainees.length >
              0 ? (

                paginatedTrainees.map(
                  (
                    trainee,
                    index
                  ) => {

                    const traineeStatus =
                      String(
                        trainee.status ??
                          ""
                      )
                        .toLowerCase()
                        .trim();

                    const isApproved =
                      traineeStatus ===
                        "approved" ||
                      traineeStatus ===
                        "active";

                    const isInactive =
                      traineeStatus ===
                        "inactive" ||
                      traineeStatus ===
                        "deactivated";

                    return (

                      <tr
                        key={
                          trainee.id
                        }
                        className="border-b border-gray-300 transition hover:bg-gray-100"
                      >

                        <td className="px-4 py-3 text-gray-700">
                          {startIndex +
                            index +
                            1}
                        </td>

                        <td className="px-4 py-3 font-medium text-gray-900">
                          {
                            trainee.fullName
                          }
                        </td>

                        <td className="px-4 py-3 text-gray-700">
                          {
                            trainee.traineeId
                          }
                        </td>

                        <td className="px-4 py-3 text-gray-700">
                          {
                            trainee.email
                          }
                        </td>

                        <td className="px-4 py-3">

                          <span
                            className={`rounded-full px-4 py-1 text-sm font-medium ${getStatusClass(
                              trainee.status
                            )}`}
                          >
                            {
                              trainee.status
                            }
                          </span>

                        </td>

                        <td className="px-4 py-3 text-gray-700">
                          {
                            trainee.verificationStatus
                          }
                        </td>

                        <td className="px-4 py-3">

                          <div
                            ref={
                              openMenuId ===
                              trainee.id
                                ? menuRef
                                : null
                            }
                            className="relative flex"
                          >

                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId ===
                                    trainee.id
                                    ? null
                                    : trainee.id
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-blue-100 hover:text-[#15294b]"
                              aria-label="Open trainee actions"
                            >

                              <span className="flex flex-col gap-1">

                                <span className="h-1 w-1 rounded-full bg-current" />

                                <span className="h-1 w-1 rounded-full bg-current" />

                                <span className="h-1 w-1 rounded-full bg-current" />

                              </span>

                            </button>

                            {openMenuId ===
                              trainee.id && (

                              <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-lg border border-gray-100 bg-white py-2 shadow-lg">

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenProfile(
                                      trainee
                                    )
                                  }
                                  className="flex w-full items-center px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                                >
                                  View Profile
                                </button>

                                {isApproved && (

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeactivate(
                                        trainee
                                      )
                                    }
                                    className="flex w-full items-center px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                                  >
                                    Deactivate
                                  </button>

                                )}

                                {isInactive && (

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleReactivate(
                                        trainee
                                      )
                                    }
                                    className="flex w-full items-center px-4 py-3 text-left text-sm font-medium text-green-700 transition hover:bg-green-50"
                                  >
                                    Reactivate
                                  </button>

                                )}

                              </div>

                            )}

                          </div>

                        </td>

                      </tr>

                    );
                  }
                )

              ) : (

                <tr>

                  <td
                    colSpan="7"
                    className="py-8 text-center text-gray-500"
                  >
                    No trainees found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-4 text-sm">

            <p className="font-medium text-gray-700">

              Showing {showingStart}-
              {showingEnd} of{" "}
              {trainees.length} trainees

            </p>

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.max(
                        page - 1,
                        1
                      )
                  )
                }
                disabled={
                  currentPage ===
                  1
                }
                className="flex items-center gap-1 text-gray-500 transition hover:text-[#15294b] disabled:cursor-not-allowed disabled:opacity-40"
              >

                <ChevronLeft
                  size={16}
                />

                Prev

              </button>

              <span className="rounded-lg border border-gray-200 px-3 py-2 font-semibold text-[#15294b] shadow-sm">

                {currentPage}

              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.min(
                        page + 1,
                        totalPages
                      )
                  )
                }
                disabled={
                  currentPage >=
                  totalPages
                }
                className="flex items-center gap-1 text-gray-500 transition hover:text-[#15294b] disabled:cursor-not-allowed disabled:opacity-40"
              >

                Next

                <ChevronRight
                  size={16}
                />

              </button>

            </div>

          </div>

        </div>

      </div>

      <RegistrationProfileModal
        profile={
          selectedTrainee
        }
        title="Trainee Profile"
        onClose={() =>
          setSelectedTrainee(
            null
          )
        }
        onApprove={
          onApprove
        }
        onReject={
          onReject
        }
        onPrevious={
          handlePreviousProfile
        }
        onNext={
          handleNextProfile
        }
        canGoPrevious={
          canGoPrevious
        }
        canGoNext={
          canGoNext
        }
        currentNumber={
          selectedIndex >= 0
            ? selectedIndex + 1
            : 0
        }
        totalProfiles={
          trainees.length
        }
      />
    </>
  );
}

export default TraineeTable;