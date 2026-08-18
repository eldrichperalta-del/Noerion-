import { ClipboardCheck } from "lucide-react";
import AccountSettingsPage from "../../components/common/AccountSettingsPage";

const fields = [
  { id: "fullName", label: "Full Name" },
  { id: "email", label: "Email Address", type: "email" },
  { id: "mainContact", label: "Main Contact Number" },
  { id: "altContact", label: "Alt. Contact Number" },
  { id: "center", label: "Institution / Assessment Center" },
  { id: "qualification", label: "Qualification / Trade" },
  { id: "accreditation", label: "Assessor Accreditation Information / Status", type: "select", options: ["Accredited", "For Renewal", "Inactive"] },
];

const notificationItems = [
  ["assignment", "Assessment assignment notifications", "Receive notifications when new assessments are assigned."],
  ["upcoming", "Upcoming assessment reminders", "Receive reminders about your upcoming scheduled assessments."],
  ["changes", "Assessment schedule changes", "Receive alerts when there are changes to assessment schedules."],
  ["submissions", "Trainee submission notifications", "Receive notifications when trainees submit their work or assessments."],
  ["evaluation", "Evaluation reminders", "Receive reminders to complete pending evaluations."],
  ["results", "Results-related notifications", "Receive notifications regarding assessment results."],
  ["certificates", "Certificate-related notifications", "Receive notifications regarding certificate statuses."],
  ["announcements", "System announcements", "Receive important updates and announcements from the system."],
].map(([id, title, description]) => ({ id, title, description }));

export default function Settings() {
  return <AccountSettingsPage role="Accredited Assessor" avatar="/assessor.jpg" officeLabel="Institution / Assessment Center" officeValue="TESDA Accredited Center - NCR" accreditation="Accredited" fields={fields} notificationItems={notificationItems} extraTabs={[{ id: "assessment", label: "Assessment Preferences", icon: ClipboardCheck }]} showAssessmentPreferences hideSystemPreferences initialValues={{ fullName: "Miguel Santos", email: "miguel.santos@example.com", mainContact: "0917 555 0912", altContact: "", center: "TESDA Accredited Center - NCR", qualification: "Computer Systems Servicing NC II", accreditation: "Accredited" }} />;
}
