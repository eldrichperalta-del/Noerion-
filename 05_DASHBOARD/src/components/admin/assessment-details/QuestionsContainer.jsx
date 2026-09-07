import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Plus, X, Trash2 } from "lucide-react";

/* ============================================================
   HELPERS
   ============================================================ */

function createEmptyPair(index = 0) {
    return {
        item: "",
        match: "",
        itemLabel: `Item ${index + 1}`,
        matchLabel: `Match ${index + 1}`,
    };
}

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
            item: pair?.item || "",
            match: pair?.match || "",
            itemLabel:
                pair?.itemLabel || `Item ${index + 1}`,
            matchLabel:
                pair?.matchLabel || `Match ${index + 1}`,
        }));
    } catch {
        return [];
    }
}

/* ============================================================
   NORMALIZE QUESTION TYPE
   ============================================================ */

function normalizeQuestionType(value) {
    const type = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/-/g, " ");

    if (
        type === "multiple choice" ||
        type === "multiplechoice"
    ) {
        return "Multiple Choice";
    }

    if (
        type === "true false" ||
        type === "true/false" ||
        type === "truefalse"
    ) {
        return "True/False";
    }

    if (
        type === "matching" ||
        type === "matching type"
    ) {
        return "Matching Type";
    }

    if (type === "identification") {
        return "Identification";
    }

    if (type === "situational") {
        return "Situational";
    }

    return "Multiple Choice";
}

/* ============================================================
   EMPTY FORM
   ============================================================ */

function createEmptyForm() {
    return {
        question_text: "",
        test_section: "Multiple Choice",
        points: 1,
        correct_answer: "",
        choices: ["", "", "", ""],
        matching_pairs: [
            createEmptyPair(0),
            createEmptyPair(1),
        ],
    };
}

/* ============================================================
   QUESTION MODAL
   ============================================================ */

function QuestionModal({
    modal,
    onClose,
    onSave,
    saving = false,
}) {
    const [form, setForm] =
        useState(createEmptyForm());

    const [validationError, setValidationError] =
        useState("");

    const isEditMode =
        Boolean(modal?.question);

    /* ==========================================================
       LOAD FORM
       ========================================================== */

    useEffect(() => {
        setValidationError("");

        if (!modal) {
            return;
        }

        /* --------------------------------------------------------
           ADD MODE
           -------------------------------------------------------- */

        if (!modal.question) {
            setForm(createEmptyForm());
            return;
        }

        /* --------------------------------------------------------
           EDIT MODE
           -------------------------------------------------------- */

        const question =
            modal.question;

        const questionType =
            normalizeQuestionType(
                question.test_section ||
                question.question_type
            );

        /* --------------------------------------------------------
           LOAD CHOICES
           -------------------------------------------------------- */

        let loadedChoices = [];

        if (
            Array.isArray(question.choices)
        ) {
            loadedChoices =
                question.choices.map(
                    (choice) => {
                        if (
                            typeof choice ===
                            "string"
                        ) {
                            return choice;
                        }

                        return (
                            choice?.option_text ??
                            choice?.text ??
                            choice?.option ??
                            choice?.value ??
                            ""
                        );
                    }
                );
        }

        if (
            loadedChoices.length === 0 &&
            Array.isArray(
                question.options
            )
        ) {
            loadedChoices =
                question.options.map(
                    (choice) => {
                        if (
                            typeof choice ===
                            "string"
                        ) {
                            return choice;
                        }

                        return (
                            choice?.option_text ??
                            choice?.text ??
                            choice?.option ??
                            choice?.value ??
                            ""
                        );
                    }
                );
        }

        if (
            questionType ===
            "Multiple Choice" &&
            loadedChoices.length < 2
        ) {
            loadedChoices = [
                ...loadedChoices,
                ...Array(
                    2 - loadedChoices.length
                ).fill(""),
            ];
        }

        if (
            questionType !==
            "Multiple Choice" &&
            loadedChoices.length === 0
        ) {
            loadedChoices = [
                "",
                "",
            ];
        }

        /* --------------------------------------------------------
           LOAD MATCHING PAIRS
           -------------------------------------------------------- */

        let loadedPairs =
            Array.isArray(
                question.matching_pairs
            )
                ? question.matching_pairs
                : [];

        if (
            loadedPairs.length === 0
        ) {
            loadedPairs =
                parseMatchingPairs(
                    question.correct_answer
                );
        }

        if (
            questionType ===
            "Matching Type"
        ) {
            if (
                loadedPairs.length === 0
            ) {
                loadedPairs = [
                    createEmptyPair(0),
                    createEmptyPair(1),
                ];
            }
        } else {
            loadedPairs = [
                createEmptyPair(0),
                createEmptyPair(1),
            ];
        }

        /* --------------------------------------------------------
           LOAD FORM
           -------------------------------------------------------- */

        setForm({
            question_text:
                question.question_text ||
                "",

            test_section:
                questionType,

            points:
                question.points ===
                    null ||
                    question.points ===
                    undefined ||
                    question.points ===
                    ""
                    ? 1
                    : Number(
                        question.points
                    ) || 1,

            correct_answer:
                question.correct_answer ||
                "",

            choices:
                loadedChoices.length > 0
                    ? loadedChoices
                    : ["", "", "", ""],

            matching_pairs:
                loadedPairs.map(
                    (pair, index) => ({
                        item:
                            pair?.item || "",

                        match:
                            pair?.match || "",

                        itemLabel:
                            pair?.itemLabel ||
                            `Item ${index + 1
                            }`,

                        matchLabel:
                            pair?.matchLabel ||
                            `Match ${index + 1
                            }`,
                    })
                ),
        });
    }, [modal]);

    if (!modal) {
        return null;
    }

    /* ==========================================================
       FIELD UPDATE
       ========================================================== */

    const updateField = (
        field,
        value
    ) => {
        setValidationError("");

        setForm(
            (previous) => ({
                ...previous,
                [field]: value,
            })
        );
    };

    /* ==========================================================
       CHANGE QUESTION TYPE
       ADD MODE ONLY
       ========================================================== */

    const handleSectionChange = (
        value
    ) => {
        const normalized =
            normalizeQuestionType(
                value
            );

        setValidationError("");

        setForm(
            (previous) => ({
                ...previous,

                test_section:
                    normalized,

                correct_answer:
                    "",

                matching_pairs:
                    normalized ===
                        "Matching Type"
                        ? previous
                            .matching_pairs
                            ?.length > 0
                            ? previous.matching_pairs
                            : [
                                createEmptyPair(
                                    0
                                ),
                                createEmptyPair(
                                    1
                                ),
                            ]
                        : previous.matching_pairs,
            })
        );
    };

    /* ==========================================================
       MULTIPLE CHOICE
       ========================================================== */

    const updateChoice = (
        index,
        value
    ) => {
        setValidationError("");

        setForm(
            (previous) => {
                const choices = [
                    ...(previous.choices ||
                        []),
                ];

                const oldValue =
                    choices[index];

                choices[index] =
                    value;

                let correctAnswer =
                    previous.correct_answer;

                if (
                    correctAnswer ===
                    oldValue
                ) {
                    correctAnswer =
                        value;
                }

                return {
                    ...previous,
                    choices,
                    correct_answer:
                        correctAnswer,
                };
            }
        );
    };

    const addChoice = () => {
        setForm(
            (previous) => ({
                ...previous,

                choices: [
                    ...(previous.choices ||
                        []),
                    "",
                ],
            })
        );
    };

    const removeChoice = (
        index
    ) => {
        setForm(
            (previous) => {
                const removedChoice =
                    previous.choices[
                    index
                    ];

                const choices =
                    previous.choices.filter(
                        (
                            _,
                            choiceIndex
                        ) =>
                            choiceIndex !==
                            index
                    );

                let correctAnswer =
                    previous.correct_answer;

                if (
                    correctAnswer ===
                    removedChoice
                ) {
                    correctAnswer = "";
                }

                return {
                    ...previous,

                    choices,

                    correct_answer:
                        correctAnswer,
                };
            }
        );
    };

    /* ==========================================================
       MATCHING
       ========================================================== */

    const updateMatchingPair = (
        index,
        field,
        value
    ) => {
        setValidationError("");

        setForm(
            (previous) => {
                const matching_pairs =
                    [
                        ...(previous.matching_pairs ||
                            []),
                    ];

                matching_pairs[index] =
                {
                    ...matching_pairs[
                    index
                    ],
                    [field]: value,
                };

                return {
                    ...previous,
                    matching_pairs,
                };
            }
        );
    };

    const addMatchingPair = () => {
        setForm(
            (previous) => ({
                ...previous,

                matching_pairs: [
                    ...(previous.matching_pairs ||
                        []),
                    createEmptyPair(
                        previous
                            .matching_pairs
                            ?.length || 0
                    ),
                ],
            })
        );
    };

    const removeMatchingPair = (
        index
    ) => {
        setForm(
            (previous) => {
                const remaining =
                    (
                        previous.matching_pairs ||
                        []
                    ).filter(
                        (
                            _,
                            pairIndex
                        ) =>
                            pairIndex !==
                            index
                    );

                const normalizedPairs =
                    remaining.length > 0
                        ? remaining.map(
                            (
                                pair,
                                pairIndex
                            ) => ({
                                ...pair,

                                itemLabel:
                                    `Item ${pairIndex +
                                    1
                                    }`,

                                matchLabel:
                                    `Match ${pairIndex +
                                    1
                                    }`,
                            })
                        )
                        : [
                            createEmptyPair(
                                0
                            ),
                        ];

                return {
                    ...previous,
                    matching_pairs:
                        normalizedPairs,
                };
            }
        );
    };

    /* ==========================================================
       VALIDATION
       ========================================================== */

    const validateForm = () => {
        const type =
            normalizeQuestionType(
                form.test_section
            );

        if (
            !String(
                form.question_text ||
                ""
            ).trim()
        ) {
            return "Please enter the question.";
        }

        if (
            !Number(form.points) ||
            Number(form.points) < 1
        ) {
            return "Points must be at least 1.";
        }

        /* --------------------------------------------------------
           MULTIPLE CHOICE
           -------------------------------------------------------- */

        if (
            type ===
            "Multiple Choice"
        ) {
            const validChoices =
                (
                    form.choices ||
                    []
                ).filter(
                    (choice) =>
                        String(
                            choice || ""
                        ).trim()
                );

            if (
                validChoices.length <
                2
            ) {
                return "Please provide at least two choices.";
            }

            if (
                !String(
                    form.correct_answer ||
                    ""
                ).trim()
            ) {
                return "Please select the correct answer.";
            }

            const answerExists =
                validChoices.some(
                    (choice) =>
                        String(
                            choice
                        ).trim() ===
                        String(
                            form.correct_answer
                        ).trim()
                );

            if (!answerExists) {
                return "The correct answer must match one of the choices.";
            }
        }

        /* --------------------------------------------------------
           TRUE / FALSE
           -------------------------------------------------------- */

        if (
            type ===
            "True/False"
        ) {
            const answer =
                String(
                    form.correct_answer ||
                    ""
                ).trim();

            if (
                answer !== "True" &&
                answer !== "False"
            ) {
                return "Please select True or False.";
            }
        }

        /* --------------------------------------------------------
           MATCHING
           -------------------------------------------------------- */

        if (
            type ===
            "Matching Type"
        ) {
            const validPairs =
                (
                    form.matching_pairs ||
                    []
                ).filter(
                    (pair) =>
                        String(
                            pair?.item || ""
                        ).trim() &&
                        String(
                            pair?.match || ""
                        ).trim()
                );

            if (
                validPairs.length ===
                0
            ) {
                return "Please provide at least one matching pair.";
            }
        }

        /* --------------------------------------------------------
           IDENTIFICATION
           -------------------------------------------------------- */

        if (
            type ===
            "Identification"
        ) {
            if (
                !String(
                    form.correct_answer ||
                    ""
                ).trim()
            ) {
                return "Please enter the correct answer.";
            }
        }

        /* --------------------------------------------------------
           SITUATIONAL
           -------------------------------------------------------- */

        if (
            type ===
            "Situational"
        ) {
            if (
                !String(
                    form.correct_answer ||
                    ""
                ).trim()
            ) {
                return "Please enter the correct answer.";
            }
        }

        return "";
    };

    /* ==========================================================
       SUBMIT
       ========================================================== */

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();

        setValidationError("");

        const validation =
            validateForm();

        if (validation) {
            setValidationError(
                validation
            );
            return;
        }

        if (
            typeof onSave !==
            "function"
        ) {
            setValidationError(
                "Save handler is not available."
            );
            return;
        }

        const normalizedType =
            normalizeQuestionType(
                form.test_section
            );

        const payload = {
            ...form,

            test_section:
                normalizedType,

            question_id:
                modal.question?.id ||
                null,

            question_text:
                String(
                    form.question_text ||
                    ""
                ).trim(),

            points:
                Number(form.points) ||
                1,

            correct_answer:
                String(
                    form.correct_answer ||
                    ""
                ).trim(),

            choices:
                (
                    form.choices || []
                ).map(
                    (choice) =>
                        String(
                            choice || ""
                        ).trim()
                ),

            matching_pairs:
                (
                    form.matching_pairs ||
                    []
                )
                    .filter(
                        (pair) =>
                            String(
                                pair?.item || ""
                            ).trim() &&
                            String(
                                pair?.match || ""
                            ).trim()
                    )
                    .map(
                        (
                            pair,
                            index
                        ) => ({
                            item:
                                String(
                                    pair.item
                                ).trim(),

                            match:
                                String(
                                    pair.match
                                ).trim(),

                            itemLabel:
                                `Item ${index + 1
                                }`,

                            matchLabel:
                                `Match ${index + 1
                                }`,
                        })
                    ),
        };

        try {
            const result =
                await onSave(
                    payload
                );

            /*
             * AssessmentDetails can return false when saving fails.
             * Otherwise close the modal.
             */

            if (result !== false) {
                onClose();
            }
        } catch (error) {
            console.error(
                "Question save failed:",
                error
            );

            setValidationError(
                error?.message ||
                "Unable to save the question."
            );
        }
    };

    /* ==========================================================
       RENDER MODAL
       ========================================================== */

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !saving
                ) {
                    onClose();
                }
            }}
        >
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">

                {/* ====================================================
            HEADER
        ==================================================== */}

                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            {isEditMode
                                ? "Edit Question"
                                : "Add Question"}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {isEditMode
                                ? "Update the question and its answer details."
                                : "Create a new assessment question."}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>

                </div>

                {/* ====================================================
            FORM
        ==================================================== */}

                <form
                    onSubmit={
                        handleSubmit
                    }
                >

                    <div className="space-y-6 px-6 py-6">

                        {/* ==================================================
                ERROR
            ================================================== */}

                        {validationError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                {validationError}
                            </div>
                        )}

                        {/* ==================================================
                QUESTION TYPE

                ONLY SHOWN FOR ADD.

                COMPLETELY HIDDEN FOR EDIT.
            ================================================== */}

                        {!isEditMode && (
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Question Type
                                </label>

                                <select
                                    value={
                                        form.test_section
                                    }
                                    onChange={(event) =>
                                        handleSectionChange(
                                            event.target
                                                .value
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500"
                                >
                                    <option value="Multiple Choice">
                                        Multiple Choice
                                    </option>

                                    <option value="True/False">
                                        True / False
                                    </option>

                                    <option value="Matching Type">
                                        Matching Type
                                    </option>

                                    <option value="Identification">
                                        Identification
                                    </option>

                                    <option value="Situational">
                                        Situational
                                    </option>
                                </select>
                            </div>
                        )}

                        {/* ==================================================
                QUESTION
            ================================================== */}

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Question
                            </label>

                            <textarea
                                value={
                                    form.question_text
                                }
                                onChange={(event) =>
                                    updateField(
                                        "question_text",
                                        event.target.value
                                    )
                                }
                                rows={4}
                                required
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500"
                                placeholder="Enter the question..."
                            />
                        </div>

                        {/* ==================================================
                MULTIPLE CHOICE
            ================================================== */}

                        {form.test_section ===
                            "Multiple Choice" && (
                                <div className="space-y-6">

                                    <div>

                                        <div className="mb-3 flex items-center justify-between">

                                            <label className="block text-sm font-semibold text-gray-700">
                                                Choices
                                            </label>

                                            <button
                                                type="button"
                                                onClick={
                                                    addChoice
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                            >
                                                <Plus
                                                    size={15}
                                                />

                                                Add Choice
                                            </button>

                                        </div>

                                        <div className="space-y-3">

                                            {(
                                                form.choices ||
                                                []
                                            ).map(
                                                (
                                                    choice,
                                                    index
                                                ) => (
                                                    <div
                                                        key={
                                                            index
                                                        }
                                                        className="flex items-center gap-2"
                                                    >

                                                        <span className="w-7 shrink-0 text-sm font-semibold text-gray-500">
                                                            {String.fromCharCode(
                                                                65 +
                                                                index
                                                            )}
                                                            .
                                                        </span>

                                                        <input
                                                            type="text"
                                                            value={
                                                                choice
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateChoice(
                                                                    index,
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            required
                                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500"
                                                            placeholder={`Choice ${index +
                                                                1
                                                                }`}
                                                        />

                                                        {form
                                                            .choices
                                                            .length >
                                                            2 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeChoice(
                                                                            index
                                                                        )
                                                                    }
                                                                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                                                    title="Remove choice"
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            17
                                                                        }
                                                                    />
                                                                </button>
                                                            )}

                                                    </div>
                                                )
                                            )}

                                        </div>

                                    </div>

                                    <div>

                                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                                            Correct Answer
                                        </label>

                                        <select
                                            value={
                                                form.correct_answer
                                            }
                                            onChange={(event) =>
                                                updateField(
                                                    "correct_answer",
                                                    event.target
                                                        .value
                                                )
                                            }
                                            required
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500"
                                        >

                                            <option value="">
                                                Select correct choice
                                            </option>

                                            {(
                                                form.choices ||
                                                []
                                            ).map(
                                                (
                                                    choice,
                                                    index
                                                ) => (
                                                    <option
                                                        key={
                                                            index
                                                        }
                                                        value={
                                                            choice
                                                        }
                                                        disabled={
                                                            !String(
                                                                choice ||
                                                                ""
                                                            ).trim()
                                                        }
                                                    >
                                                        {String.fromCharCode(
                                                            65 +
                                                            index
                                                        )}
                                                        .{" "}
                                                        {choice ||
                                                            `Choice ${index +
                                                            1
                                                            }`}
                                                    </option>
                                                )
                                            )}

                                        </select>

                                    </div>

                                </div>
                            )}

                        {/* ==================================================
                TRUE / FALSE
            ================================================== */}

                        {form.test_section ===
                            "True/False" && (
                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Correct Answer
                                    </label>

                                    <select
                                        value={
                                            form.correct_answer
                                        }
                                        onChange={(event) =>
                                            updateField(
                                                "correct_answer",
                                                event.target
                                                    .value
                                            )
                                        }
                                        required
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500"
                                    >

                                        <option value="">
                                            Select answer
                                        </option>

                                        <option value="True">
                                            True
                                        </option>

                                        <option value="False">
                                            False
                                        </option>

                                    </select>

                                </div>
                            )}

                        {/* ==================================================
                MATCHING TYPE
            ================================================== */}

                        {form.test_section ===
                            "Matching Type" && (
                                <div className="space-y-5">

                                    <div>

                                        <h3 className="text-sm font-bold text-gray-900">
                                            Matching Pairs
                                        </h3>

                                        <p className="mt-1 text-sm text-gray-500">
                                            Enter each item and its corresponding match.
                                        </p>

                                    </div>

                                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">

                                        <div className="mb-3 grid grid-cols-2 gap-4">

                                            <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                                                Items
                                            </div>

                                            <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                                                Matches
                                            </div>

                                        </div>

                                        <div className="space-y-3">

                                            {(
                                                form.matching_pairs ||
                                                []
                                            ).map(
                                                (
                                                    pair,
                                                    index
                                                ) => (
                                                    <div
                                                        key={
                                                            index
                                                        }
                                                        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                                                    >

                                                        <div className="flex items-center gap-2">

                                                            <span className="w-16 shrink-0 text-sm font-semibold text-gray-500">
                                                                Item{" "}
                                                                {index +
                                                                    1}
                                                            </span>

                                                            <input
                                                                type="text"
                                                                value={
                                                                    pair.item
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    updateMatchingPair(
                                                                        index,
                                                                        "item",
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                required
                                                                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                                                                placeholder="Enter item"
                                                            />

                                                        </div>

                                                        <div className="flex items-center gap-2">

                                                            <span className="w-16 shrink-0 text-sm font-semibold text-gray-500">
                                                                Match{" "}
                                                                {index +
                                                                    1}
                                                            </span>

                                                            <input
                                                                type="text"
                                                                value={
                                                                    pair.match
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    updateMatchingPair(
                                                                        index,
                                                                        "match",
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                required
                                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500"
                                                                placeholder="Enter match"
                                                            />

                                                            {form
                                                                .matching_pairs
                                                                .length >
                                                                1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removeMatchingPair(
                                                                                index
                                                                            )
                                                                        }
                                                                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                                                        title="Remove pair"
                                                                    >
                                                                        <Trash2
                                                                            size={
                                                                                17
                                                                            }
                                                                        />
                                                                    </button>
                                                                )}

                                                        </div>

                                                    </div>
                                                )
                                            )}

                                        </div>

                                        <button
                                            type="button"
                                            onClick={
                                                addMatchingPair
                                            }
                                            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                        >
                                            <Plus
                                                size={16}
                                            />

                                            Add Pair
                                        </button>

                                    </div>

                                </div>
                            )}

                        {/* ==================================================
                IDENTIFICATION
            ================================================== */}

                        {form.test_section ===
                            "Identification" && (
                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Correct Answer
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            form.correct_answer
                                        }
                                        onChange={(event) =>
                                            updateField(
                                                "correct_answer",
                                                event.target.value
                                            )
                                        }
                                        required
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500"
                                        placeholder="Enter the correct answer..."
                                    />

                                </div>
                            )}

                        {/* ==================================================
                SITUATIONAL
            ================================================== */}

                        {form.test_section ===
                            "Situational" && (
                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Correct Answer
                                    </label>

                                    <textarea
                                        value={
                                            form.correct_answer
                                        }
                                        onChange={(event) =>
                                            updateField(
                                                "correct_answer",
                                                event.target.value
                                            )
                                        }
                                        rows={5}
                                        required
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500"
                                        placeholder="Enter the expected answer..."
                                    />

                                </div>
                            )}

                        {/* ==================================================
                POINTS
            ================================================== */}

                        <div>

                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Points
                            </label>

                            <input
                                type="number"
                                min="1"
                                value={
                                    form.points
                                }
                                onChange={(event) =>
                                    updateField(
                                        "points",
                                        Number(
                                            event.target.value
                                        )
                                    )
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500"
                            />

                        </div>

                    </div>

                    {/* ==================================================
              FOOTER
          ================================================== */}

                    <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">

                        <button
                            type="button"
                            onClick={
                                onClose
                            }
                            disabled={
                                saving
                            }
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                saving
                            }
                            className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving
                                ? "Saving..."
                                : isEditMode
                                    ? "Save Changes"
                                    : "Add Question"}
                        </button>

                    </div>

                </form>

            </div>
        </div>,
        document.body
    );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function QuestionsContainer({
    questions = [],
    groupedQuestions = {},
    openSections = {},
    toggleSection,
    onSaveQuestion,
    saving = false,
}) {
    const [modal, setModal] =
        useState(null);

    /* ==========================================================
       OPEN ADD
       ========================================================== */

    const handleAdd = () => {
        setModal({
            question: null,
        });
    };

    /* ==========================================================
       OPEN EDIT
  
       THIS IS THE IMPORTANT FIX.
  
       The previous version depended on onEditQuestion from
       AssessmentDetails.jsx, but AssessmentDetails never passed it.
  
       Now the component opens the modal directly.
       ========================================================== */

    const handleEdit = (
        question
    ) => {
        if (!question?.id) {
            console.error(
                "Cannot edit question: question ID is missing.",
                question
            );
            return;
        }

        setModal({
            question: {
                ...question,

                test_section:
                    normalizeQuestionType(
                        question.test_section ||
                        question.question_type
                    ),
            },
        });
    };

    /* ==========================================================
       CLOSE MODAL
       ========================================================== */

    const handleCloseModal = () => {
        if (saving) {
            return;
        }

        setModal(null);
    };

    /* ==========================================================
       SAFE GROUPED QUESTIONS
       ========================================================== */

    const safeGroupedQuestions =
        Object.keys(
            groupedQuestions || {}
        ).length > 0
            ? groupedQuestions
            : questions.reduce(
                (
                    groups,
                    question
                ) => {
                    const section =
                        normalizeQuestionType(
                            question.test_section ||
                            question.question_type
                        );

                    if (
                        !groups[section]
                    ) {
                        groups[section] =
                            [];
                    }

                    groups[section].push(
                        question
                    );

                    return groups;
                },
                {}
            );

    /* ==========================================================
       RENDER
       ========================================================== */

    return (
        <>
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

                {/* ====================================================
            HEADER
        ==================================================== */}

                <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                        <h2 className="text-base font-bold text-gray-900">
                            Questions
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {questions.length} question
                            {questions.length ===
                                1
                                ? ""
                                : "s"} in this assessment.
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={
                            handleAdd
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                        <Plus
                            size={17}
                        />

                        Add Question
                    </button>

                </div>

                {/* ====================================================
            CONTENT
        ==================================================== */}

                <div className="p-6">

                    {questions.length ===
                        0 ? (

                        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">

                            <p className="text-sm font-medium text-gray-500">
                                No questions available.
                            </p>

                        </div>

                    ) : (

                        <div className="space-y-4">

                            {Object.entries(
                                safeGroupedQuestions
                            ).map(
                                ([
                                    section,
                                    sectionQuestions,
                                ]) => {

                                    const isOpen =
                                        openSections[
                                        section
                                        ] === true;

                                    return (
                                        <div
                                            key={
                                                section
                                            }
                                            className="overflow-hidden rounded-xl border border-gray-200"
                                        >

                                            {/* ==========================================
                          SECTION HEADER
                      ========================================== */}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleSection(
                                                        section
                                                    )
                                                }
                                                className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left hover:bg-gray-100"
                                            >

                                                <div>

                                                    <p className="text-sm font-bold text-gray-900">
                                                        {
                                                            section
                                                        }
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-gray-500">
                                                        {
                                                            sectionQuestions.length
                                                        }{" "}
                                                        question
                                                        {sectionQuestions.length ===
                                                            1
                                                            ? ""
                                                            : "s"}
                                                    </p>

                                                </div>

                                                <ChevronDown
                                                    size={
                                                        18
                                                    }
                                                    className={`text-gray-500 transition-transform ${isOpen
                                                        ? "rotate-180"
                                                        : ""
                                                        }`}
                                                />

                                            </button>

                                            {/* ==========================================
                          SECTION CONTENT
                      ========================================== */}

                                            {isOpen && (
                                                <div className="divide-y divide-gray-200">

                                                    {sectionQuestions.map(
                                                        (
                                                            question,
                                                            index
                                                        ) => {

                                                            const type =
                                                                normalizeQuestionType(
                                                                    question.test_section ||
                                                                    question.question_type ||
                                                                    section
                                                                );

                                                            const matchingPairs =
                                                                Array.isArray(
                                                                    question.matching_pairs
                                                                )
                                                                    ? question.matching_pairs
                                                                    : parseMatchingPairs(
                                                                        question.correct_answer
                                                                    );

                                                            return (
                                                                <div
                                                                    key={
                                                                        question.id ||
                                                                        `${section}-${index}`
                                                                    }
                                                                    className="p-5"
                                                                >

                                                                    <div className="flex items-start justify-between gap-4">

                                                                        <div className="min-w-0 flex-1">

                                                                            <div className="mb-2 flex flex-wrap items-center gap-2">

                                                                                <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                                                                    Question{" "}
                                                                                    {question.item_number ??
                                                                                        index +
                                                                                        1}
                                                                                </span>

                                                                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                                                                                    {type}
                                                                                </span>

                                                                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                                                                                    {question.points ??
                                                                                        1}{" "}
                                                                                    pt
                                                                                    {Number(
                                                                                        question.points ??
                                                                                        1
                                                                                    ) ===
                                                                                        1
                                                                                        ? ""
                                                                                        : "s"}
                                                                                </span>

                                                                            </div>

                                                                            <p className="whitespace-pre-wrap text-sm font-semibold leading-6 text-gray-900">
                                                                                {
                                                                                    question.question_text
                                                                                }
                                                                            </p>

                                                                            {/* =================================
                                          MULTIPLE CHOICE DISPLAY
                                      ================================= */}

                                                                            {type ===
                                                                                "Multiple Choice" &&
                                                                                Array.isArray(
                                                                                    question.choices
                                                                                ) &&
                                                                                question.choices.length >
                                                                                0 && (
                                                                                    <div className="mt-4 space-y-2">

                                                                                        {question.choices.map(
                                                                                            (
                                                                                                choice,
                                                                                                choiceIndex
                                                                                            ) => {

                                                                                                const choiceText =
                                                                                                    typeof choice ===
                                                                                                        "string"
                                                                                                        ? choice
                                                                                                        : choice?.option_text ??
                                                                                                        choice?.text ??
                                                                                                        choice?.option ??
                                                                                                        choice?.value ??
                                                                                                        "";

                                                                                                const isCorrect =
                                                                                                    String(
                                                                                                        choiceText
                                                                                                    ).trim() ===
                                                                                                    String(
                                                                                                        question.correct_answer ??
                                                                                                        ""
                                                                                                    ).trim();

                                                                                                return (
                                                                                                    <div
                                                                                                        key={
                                                                                                            choiceIndex
                                                                                                        }
                                                                                                        className={`rounded-lg border px-3 py-2 text-sm ${isCorrect
                                                                                                            ? "border-green-200 bg-green-50 font-semibold text-green-700"
                                                                                                            : "border-gray-200 bg-white text-gray-700"
                                                                                                            }`}
                                                                                                    >

                                                                                                        <span className="mr-2 font-bold text-gray-500">
                                                                                                            {String.fromCharCode(
                                                                                                                65 +
                                                                                                                choiceIndex
                                                                                                            )}
                                                                                                            .
                                                                                                        </span>

                                                                                                        {
                                                                                                            choiceText
                                                                                                        }

                                                                                                        {isCorrect && (
                                                                                                            <span className="ml-2 text-xs font-bold uppercase">
                                                                                                                Correct
                                                                                                            </span>
                                                                                                        )}

                                                                                                    </div>
                                                                                                );
                                                                                            }
                                                                                        )}

                                                                                    </div>
                                                                                )}

                                                                            {/* =================================
                                          TRUE/FALSE DISPLAY
                                      ================================= */}

                                                                            {type ===
                                                                                "True/False" && (
                                                                                    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">

                                                                                        <span className="font-bold text-gray-500">
                                                                                            Correct Answer:
                                                                                        </span>{" "}

                                                                                        {
                                                                                            question.correct_answer ||
                                                                                            "—"
                                                                                        }

                                                                                    </div>
                                                                                )}

                                                                            {/* =================================
                                          IDENTIFICATION / SITUATIONAL
                                      ================================= */}

                                                                            {(
                                                                                type ===
                                                                                "Identification" ||
                                                                                type ===
                                                                                "Situational"
                                                                            ) && (
                                                                                    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">

                                                                                        <span className="font-bold text-gray-500">
                                                                                            Correct Answer:
                                                                                        </span>{" "}

                                                                                        {
                                                                                            question.correct_answer ||
                                                                                            "—"
                                                                                        }

                                                                                    </div>
                                                                                )}

                                                                            {/* =================================
                                          MATCHING DISPLAY
                                      ================================= */}

                                                                            {type ===
                                                                                "Matching Type" &&
                                                                                matchingPairs.length >
                                                                                0 && (
                                                                                    <div className="mt-4 space-y-2">

                                                                                        {matchingPairs.map(
                                                                                            (
                                                                                                pair,
                                                                                                pairIndex
                                                                                            ) => (
                                                                                                <div
                                                                                                    key={
                                                                                                        pairIndex
                                                                                                    }
                                                                                                    className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                                                                                                >

                                                                                                    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">

                                                                                                        <span className="mr-2 font-bold text-gray-500">
                                                                                                            Item{" "}
                                                                                                            {pairIndex +
                                                                                                                1}
                                                                                                            :
                                                                                                        </span>

                                                                                                        {
                                                                                                            pair.item
                                                                                                        }

                                                                                                    </div>

                                                                                                    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">

                                                                                                        <span className="mr-2 font-bold text-gray-500">
                                                                                                            Match{" "}
                                                                                                            {pairIndex +
                                                                                                                1}
                                                                                                            :
                                                                                                        </span>

                                                                                                        {
                                                                                                            pair.match
                                                                                                        }

                                                                                                    </div>

                                                                                                </div>
                                                                                            )
                                                                                        )}

                                                                                    </div>
                                                                                )}

                                                                        </div>

                                                                        {/* =================================
                                        EDIT BUTTON
                                    ================================= */}

                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleEdit(
                                                                                    question
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                saving ||
                                                                                !question?.id
                                                                            }
                                                                            className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                                        >
                                                                            Edit
                                                                        </button>

                                                                    </div>

                                                                </div>
                                                            );
                                                        }
                                                    )}

                                                </div>
                                            )}

                                        </div>
                                    );
                                }
                            )}

                        </div>

                    )}

                </div>

            </div>

            {/* ======================================================
          MODAL
      ====================================================== */}

            <QuestionModal
                modal={
                    modal
                }
                onClose={
                    handleCloseModal
                }
                onSave={
                    onSaveQuestion
                }
                saving={
                    saving
                }
            />
        </>
    );
}