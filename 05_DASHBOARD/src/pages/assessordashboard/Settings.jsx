import { ClipboardCheck } from "lucide-react";
import AccountSettingsPage from "../../components/common/AccountSettingsPage";

const fields = [
  { id: "fullName", label: "Full Name" },
  { id: "email", label: "Email Address", type: "email" },
  { id: "mainContact", label: "Main Contact Number" },
  { id: "altContact", label: "Alt. Contact Number" },
  {
    id: "center",
    label: "Institution / Assessment Center",
  },
  {
    id: "qualification",
    label: "Qualification / Trade",
  },
  {
    id: "accreditation",
    label: "Assessor Accreditation Information / Status",
    type: "select",
    options: ["Accredited", "For Renewal", "Inactive"],
  },
];

const notificationItems = [
  {
    id: "assessment_assignment_notifications",
    title: "Assessment assignment notifications",
    description:
      "Receive notifications when new assessments are assigned.",
  },
  {
    id: "upcoming_assessment_reminders",
    title: "Upcoming assessment reminders",
    description:
      "Receive reminders about your upcoming scheduled assessments.",
  },
  {
    id: "assessment_schedule_changes",
    title: "Assessment schedule changes",
    description:
      "Receive alerts when there are changes to assessment schedules.",
  },
  {
    id: "trainee_submission_notifications",
    title: "Trainee submission notifications",
    description:
      "Receive notifications when trainees submit their work or assessments.",
  },
  {
    id: "evaluation_reminders",
    title: "Evaluation reminders",
    description:
      "Receive reminders to complete pending evaluations.",
  },
  {
    id: "results_related_notifications",
    title: "Results-related notifications",
    description:
      "Receive notifications regarding assessment results.",
  },
  {
    id: "certificate_related_notifications",
    title: "Certificate-related notifications",
    description:
      "Receive notifications regarding certificate statuses.",
  },
  {
    id: "system_announcements",
    title: "System announcements",
    description:
      "Receive important updates and announcements from the system.",
  },
];

export default function Settings() {
  return (
    <AccountSettingsPage
      role="Accredited Assessor"
      avatar="/assessor.jpg"
      officeLabel="Institution / Assessment Center"
      officeValue=""
      accreditation=""
      fields={fields}
      notificationItems={notificationItems}
      extraTabs={[
        {
          id: "assessment",
          label: "Assessment Preferences",
          icon: ClipboardCheck,
        },
      ]}
      showAssessmentPreferences
      hideSystemPreferences
      useProfileData
    />
  );
}

