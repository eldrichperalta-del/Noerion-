import { useMemo, useState } from "react";
import QuestionsContainer from "../../../../../components/admin/create-assessment/QuestionsContainer";

export default function WrittenAssessmentBuilder({
  assessmentData,
  setAssessmentData,
}) {
  const [saving, setSaving] = useState(false);

  const questions = assessmentData.questions || [];

  /* ============================================================
     GROUP QUESTIONS
  ============================================================ */

  const groupedQuestions = useMemo(() => {
    return questions.reduce((groups, question) => {
      const section =
        question.test_section ||
        question.question_type ||
        "Multiple Choice";

      if (!groups[section]) {
        groups[section] = [];
      }

      groups[section].push(question);

      return groups;
    }, {});
  }, [questions]);

  /* ============================================================
     OPEN SECTIONS
  ============================================================ */

  const [openSections, setOpenSections] = useState({});

  const toggleSection = (section) => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  /* ============================================================
     SAVE QUESTION
     
     IMPORTANT:
     This does NOT save to Supabase yet.

     It only stores the question inside assessmentData.
     CreateAssessment.jsx will save everything to the database
     when "Save Assessment" is clicked.
  ============================================================ */

  const handleSaveQuestion = async (question) => {
    setSaving(true);

    try {
      setAssessmentData((current) => {
        const existingQuestions =
          Array.isArray(current.questions)
            ? current.questions
            : [];

        const existingIndex =
          existingQuestions.findIndex(
            (item) =>
              item.id === question.question_id
          );

        /* ====================================================
           EDIT EXISTING QUESTION
        ==================================================== */

        if (existingIndex !== -1) {
          const updatedQuestions = [
            ...existingQuestions,
          ];

          updatedQuestions[existingIndex] = {
            ...updatedQuestions[existingIndex],
            ...question,
            id: question.question_id,
          };

          return {
            ...current,
            questions: updatedQuestions,
          };
        }

        /* ====================================================
           ADD NEW QUESTION
        ==================================================== */

        return {
          ...current,
          questions: [
            ...existingQuestions,
            {
              ...question,
              id:
                question.question_id ||
                `local-${Date.now()}`,
            },
          ],
        };
      });

      return true;
    } finally {
      setSaving(false);
    }
  };

  return (
    <QuestionsContainer
      questions={questions}
      groupedQuestions={groupedQuestions}
      openSections={openSections}
      toggleSection={toggleSection}
      onSaveQuestion={handleSaveQuestion}
      saving={saving}
    />
  );
}