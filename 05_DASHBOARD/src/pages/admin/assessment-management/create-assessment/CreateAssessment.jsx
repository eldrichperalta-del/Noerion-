import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../../supabaseClient";
import QuestionsContainer from "../../../../components/admin/assessment-details/QuestionsContainer";

export default function CreateAssessment() {
    const navigate = useNavigate();

    /* ============================================================
       STATE
    ============================================================ */

    const [courses, setCourses] = useState([]);

    const [loadingCourses, setLoadingCourses] = useState(true);

    const [saving, setSaving] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");

    const [successMessage, setSuccessMessage] = useState("");

    const [openSections, setOpenSections] = useState({});

    const [assessmentData, setAssessmentData] = useState({
        title: "",
        qualification: "",
        questions: [],
        courseId: "",
        setType: "Set A",
        timeLimit: 30,
    });


    /* ============================================================
       LOAD COURSES
    ============================================================ */

    useEffect(() => {
        loadCourses();
    }, []);


    const loadCourses = async () => {
        setLoadingCourses(true);
        setErrorMessage("");

        try {
            const { data, error } = await supabase
                .from("courses")
                .select(`
                    id,
                    code,
                    title,
                    qualification_level
                `)
                .order("title", {
                    ascending: true,
                });

            if (error) {
                throw error;
            }

            setCourses(data || []);
        } catch (error) {
            console.error(
                "Error loading courses:",
                error
            );

            setErrorMessage(
                `Unable to load courses: ${error.message}`
            );
        } finally {
            setLoadingCourses(false);
        }
    };


    /* ============================================================
       COURSE SELECTION
    ============================================================ */

    const handleCourseChange = (event) => {
        const courseId = event.target.value;

        const selectedCourse = courses.find(
            (course) => String(course.id) === String(courseId)
        );

        setAssessmentData((current) => ({
            ...current,

            courseId,

            qualification:
                selectedCourse?.qualification_level || "",
        }));

        setErrorMessage("");
    };


    /* ============================================================
       QUESTIONS CONTAINER
    ============================================================ */

    const toggleSection = (section) => {
        setOpenSections((current) => ({
            ...current,
            [section]: !current[section],
        }));
    };


    const handleSaveQuestion = async (question) => {
        setAssessmentData((current) => {
            const existingQuestions =
                Array.isArray(current.questions)
                    ? current.questions
                    : [];

            const questionId =
                question?.question_id ??
                question?.id ??
                null;


            /* ========================================================
               EDIT EXISTING QUESTION
            ======================================================== */

            if (questionId) {
                const existingIndex =
                    existingQuestions.findIndex(
                        (existingQuestion) =>
                            String(existingQuestion.id) ===
                            String(questionId) ||
                            String(existingQuestion.question_id) ===
                            String(questionId)
                    );


                if (existingIndex !== -1) {
                    const updatedQuestions = [
                        ...existingQuestions,
                    ];

                    updatedQuestions[existingIndex] = {
                        ...existingQuestions[existingIndex],
                        ...question,

                        id:
                            existingQuestions[
                                existingIndex
                            ].id,
                    };

                    return {
                        ...current,
                        questions: updatedQuestions,
                    };
                }
            }


            /* ========================================================
               ADD NEW QUESTION
            ======================================================== */

            const newQuestion = {
                ...question,

                id:
                    questionId ||
                    `local-${Date.now()}-${Math.random()
                        .toString(36)
                        .slice(2)}`,
            };


            return {
                ...current,

                questions: [
                    ...existingQuestions,
                    newQuestion,
                ],
            };
        });

        setErrorMessage("");

        return true;
    };


    /* ============================================================
       VALIDATION
    ============================================================ */

    const validateAssessment = () => {
        const title =
            assessmentData.title?.trim();

        const courseId =
            assessmentData.courseId;

        const questions =
            Array.isArray(
                assessmentData.questions
            )
                ? assessmentData.questions
                : [];


        if (!courseId) {
            return "Please select a course.";
        }


        if (!title) {
            return "Please enter an assessment title.";
        }


        if (questions.length === 0) {
            return "Please add at least one question.";
        }


        return null;
    };


    /* ============================================================
       NORMALIZE QUESTION TYPE
    ============================================================ */

    const getQuestionType = (question) => {
        const rawType =
            question?.test_section ??
            question?.questionType ??
            question?.question_type ??
            question?.type ??
            "Multiple Choice";


        const normalized =
            String(rawType)
                .trim()
                .toLowerCase()
                .replace(/[_-]/g, " ");


        switch (normalized) {
            case "multiple choice":
            case "multiplechoice":
                return "Multiple Choice";

            case "true false":
            case "true/false":
            case "truefalse":
                return "True/False";

            case "matching type":
            case "matching":
            case "matchingtype":
                return "Matching Type";

            case "identification":
                return "Identification";

            case "situational":
                return "Situational";

            default:
                return String(rawType).trim() || "Multiple Choice";
        }
    };


    /* ============================================================
       GET QUESTION TEXT
    ============================================================ */

    const getQuestionText = (question) => {
        return (
            question?.question_text ??
            question?.question ??
            question?.questionText ??
            question?.text ??
            question?.prompt ??
            ""
        ).trim();
    };


    /* ============================================================
       GET QUESTION OPTIONS

       QuestionsContainer uses `choices`.

       Older question builders may use `options`.
    ============================================================ */

    const getQuestionOptions = (question) => {
        if (Array.isArray(question?.choices)) {
            return question.choices;
        }

        if (Array.isArray(question?.options)) {
            return question.options;
        }

        return [];
    };


    /* ============================================================
       GET OPTION TEXT
    ============================================================ */

    const getOptionText = (option) => {
        if (typeof option === "string") {
            return option.trim();
        }

        return (
            option?.option_text ??
            option?.text ??
            option?.label ??
            option?.value ??
            ""
        ).trim();
    };


    /* ============================================================
       GET CORRECT ANSWER
    ============================================================ */

    const getCorrectAnswer = (question) => {
        return (
            question?.correct_answer ??
            question?.correctAnswer ??
            question?.answer ??
            question?.correctOption ??
            null
        );
    };


    /* ============================================================
       GET MATCHING PAIRS
    ============================================================ */

    const getMatchingPairs = (question) => {
        if (
            Array.isArray(
                question?.matching_pairs
            )
        ) {
            return question.matching_pairs
                .map((pair) => ({
                    item:
                        String(
                            pair?.item ?? ""
                        ).trim(),

                    match:
                        String(
                            pair?.match ?? ""
                        ).trim(),

                    itemLabel:
                        pair?.itemLabel ??
                        "",

                    matchLabel:
                        pair?.matchLabel ??
                        "",
                }))
                .filter(
                    (pair) =>
                        pair.item &&
                        pair.match
                );
        }

        return [];
    };


    /* ============================================================
       BUILD ANSWER KEY

       Multiple choice:
       Save the actual answer text.

       Matching:
       Save the matching pairs as JSON because the current
       QuestionsContainer keeps those pairs together in the
       `matching_pairs` property.
    ============================================================ */

    const getAnswerKeyValue = (question) => {
        const questionType =
            getQuestionType(question);

        if (
            questionType ===
            "Matching Type"
        ) {
            const matchingPairs =
                getMatchingPairs(question);

            if (matchingPairs.length > 0) {
                return JSON.stringify(
                    matchingPairs
                );
            }
        }


        const options =
            getQuestionOptions(question);

        const correctAnswer =
            getCorrectAnswer(question);


        if (
            correctAnswer === null ||
            correctAnswer === undefined
        ) {
            return null;
        }


        if (
            typeof correctAnswer === "string" &&
            correctAnswer.trim()
        ) {
            const normalized =
                correctAnswer
                    .trim()
                    .toLowerCase();


            /*
             * A/B/C/D
             */

            if (
                normalized.length === 1 &&
                normalized >= "a" &&
                normalized <= "z"
            ) {
                const optionIndex =
                    normalized.charCodeAt(0) -
                    97;

                if (
                    options[optionIndex]
                ) {
                    return getOptionText(
                        options[optionIndex]
                    );
                }
            }


            /*
             * Actual option text.
             */

            const matchingOption =
                options.find(
                    (option) =>
                        getOptionText(
                            option
                        ).toLowerCase() ===
                        normalized
                );


            if (matchingOption) {
                return getOptionText(
                    matchingOption
                );
            }
        }


        /*
         * Numeric option index.
         */

        if (
            typeof correctAnswer ===
            "number" &&
            options[correctAnswer]
        ) {
            return getOptionText(
                options[correctAnswer]
            );
        }


        return String(
            correctAnswer
        ).trim();
    };


    /* ============================================================
       SAVE ASSESSMENT
    ============================================================ */

    const saveAssessment = async () => {
        setErrorMessage("");
        setSuccessMessage("");


        const validationError =
            validateAssessment();


        if (validationError) {
            setErrorMessage(
                validationError
            );

            return;
        }


        const questions =
            Array.isArray(
                assessmentData.questions
            )
                ? assessmentData.questions
                : [];


        setSaving(true);


        let assessmentId = null;


        try {
            /* ========================================================
               1. CREATE ASSESSMENT
            ======================================================== */

            const assessmentPayload = {
                course_id:
                    assessmentData.courseId,

                title:
                    assessmentData.title.trim(),

                set_type:
                    assessmentData.setType ||
                    "Set A",

                total_items:
                    questions.length,

                time_limit_minutes:
                    Number(
                        assessmentData.timeLimit
                    ) || 30,

                /*
                 * SAVE = ACTIVE
                 *
                 * An assessment only exists in the database after
                 * the administrator clicks Save Assessment.
                 *
                 * Therefore, a successfully saved assessment is Active.
                 *
                 * An unsaved assessment does not get inserted into
                 * the assessments table, so it remains Draft only
                 * while being edited and cannot appear in Course Assessment.
                 */
                is_active: true,

                status: "Active",
            };

            const {
                data: assessment,
                error: assessmentError,
            } = await supabase
                .from("assessments")
                .insert(
                    assessmentPayload
                )
                .select()
                .single();


            if (assessmentError) {
                throw assessmentError;
            }


            if (!assessment?.id) {
                throw new Error(
                    "Assessment was created but no assessment ID was returned."
                );
            }


            assessmentId =
                assessment.id;


            /* ========================================================
               2. CREATE QUESTIONS
            ======================================================== */

            for (
                let index = 0;
                index < questions.length;
                index++
            ) {
                const question =
                    questions[index];


                const questionText =
                    getQuestionText(
                        question
                    );


                if (!questionText) {
                    throw new Error(
                        `Question ${index + 1} does not have any question text.`
                    );
                }


                const questionType =
                    getQuestionType(
                        question
                    );


                const questionPayload = {
                    assessment_id:
                        assessmentId,

                    question_text:
                        questionText,

                    question_type:
                        questionType,

                    test_section:
                        questionType,

                    item_number:
                        index + 1,
                };



                const {
                    data: createdQuestion,
                    error: questionError,
                } = await supabase
                    .from("questions")
                    .insert(
                        questionPayload
                    )
                    .select()
                    .single();


                if (questionError) {
                    throw questionError;
                }


                if (!createdQuestion?.id) {
                    throw new Error(
                        `Question ${index + 1} was created but no question ID was returned.`
                    );
                }


                const questionId =
                    createdQuestion.id;


                /* ====================================================
                   3. CREATE QUESTION OPTIONS
                ==================================================== */

                const options =
                    getQuestionOptions(
                        question
                    );


                if (
                    options.length > 0
                ) {
                    const optionPayload =
                        options
                            .map(
                                (
                                    option,
                                    optionIndex
                                ) => ({
                                    question_id:
                                        questionId,

                                    option_text:
                                        getOptionText(
                                            option
                                        ),

                                    option_letter:
                                        String.fromCharCode(
                                            65 +
                                            optionIndex
                                        ),
                                })
                            )
                            .filter(
                                (
                                    option
                                ) =>
                                    option.option_text
                            );


                    if (
                        optionPayload.length >
                        0
                    ) {
                        const {
                            error:
                            optionsError,
                        } = await supabase
                            .from(
                                "question_options"
                            )
                            .insert(
                                optionPayload
                            );


                        if (
                            optionsError
                        ) {
                            throw optionsError;
                        }
                    }
                }


                /* ====================================================
                   4. CREATE ANSWER KEY
                ==================================================== */

                const answerKeyValue =
                    getAnswerKeyValue(
                        question
                    );


                if (
                    answerKeyValue !==
                    null &&
                    answerKeyValue !==
                    undefined &&
                    String(
                        answerKeyValue
                    ).trim()
                ) {
                    const {
                        error:
                        answerKeyError,
                    } = await supabase
                        .from(
                            "answer_keys"
                        )
                        .insert({
                            question_id:
                                questionId,

                            correct_answer:
                                answerKeyValue,
                        });


                    if (
                        answerKeyError
                    ) {
                        throw answerKeyError;
                    }
                }
            }


            /* ========================================================
               5. SUCCESS
            ======================================================== */

            setSuccessMessage(
                "Assessment created successfully."
            );


            navigate(
                "/admin/assessments",
                {
                    replace: true,
                }
            );

        } catch (error) {
            console.error(
                "Error saving assessment:",
                error
            );


            /* ========================================================
               CLEANUP
            ======================================================== */

            if (assessmentId) {
                try {
                    await supabase
                        .from("assessments")
                        .delete()
                        .eq(
                            "id",
                            assessmentId
                        );
                } catch (
                cleanupError
                ) {
                    console.error(
                        "Assessment cleanup failed:",
                        cleanupError
                    );
                }
            }


            setErrorMessage(
                error?.message ||
                "Unable to create assessment."
            );

        } finally {
            setSaving(false);
        }
    };


    /* ============================================================
       CANCEL
    ============================================================ */

    const handleCancel = () => {
        if (saving) {
            return;
        }

        navigate(
            "/admin/assessments"
        );
    };


    /* ============================================================
       RENDER
    ============================================================ */

    return (
        <div className="space-y-6">

            {/* ========================================================
               HEADER
            ======================================================== */}

            <div>
                <nav className="mt-1 mb-3 flex items-center gap-2 text-sm font-semibold">
                    <button
                        type="button"
                        onClick={() =>
                            navigate("/admin/assessments")
                        }
                        className="text-gray-500 hover:text-[#002f86] hover:underline"
                    >
                        Assessment Management
                    </button>

                    <span className="text-gray-400">
                        &gt;
                    </span>

                    <span className="text-[#002f86]">
                        Create Assessment
                    </span>
                </nav>


                <h1 className="text-3xl font-bold text-gray-900">
                    Create Assessment
                </h1>


                <p className="mt-1 text-sm text-gray-500">
                    Create a written assessment and add questions for trainees.
                </p>

            </div>


            {/* ========================================================
               ERROR
            ======================================================== */}

            {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {errorMessage}
                </div>
            )}


            {/* ========================================================
               SUCCESS
            ======================================================== */}

            {successMessage && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    {successMessage}
                </div>
            )}


            {/* ========================================================
               ASSESSMENT BASIC INFORMATION
            ======================================================== */}

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                <div className="mb-6">

                    <h2 className="text-xl font-semibold text-gray-900">
                        Assessment Information
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Enter the basic information for this assessment.
                    </p>

                </div>


                <div className="grid grid-cols-1 gap-6 md:grid-cols-6">

                    {/* ==================================================
       COURSE
       Row 1 — spans 3 columns
    ================================================== */}

                    <div className="md:col-span-3">

                        <label
                            htmlFor="course"
                            className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                            Course
                        </label>

                        <select
                            id="course"
                            value={
                                assessmentData.courseId
                            }
                            onChange={
                                handleCourseChange
                            }
                            disabled={
                                loadingCourses ||
                                saving
                            }
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-[#002f86]/10 disabled:bg-gray-100"
                        >

                            <option value="">
                                {loadingCourses
                                    ? "Loading courses..."
                                    : "Select a course"}
                            </option>

                            {courses.map(
                                (course) => (
                                    <option
                                        key={
                                            course.id
                                        }
                                        value={
                                            course.id
                                        }
                                    >
                                        {course.code
                                            ? `${course.code} — ${course.title}`
                                            : course.title}
                                    </option>
                                )
                            )}

                        </select>

                    </div>


                    {/* ==================================================
       ASSESSMENT TITLE
       Row 1 — spans 3 columns
    ================================================== */}

                    <div className="md:col-span-3">

                        <label
                            htmlFor="assessment-title"
                            className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                            Assessment Title
                        </label>

                        <input
                            id="assessment-title"
                            type="text"
                            value={
                                assessmentData.title
                            }
                            onChange={(event) =>
                                setAssessmentData(
                                    (current) => ({
                                        ...current,
                                        title:
                                            event.target.value,
                                    })
                                )
                            }
                            disabled={saving}
                            placeholder="Enter assessment title"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-[#002f86]/10 disabled:bg-gray-100"
                        />

                    </div>


                    {/* ==================================================
       QUALIFICATION
       Row 2 — spans 2 columns
    ================================================== */}

                    <div className="md:col-span-2">

                        <label
                            htmlFor="qualification"
                            className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                            Qualification
                        </label>

                        <input
                            id="qualification"
                            type="text"
                            value={
                                assessmentData.qualification
                            }
                            readOnly
                            placeholder="Select a course first"
                            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none"
                        />

                    </div>


                    {/* ==================================================
       ASSESSMENT SET
       Row 2 — spans 2 columns
    ================================================== */}

                    <div className="md:col-span-2">

                        <label
                            htmlFor="set-type"
                            className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                            Assessment Set
                        </label>

                        <select
                            id="set-type"
                            value={
                                assessmentData.setType
                            }
                            onChange={(event) =>
                                setAssessmentData(
                                    (current) => ({
                                        ...current,
                                        setType:
                                            event.target.value,
                                    })
                                )
                            }
                            disabled={saving}
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-[#002f86]/10 disabled:bg-gray-100"
                        >

                            <option value="Set A">
                                Set A
                            </option>

                            <option value="Set B">
                                Set B
                            </option>

                            <option value="Set C">
                                Set C
                            </option>

                        </select>

                    </div>


                    {/* ==================================================
       TIME LIMIT
       Row 2 — spans 2 columns
    ================================================== */}

                    <div className="md:col-span-2">

                        <label
                            htmlFor="time-limit"
                            className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                            Time Limit
                        </label>

                        <div className="relative">

                            <input
                                id="time-limit"
                                type="number"
                                min="1"
                                value={
                                    assessmentData.timeLimit
                                }
                                onChange={(event) =>
                                    setAssessmentData(
                                        (current) => ({
                                            ...current,
                                            timeLimit:
                                                event.target.value,
                                        })
                                    )
                                }
                                disabled={saving}
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-20 text-sm outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-[#002f86]/10 disabled:bg-gray-100"
                            />

                            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                                minutes
                            </span>

                        </div>

                    </div>

                </div>
            </section>


            {/* ========================================================
               QUESTIONS

               Reuses the existing QuestionsContainer from:

               components/admin/assessment-details/QuestionsContainer.jsx
            ======================================================== */}

            <QuestionsContainer
                questions={
                    assessmentData.questions
                }

                openSections={
                    openSections
                }

                toggleSection={
                    toggleSection
                }

                onSaveQuestion={
                    handleSaveQuestion
                }

                saving={
                    saving
                }
            />


            {/* ========================================================
               ACTIONS
            ======================================================== */}

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">

                <button
                    type="button"
                    onClick={
                        handleCancel
                    }
                    disabled={saving}
                    className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Cancel
                </button>


                <button
                    type="button"
                    onClick={
                        saveAssessment
                    }
                    disabled={
                        saving ||
                        loadingCourses
                    }
                    className="rounded-xl bg-[#002f86] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#00246b] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving
                        ? "Saving Assessment..."
                        : "Save Assessment"}
                </button>

            </div>

        </div>
    );
}