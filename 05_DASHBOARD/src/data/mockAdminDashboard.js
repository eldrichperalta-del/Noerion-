export const mockAdminDashboard = {
  stats: { totalTrainees: 128, totalAssessors: 14, totalAssessments: 36, certificatesIssued: 92 },
  analytics: { passRate: 78, completionRate: 84 },
  assessments: [
    { id: 1, traineeName: "Maria Santos", assessmentType: "Electrical Installation NC II", status: "Ongoing" },
    { id: 2, traineeName: "John Dela Cruz", assessmentType: "Computer Systems Servicing NC II", status: "Scheduled" },
    { id: 3, traineeName: "Angela Reyes", assessmentType: "Bread and Pastry Production NC II", status: "Ongoing" },
  ],
  certificates: [
    { id: 1, traineeName: "Paolo Garcia", course: "Electrical Installation NC II", status: "Issued" },
    { id: 2, traineeName: "Lara Mendoza", course: "Computer Systems Servicing NC II", status: "For Verification" },
    { id: 3, traineeName: "Noel Ramos", course: "Cookery NC II", status: "Issued" },
  ],
  activities: [
    { id: 1, message: "Maria Santos completed her written assessment.", time: "10 minutes ago" },
    { id: 2, message: "A new certificate was issued to Paolo Garcia.", time: "1 hour ago" },
    { id: 3, message: "Assessor Ana Cruz was assigned to an assessment.", time: "Today" },
  ],
};
