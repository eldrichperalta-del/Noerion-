import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import QuestionsContainer from "../../components/admin/assessment-details/QuestionsContainer";

/* ============================================================
   FORMAT DATE
   ============================================================ */

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ============================================================
   FORMAT TIME LIMIT
   ============================================================ */

function formatTimeLimit(minutes) {
  if (
    minutes === null ||
    minutes === undefined ||
    minutes === ""
  ) {
    return "—";
  }

  const value = Number(minutes);

  if (!Number.isFinite(value) || value <= 0) {
    return "—";
  }

  if (value < 60) {
    return `${value} minutes`;
  }

  const hours = Math.floor(value / 60);
  const remainingMinutes = value % 60;

  if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }

  return `${hours} hour${hours > 1 ? "s" : ""} ${remainingMinutes} minutes`;
}

/* ============================================================
   STATUS BADGE
   ============================================================ */

function StatusBadge({ status }) {
  const normalized = String(status || "Draft")
    .trim()
    .toLowerCase();

  let className =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";

  if (normalized === "active") {
    className += " bg-green-100 text-green-700";
  } else if (normalized === "archived") {
    className += " bg-gray-100 text-gray-600";
  } else {
    className += " bg-yellow-100 text-yellow-700";
  }

  return (
    <span className={className}>
      {String(status || "Draft")}
    </span>
  );
}

/* ============================================================
   NORMALIZE QUESTION TYPE
   ============================================================ */

function normalizeQuestionType(value) {
  const type = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ");

  if (
    type === "multiple choice" ||
    type === "multiplechoice" ||
    type === "mc"
  ) {
    return "Multiple Choice";
  }

  if (
    type === "true false" ||
    type === "truefalse" ||
    type === "true/false"
  ) {
    return "True/False";
  }

  if (
    type === "matching" ||
    type === "matching type"
  ) {
    return "Matching Type";
  }

  if (
    type === "identification" ||
    type === "identify"
  ) {
    return "Identification";
  }

  if (
    type === "situational" ||
    type === "situation"
  ) {
    return "Situational";
  }

  return value || "Multiple Choice";
}

/* ============================================================
   PARSE MATCHING PAIRS
   ============================================================ */

function parseMatchingPairs(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed =
      typeof value === "string"
        ? JSON.parse(value)
        : value;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((pair, index) => ({
      item:
        pair?.item ??
        pair?.left ??
        "",

      match:
        pair?.match ??
        pair?.right ??
        "",

      itemLabel:
        pair?.itemLabel ||
        `Item ${index + 1}`,

      matchLabel:
        pair?.matchLabel ||
        `Match ${index + 1}`,
    }));
  } catch (error) {
    console.warn(
      "Unable to parse matching pairs:",
      error
    );

    return [];
  }
}

/* ============================================================
   GET ANSWER KEY VALUE
   ============================================================ */

function getAnswerKeyValue(answerKey) {
  if (!answerKey) {
    return "";
  }

  return (
    answerKey.correct_answer ??
    answerKey.answer ??
    answerKey.answer_text ??
    answerKey.correct_option ??
    ""
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function AssessmentDetails() {
  const { id } = useParams();

  /* ==========================================================
     STATE
     ========================================================== */

  const [assessment, setAssessment] =
    useState(null);

  const [course, setCourse] =
    useState(null);

  const [questions, setQuestions] =
    useState([]);

  const [saving, setSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [openSections, setOpenSections] =
    useState({});

  const [status, setStatus] =
    useState("Draft");

  /* ==========================================================
     LOAD ASSESSMENT
     ========================================================== */

  const loadAssessment = async () => {
    if (!id) {
      setErrorMessage(
        "Assessment ID is missing."
      );

      return;
    }

    setErrorMessage("");

    try {
      /* ========================================================
         1. LOAD ASSESSMENT
         ======================================================== */

      const {
        data: assessmentData,
        error: assessmentError,
      } = await supabase
        .from("assessments")
        .select(`
          id,
          course_id,
          title,
          set_type,
          total_items,
          time_limit_minutes,
          is_active,
          created_at,
          status
        `)
        .eq("id", id)
        .maybeSingle();

      if (assessmentError) {
        throw assessmentError;
      }

      if (!assessmentData) {
        throw new Error(
          "The assessment could not be found."
        );
      }

      setAssessment(assessmentData);

      setStatus(
        assessmentData.status ||
        "Draft"
      );

      /* ========================================================
         2. LOAD COURSE
         ======================================================== */

      if (assessmentData.course_id) {
        const {
          data: courseData,
          error: courseError,
        } = await supabase
          .from("courses")
          .select(`
            id,
            code,
            title,
            qualification_level
          `)
          .eq(
            "id",
            assessmentData.course_id
          )
          .maybeSingle();

        if (courseError) {
          console.warn(
            "Unable to load course:",
            courseError
          );

          setCourse(null);
        } else {
          setCourse(
            courseData || null
          );
        }
      } else {
        setCourse(null);
      }

      /* ========================================================
         3. LOAD QUESTIONS
         ======================================================== */

      const {
        data: questionData,
        error: questionError,
      } = await supabase
        .from("questions")
        .select("*")
        .eq("assessment_id", id)
        .order("item_number", {
          ascending: true,
        });

      if (questionError) {
        throw questionError;
      }

      const baseQuestions =
        questionData || [];

      /* ========================================================
         4. LOAD OPTIONS + ANSWER KEYS
         ======================================================== */

      const questionIds =
        baseQuestions
          .map(
            (question) =>
              question.id
          )
          .filter(Boolean);

      let options = [];
      let answerKeys = [];

      if (questionIds.length > 0) {
        const [
          optionsResponse,
          answerKeysResponse,
        ] = await Promise.all([
          supabase
            .from("question_options")
            .select("*")
            .in(
              "question_id",
              questionIds
            ),

          supabase
            .from("answer_keys")
            .select("*")
            .in(
              "question_id",
              questionIds
            ),
        ]);

        if (optionsResponse.error) {
          console.warn(
            "Unable to load question options:",
            optionsResponse.error
          );
        } else {
          options =
            optionsResponse.data || [];
        }

        if (answerKeysResponse.error) {
          console.warn(
            "Unable to load answer keys:",
            answerKeysResponse.error
          );
        } else {
          answerKeys =
            answerKeysResponse.data || [];
        }
      }

      /* ========================================================
         5. FORMAT QUESTIONS
         ======================================================== */

      const formattedQuestions =
        baseQuestions.map(
          (question) => {
            /* --------------------------------------------------
               QUESTION TYPE
            -------------------------------------------------- */

            const section =
              normalizeQuestionType(
                question.test_section ||
                question.question_type ||
                "Multiple Choice"
              );

            /* --------------------------------------------------
               OPTIONS
            -------------------------------------------------- */

            const questionOptions =
              options
                .filter(
                  (option) =>
                    String(
                      option.question_id
                    ) ===
                    String(question.id)
                )
                .sort((a, b) => {
                  const aOrder =
                    Number(
                      a.option_order ??
                      a.order_number ??
                      0
                    );

                  const bOrder =
                    Number(
                      b.option_order ??
                      b.order_number ??
                      0
                    );

                  if (
                    aOrder !==
                    bOrder
                  ) {
                    return (
                      aOrder - bOrder
                    );
                  }

                  return (
                    Number(a.id) -
                    Number(b.id)
                  );
                });

            /* --------------------------------------------------
               ANSWER KEY
            -------------------------------------------------- */

            const questionAnswerKey =
              answerKeys.find(
                (answerKey) =>
                  String(
                    answerKey.question_id
                  ) ===
                  String(question.id)
              );

            /* --------------------------------------------------
               CORRECT ANSWER

               Priority:
               1. questions.correct_answer
               2. questions.answer
               3. answer_keys.correct_answer
               4. answer_keys.answer
               5. answer_keys.answer_text
               6. answer_keys.correct_option
            -------------------------------------------------- */

            let correctAnswer =
              question.correct_answer ??
              question.answer ??
              "";

            if (
              !correctAnswer &&
              questionAnswerKey
            ) {
              correctAnswer =
                getAnswerKeyValue(
                  questionAnswerKey
                );
            }

            /* --------------------------------------------------
               CHOICES

               Preserve the actual option data as well as
               the simple string array.
            -------------------------------------------------- */

            const choices =
              questionOptions.map(
                (option) =>
                  option.option_text ??
                  option.text ??
                  option.option ??
                  option.value ??
                  ""
              );

            /* --------------------------------------------------
               MATCHING PAIRS
            -------------------------------------------------- */

            let matchingPairs = [];

            if (
              section ===
              "Matching Type" ||
              section === "Matching"
            ) {
              matchingPairs =
                parseMatchingPairs(
                  correctAnswer
                );
            }

            /* --------------------------------------------------
               RETURN NORMALIZED QUESTION
            -------------------------------------------------- */

            return {
              ...question,

              id: question.id,

              item_number:
                question.item_number,

              test_section:
                section,

              question_type:
                section,

              question_text:
                question.question_text ||
                question.question ||
                "",

              points:
                question.points ===
                  null ||
                  question.points ===
                  undefined
                  ? 1
                  : Number(
                    question.points
                  ) || 1,

              correct_answer:
                correctAnswer,

              answer:
                correctAnswer,

              choices,

              options:
                questionOptions,

              matching_pairs:
                matchingPairs,
            };
          }
        );

      /* ========================================================
         6. UPDATE QUESTION STATE
         ======================================================== */

      setQuestions(
        formattedQuestions
      );

      /* ========================================================
         7. INITIAL SECTION STATE
         
         Keep sections CLOSED when the page loads.
      ======================================================== */

      const initialSections = {};

      formattedQuestions.forEach(
        (question) => {
          const section =
            question.test_section ||
            "Multiple Choice";

          if (
            initialSections[
            section
            ] === undefined
          ) {
            initialSections[
              section
            ] = false;
          }
        }
      );

      setOpenSections(
        initialSections
      );
    } catch (error) {
      console.error(
        "Error loading assessment:",
        error
      );

      setAssessment(null);
      setCourse(null);
      setQuestions([]);

      setErrorMessage(
        error?.message ||
        "Unable to load the assessment."
      );
    }
  };

  /* ==========================================================
     LOAD WHEN ID CHANGES
     ========================================================== */

  useEffect(() => {
    loadAssessment();
  }, [id]);

  /* ==========================================================
     COURSE LABEL
     ========================================================== */

  const courseLabel = useMemo(() => {
    if (!course) {
      return "—";
    }

    const code =
      course.code || "";

    const title =
      course.title || "";

    if (code && title) {
      return `${code} - ${title}`;
    }

    return (
      code ||
      title ||
      "—"
    );
  }, [course]);

  /* ==========================================================
     GROUP QUESTIONS
     ========================================================== */

  const groupedQuestions =
    useMemo(() => {
      return questions.reduce(
        (groups, question) => {
          const section =
            normalizeQuestionType(
              question.test_section ||
              question.question_type ||
              "Multiple Choice"
            );

          if (!groups[section]) {
            groups[section] = [];
          }

          groups[section].push(
            question
          );

          return groups;
        },
        {}
      );
    }, [questions]);

  /* ==========================================================
     TOGGLE SECTION
     ========================================================== */

  const toggleSection = (
    section
  ) => {
    setOpenSections(
      (previous) => ({
        ...previous,

        [section]:
          !previous[section],
      })
    );
  };

  /* ==========================================================
     SAVE QUESTION
     ========================================================== */

  const saveQuestion = async (
    form
  ) => {
    if (!id) {
      setErrorMessage(
        "Assessment ID is missing."
      );

      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      /* ========================================================
         NORMALIZE TYPE
         
         IMPORTANT:
         Edit mode sends the existing type.
         We DO NOT change it from a dropdown here.
      ======================================================== */

      const questionType =
        normalizeQuestionType(
          form.test_section ||
          form.question_type
        );

      /* ========================================================
         QUESTION TEXT
      ======================================================== */

      const questionText =
        String(
          form.question_text ??
          form.question ??
          ""
        ).trim();

      if (!questionText) {
        throw new Error(
          "Question text is required."
        );
      }

      /* ========================================================
         QUESTION PAYLOAD
      ======================================================== */

      const questionPayload = {
        assessment_id: id,

        question_text:
          questionText,

        test_section:
          questionType,

        points:
          Number(form.points) ||
          1,
      };

      let questionId =
        form.question_id ??
        form.id ??
        null;

      /* ========================================================
         UPDATE EXISTING QUESTION
      ======================================================== */

      if (questionId) {
        const {
          error:
          updateQuestionError,
        } = await supabase
          .from("questions")
          .update(
            questionPayload
          )
          .eq(
            "id",
            questionId
          );

        if (
          updateQuestionError
        ) {
          throw updateQuestionError;
        }
      }

      /* ========================================================
         INSERT NEW QUESTION
      ======================================================== */

      else {
        const itemNumbers =
          questions
            .map(
              (question) =>
                Number(
                  question.item_number
                ) || 0
            );

        const highestItemNumber =
          itemNumbers.length > 0
            ? Math.max(
              ...itemNumbers
            )
            : 0;

        const nextItemNumber =
          highestItemNumber + 1;

        const {
          data:
          insertedQuestion,
          error:
          insertQuestionError,
        } = await supabase
          .from("questions")
          .insert({
            ...questionPayload,

            item_number:
              nextItemNumber,
          })
          .select("id")
          .single();

        if (
          insertQuestionError
        ) {
          throw insertQuestionError;
        }

        questionId =
          insertedQuestion?.id;

        if (!questionId) {
          throw new Error(
            "The question was created but its ID could not be retrieved."
          );
        }
      }

      /* ========================================================
         DELETE OLD OPTIONS
         
         Only Multiple Choice normally uses these.
         Deleting them during edit prevents stale choices.
      ======================================================== */

      const {
        error:
        deleteOptionsError,
      } = await supabase
        .from("question_options")
        .delete()
        .eq(
          "question_id",
          questionId
        );

      if (
        deleteOptionsError
      ) {
        throw deleteOptionsError;
      }

      /* ========================================================
         INSERT MULTIPLE CHOICE OPTIONS
      ======================================================== */

      if (
        questionType ===
        "Multiple Choice"
      ) {
        const validChoices =
          (
            form.choices ||
            []
          )
            .map(
              (choice) =>
                String(
                  choice ?? ""
                ).trim()
            )
            .filter(Boolean);

        if (
          validChoices.length >
          0
        ) {
          const optionRows =
            validChoices.map(
              (
                choice,
                index
              ) => ({
                question_id:
                  questionId,

                option_text:
                  choice,

                option_order:
                  index + 1,

                option_letter:
                  String.fromCharCode(
                    65 + index
                  ),
              })
            );

          /*
           * Some databases may not have option_letter.
           * Try the complete row first, then fall back
           * to the columns already used by the application.
           */

          let {
            error:
            insertOptionsError,
          } = await supabase
            .from("question_options")
            .insert(
              optionRows
            );

          if (
            insertOptionsError
          ) {
            const fallbackRows =
              validChoices.map(
                (
                  choice,
                  index
                ) => ({
                  question_id:
                    questionId,

                  option_text:
                    choice,

                  option_order:
                    index + 1,
                })
              );

            const fallbackResult =
              await supabase
                .from(
                  "question_options"
                )
                .insert(
                  fallbackRows
                );

            insertOptionsError =
              fallbackResult.error;
          }

          if (
            insertOptionsError
          ) {
            throw insertOptionsError;
          }
        }
      }

      /* ========================================================
         DELETE OLD ANSWER KEY
      ======================================================== */

      const {
        error:
        deleteAnswerKeyError,
      } = await supabase
        .from("answer_keys")
        .delete()
        .eq(
          "question_id",
          questionId
        );

      if (
        deleteAnswerKeyError
      ) {
        throw deleteAnswerKeyError;
      }

      /* ========================================================
         BUILD CORRECT ANSWER
      ======================================================== */

      let correctAnswer = "";

      /* ========================================================
         MATCHING TYPE
      ======================================================== */

      if (
        questionType ===
        "Matching Type"
      ) {
        const validPairs =
          (
            form.matching_pairs ||
            []
          )
            .map(
              (pair, index) => ({
                item:
                  String(
                    pair?.item ??
                    ""
                  ).trim(),

                match:
                  String(
                    pair?.match ??
                    ""
                  ).trim(),

                itemLabel:
                  pair?.itemLabel ||
                  `Item ${index + 1
                  }`,

                matchLabel:
                  pair?.matchLabel ||
                  `Match ${index + 1
                  }`,
              })
            )
            .filter(
              (pair) =>
                pair.item &&
                pair.match
            );

        if (
          validPairs.length >
          0
        ) {
          correctAnswer =
            JSON.stringify(
              validPairs
            );
        }
      }

      /* ========================================================
         OTHER QUESTION TYPES
      ======================================================== */

      else {
        correctAnswer =
          String(
            form.correct_answer ??
            form.answer ??
            ""
          ).trim();
      }

      /* ========================================================
         INSERT ANSWER KEY
      ======================================================== */

      if (correctAnswer) {
        const {
          error:
          insertAnswerKeyError,
        } = await supabase
          .from("answer_keys")
          .insert({
            question_id:
              questionId,

            correct_answer:
              correctAnswer,
          });

        if (
          insertAnswerKeyError
        ) {
          throw insertAnswerKeyError;
        }
      }

      /* ========================================================
         UPDATE TOTAL ITEMS
      ======================================================== */

      const {
        count,
        error: countError,
      } = await supabase
        .from("questions")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "assessment_id",
          id
        );

      if (!countError) {
        const {
          error:
          assessmentUpdateError,
        } = await supabase
          .from("assessments")
          .update({
            total_items:
              Number(count) || 0,
          })
          .eq(
            "id",
            id
          );

        if (
          assessmentUpdateError
        ) {
          console.warn(
            "Unable to update total_items:",
            assessmentUpdateError
          );
        }
      }

      /* ========================================================
         SUCCESS
      ======================================================== */

      setSuccessMessage(
        questionId &&
          form.question_id
          ? "Question updated successfully."
          : "Question saved successfully."
      );

      /* ========================================================
         RELOAD DATABASE DATA
         
         This is important because the edit modal should
         always receive the latest choices and answer.
      ======================================================== */

      await loadAssessment();
    } catch (error) {
      console.error(
        "Error saving question:",
        error
      );

      setErrorMessage(
        error?.message ||
        "Unable to save the question."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     PAGE
     ========================================================== */

  return (
    <div className="space-y-6">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

        <div>

          {/* ======================================================
              BREADCRUMBS
          ====================================================== */}

          <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold">

            <Link
              to="/admin/assessments"
              className="text-gray-500 hover:text-[#002f86] hover:underline"
            >
              Assessment Library
            </Link>

            <span className="text-gray-400">
              &gt;
            </span>

            {assessment?.course_id ? (
              <Link
                to={`/admin/assessments/course/${assessment.course_id}`}
                className="max-w-[260px] truncate text-gray-500 hover:text-[#002f86] hover:underline"
                title={
                  assessment?.title ||
                  "Assessment"
                }
              >
                {assessment?.title ||
                  "Assessment"}
              </Link>
            ) : (
              <span className="max-w-[260px] truncate text-gray-500">
                {assessment?.title ||
                  "Assessment"}
              </span>
            )}

            <span className="text-gray-400">
              &gt;
            </span>

            <span className="text-[#002f86]">
              Assessment Details
            </span>

          </nav>

          {/* ======================================================
              TITLE
          ====================================================== */}

          <div className="flex flex-wrap items-center gap-3">

            <h1 className="text-3xl font-bold text-gray-900">
              {assessment?.title ||
                "Assessment Details"}
            </h1>

            <StatusBadge
              status={status}
            />

          </div>

          <p className="mt-2 text-gray-600">
            Manage assessment information and questions.
          </p>

        </div>

      </div>

      {/* ========================================================
          MESSAGES
      ======================================================== */}

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {successMessage}
        </div>
      )}

      {/* ========================================================
          ASSESSMENT INFORMATION
      ======================================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

        <div className="border-b border-gray-200 px-6 py-5">

          <h2 className="text-base font-bold text-gray-900">
            Assessment Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Basic information about this assessment.
          </p>

        </div>

        <div className="grid grid-cols-1 gap-6 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3">

          <div>
            <p className="text-m font-bold uppercase tracking-wide ">
              Assessment Name
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {assessment?.title ||
                "—"}
            </p>
          </div>

          <div>
            <p className="text-m font-bold uppercase tracking-wide">
              Course Code / Title
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {courseLabel}
            </p>
          </div>

          <div>
            <p className="text-m font-bold uppercase tracking-wide">
              Assessment Type
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {assessment?.set_type ||
                "—"}
            </p>
          </div>

          <div>
            <p className="text-m font-bold uppercase tracking-wide">
              Total Questions
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {assessment?.total_items ??
                questions.length}
            </p>
          </div>

          <div>
            <p className="text-m font-bold uppercase tracking-wide">
              Time Limit
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatTimeLimit(
                assessment?.time_limit_minutes
              )}
            </p>
          </div>

          <div>
            <p className="text-m font-bold uppercase tracking-wide">
              Created Date
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatDate(
                assessment?.created_at
              )}
            </p>
          </div>

        </div>

      </div>

      {/* ========================================================
          QUESTIONS CONTAINER
      ======================================================== */}

      <QuestionsContainer
        questions={questions}

        groupedQuestions={
          groupedQuestions
        }

        openSections={
          openSections
        }

        toggleSection={
          toggleSection
        }

        onSaveQuestion={
          saveQuestion
        }

        saving={saving}
      />

    </div>
  );
}