// ============================================================================
// MOCK ASSESSMENT HISTORY
// ----------------------------------------------------------------------------
// BACKEND HANDOFF:
//
// Replace this mock data with completed assessment records retrieved from
// Supabase for the currently authenticated assessor.
//
// Suggested fields:
//
// id
// traineeName
// traineeId
// course
// writtenScore
// finalResult
// completedDate
// status
// aiAvailable
//
// ============================================================================

export const mockAssessmentHistory = [
    {
        id: 1,
        traineeName: "Juan Dela Cruz",
        traineeId: "TRN-2025-001",
        course: "Computer Systems Servicing NC II",
        writtenScore: 92,
        finalResult: "Competent",
        completedDate: "April 16, 2025",
        status: "Verified",
        aiAvailable: true,
    },
    {
        id: 2,
        traineeName: "Maria Santos",
        traineeId: "TRN-2025-002",
        course: "Electrical Installation and Maintenance NC II",
        writtenScore: 87,
        finalResult: "Competent",
        completedDate: "April 15, 2025",
        status: "Completed",
        aiAvailable: true,
    },
    {
        id: 3,
        traineeName: "Carlo Reyes",
        traineeId: "TRN-2025-003",
        course: "Automotive Servicing NC II",
        writtenScore: 71,
        finalResult: "Not Yet Competent",
        completedDate: "April 14, 2025",
        status: "Completed",
        aiAvailable: false,
    },
    {
        id: 4,
        traineeName: "Angela Cruz",
        traineeId: "TRN-2025-004",
        course: "Computer Systems Servicing NC II",
        writtenScore: 95,
        finalResult: "Competent",
        completedDate: "April 13, 2025",
        status: "Verified",
        aiAvailable: true,
    },
    {
        id: 5,
        traineeName: "Mark Dizon",
        traineeId: "TRN-2025-005",
        course: "Electrical Installation and Maintenance NC II",
        writtenScore: 84,
        finalResult: "Competent",
        completedDate: "April 12, 2025",
        status: "Completed",
        aiAvailable: true,
    },
    {
        id: 6,
        traineeName: "Sofia Mendoza",
        traineeId: "TRN-2025-006",
        course: "Automotive Servicing NC II",
        writtenScore: 69,
        finalResult: "Not Yet Competent",
        completedDate: "April 11, 2025",
        status: "Completed",
        aiAvailable: false,
    },
    {
        id: 7,
        traineeName: "Daniel Ramos",
        traineeId: "TRN-2025-007",
        course: "Computer Systems Servicing NC II",
        writtenScore: 90,
        finalResult: "Competent",
        completedDate: "April 10, 2025",
        status: "Verified",
        aiAvailable: true,
    },
    {
        id: 8,
        traineeName: "Patricia Flores",
        traineeId: "TRN-2025-008",
        course: "Electrical Installation and Maintenance NC II",
        writtenScore: 76,
        finalResult: "Competent",
        completedDate: "April 9, 2025",
        status: "Completed",
        aiAvailable: true,
    },
];