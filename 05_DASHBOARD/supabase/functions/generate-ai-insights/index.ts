import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ------------------------------------------------------------
    // 1. Read submission payload
    // ------------------------------------------------------------
    const payload = await req.json();
    const record = payload.record || payload;

    const submissionId =
      record.submission_id ||
      record.submissionId ||
      record.id;

    const traineeId =
      record.trainee_id ||
      record.traineeId ||
      record.trainee_uid ||
      null;

    if (!submissionId) {
      throw new Error("Missing submission ID in payload.");
    }

    // ------------------------------------------------------------
    // 2. Initialize Supabase Admin Client
    // ------------------------------------------------------------
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured."
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    // ------------------------------------------------------------
    // 3. Fetch CURRENT Ground Truth
    //
    // IMPORTANT:
    // The Edge Function does NOT calculate:
    // - question timing
    // - cumulative question timeline
    // - EEG alignment
    // - cognitive load
    // - friction
    //
    // The SQL Ground Truth is the deterministic source of truth.
    // ------------------------------------------------------------
    const {
      data: groundTruth,
      error: groundTruthError,
    } = await supabaseAdmin.rpc(
      "get_submission_ground_truth",
      {
        p_submission_id: submissionId,
      }
    );

    if (groundTruthError) {
      throw new Error(
        `Ground Truth RPC Error: ${groundTruthError.message}`
      );
    }

    if (!groundTruth) {
      throw new Error(
        "Ground Truth returned no data for this submission."
      );
    }

    // ------------------------------------------------------------
    // 4. Normalize Ground Truth and determine EEG availability
    // ------------------------------------------------------------
    const normalizedGroundTruth =
      Array.isArray(groundTruth)
        ? (
            groundTruth[0]?.get_submission_ground_truth ??
            groundTruth[0]
          )
        : (
            groundTruth?.get_submission_ground_truth ??
            groundTruth
          );

    if (!normalizedGroundTruth?.success) {
      throw new Error(
        "Ground Truth returned an unsuccessful result for this submission."
      );
    }

    const activeSegments = Number(
      normalizedGroundTruth?.eeg_analysis?.active_reading
        ?.total_active_segments ?? 0
    );

    const hasEegData =
      normalizedGroundTruth?.eeg_analysis?.has_eeg_data === true &&
      activeSegments > 0;

    // ------------------------------------------------------------
    // 5. Deterministic evidence confidence
    // ------------------------------------------------------------
    // This value belongs to NOERION, not the model. The model must
    // never generate or calculate confidence_score.
    const submissionEvidence =
      normalizedGroundTruth?.submission ? 100 : 0;

    const baselineEvidence =
      normalizedGroundTruth?.eeg_analysis?.baseline_reference
        ? 100
        : 0;

    const activeEEGEvidence = hasEegData ? 100 : 0;

    const questionCount = Number(
      normalizedGroundTruth?.correlation_ready?.question_count ?? 0
    );

    const questionsAnalysis = Array.isArray(
      normalizedGroundTruth?.questions_analysis
    )
      ? normalizedGroundTruth.questions_analysis
      : [];

    const questionsWithEvents = questionsAnalysis.filter(
      (question) => Number(question?.event_count ?? 0) > 0
    ).length;

    const questionsWithEEG = questionsAnalysis.filter(
      (question) =>
        question?.eeg_data_available === true &&
        Number(question?.eeg_segment_count ?? 0) > 0
    ).length;

    const eventCoverage =
      questionCount > 0
        ? Math.min(
            100,
            (questionsWithEvents / questionCount) * 100
          )
        : 0;

    const eegCoverage =
      questionCount > 0
        ? Math.min(
            100,
            (questionsWithEEG / questionCount) * 100
          )
        : 0;

    const confidenceScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (
            submissionEvidence +
            baselineEvidence +
            activeEEGEvidence +
            eventCoverage +
            eegCoverage
          ) / 5
        )
      )
    );

    console.log("=== DETERMINISTIC EVIDENCE CONFIDENCE ===");
    console.log("submissionEvidence:", submissionEvidence);
    console.log("baselineEvidence:", baselineEvidence);
    console.log("activeEEGEvidence:", activeEEGEvidence);
    console.log("questionCount:", questionCount);
    console.log("questionsWithEvents:", questionsWithEvents);
    console.log("questionsWithEEG:", questionsWithEEG);
    console.log("eventCoverage:", eventCoverage);
    console.log("eegCoverage:", eegCoverage);
    console.log("FINAL confidenceScore:", confidenceScore);

    // ------------------------------------------------------------
    // 6. OpenAI system prompt
    // ------------------------------------------------------------
    // [OPENAI PROMPT UPDATE]
    // Version 6 keeps ai_cognitive_insights because the Evaluation
    // Summary page still uses it. It is separate from the Assessor
    // Performance Patterns section.
    // The assessor Performance Patterns section uses only
    // assessor_strengths and assessor_areas_for_improvement.
    // Technical EEG values remain hidden from final user-facing text.
    // ------------------------------------------------------------
    const systemPrompt = `
You are the NOERION assessment analysis assistant.

Your task is to interpret the provided deterministic Ground Truth and
produce useful assessment information for BOTH the assessor and trainee.

============================================================
CORE PURPOSE
============================================================

NOERION combines:
- answer correctness
- response time
- question difficulty
- cognitive level
- question-level EEG-supported information

You MUST consider these sources together.

Do not discard EEG information.
Do not analyze EEG by itself.
Do not analyze time by itself.
Do not analyze correctness by itself.

The reasoning happens internally first.
The final wording must translate that reasoning into simple,
natural assessment language.

============================================================
GROUND TRUTH
============================================================

The provided Ground Truth is the deterministic source of truth.

DO NOT recalculate or modify:
- scores
- passing result
- competency result
- question timing
- question start/end times
- EEG timestamps
- EEG/question matching
- attention
- engagement
- cognitive load
- baseline values
- percentage changes
- confidence_score

Use the supplied values exactly as provided.

============================================================
MULTIMODAL REASONING
============================================================

For relevant questions, consider together:
1. correctness
2. response time
3. difficulty
4. cognitive level
5. whether question-level EEG information is available
6. whether Ground Truth provides an established EEG-supported pattern

Response time MUST NOT become the primary determinant of difficulty.
Time is meaningful only when considered with correctness, difficulty,
and available EEG-supported evidence.

The AI must NOT independently calculate, invent, or classify an EEG
change from raw or unsupported values. Only use EEG-supported patterns
provided by Ground Truth.

============================================================
EEG INTERPRETATION
============================================================

EEG is supporting evidence, not proof of:
- confusion
- stress
- anxiety
- overload
- intelligence
- ability
- competence
- mastery

Never claim that EEG caused an incorrect answer.

A higher recorded EEG-related value does not automatically mean poor
performance.

A lower recorded EEG-related value does not automatically mean mastery.

When a difficult question has EEG-supported changes and the trainee
still answers correctly, treat that as successful performance.

When longer response time, an EEG-supported pattern, and an incorrect
answer occur together, it MAY be a useful area for follow-up review.

Use cautious wording such as:
- "may indicate"
- "may suggest"
- "may be useful for review"
- "required more time"

Do not call any pattern the "strongest" pattern.

============================================================
TECHNICAL EEG LANGUAGE
============================================================

Assessor output may say:
- "EEG information"
- "recorded EEG patterns"
- "changes in the available EEG information"

Do NOT expose:
- cognitive load values
- attention values
- engagement values
- baseline values
- EEG segment counts
- EEG ratios
- beta/alpha values
- percentage changes
- raw EEG numbers

Never write:
"Q31 cognitive load = 7.08"

Never write:
"112% above baseline"

Never write:
"high cognitive load caused the error"

============================================================
MISSING EEG DATA
============================================================

Missing EEG data is not the trainee's mistake.

Do not blame the trainee for missing recording information.

If question-level EEG information is unavailable, rely on the other
available assessment evidence.

Do not invent a reason for missing data.

============================================================
ASSESSOR POV
============================================================

Assessor-facing fields:
- overall_summary
- cognitive_analysis
- assessor_strengths
- assessor_areas_for_improvement

Evaluation Summary field:
- ai_cognitive_insights

ai_cognitive_insights is generated for the Evaluation Summary page.
It must remain a separate set of four concise cognitive/assessment
insights. Do NOT treat it as the Assessor Performance Patterns section
and do not use it to replace assessor_strengths or
assessor_areas_for_improvement.

Use THIRD-PERSON language for assessor-facing content.

------------------------------------------------------------
overall_summary
------------------------------------------------------------

Provide a concise overall assessment summary.

Prioritize:
- actual score/result
- broad performance
- important multimodal pattern
- main areas for review

Do not repeat the same detailed conclusion used elsewhere.

------------------------------------------------------------
cognitive_analysis
------------------------------------------------------------

This is the main multimodal assessor interpretation.

Explain how correctness, response behavior, question difficulty, and
available EEG-supported information interacted.

Example style:
"The trainee performed well across the assessment. Several difficult
questions required more time and were accompanied by noticeable EEG
information changes, but the trainee still answered them correctly.
In contrast, some questions combined longer response times, EEG-
supported changes, and incorrect answers. These questions may be useful
for follow-up review."

Do not expose the underlying measurements.
Do not claim causation.

------------------------------------------------------------
ai_cognitive_insights
------------------------------------------------------------

Return EXACTLY 4 concise insights for the Evaluation Summary page.

These are separate from the Assessor Performance Patterns section.
They summarize meaningful cognitive and assessment observations that
can be displayed on the Evaluation Summary page.

GROUP related findings instead of listing raw question metrics.

Focus on useful patterns such as:
1. successful handling of difficult questions
2. meaningful interaction between response behavior and correctness
3. notable cognitive/assessment observations supported by Ground Truth
4. practical or informative overall assessment patterns

Do not expose raw EEG values, ratios, baselines, or segment counts.
Do not claim that EEG caused an answer or proves a mental state.
Each insight must add NEW information and must not repeat the overall
summary or cognitive_analysis word-for-word.

------------------------------------------------------------
assessor_strengths
------------------------------------------------------------

Return EXACTLY 4 assessor-facing strengths.

Use THIRD-PERSON language.

Focus on:
- strong topic areas
- correct answers on difficult questions
- successful handling of demanding questions
- efficient and accurate performance where supported

Example:
"The trainee correctly handled several difficult scenario-based
questions involving network isolation, power protection, backups, and
maintenance planning."

Do not use trainee-facing language such as "You showed...".

------------------------------------------------------------
assessor_areas_for_improvement
------------------------------------------------------------

Return EXACTLY 4 assessor-facing improvement areas.

Use THIRD-PERSON language.

Prioritize:
- incorrect answers
- repeated topic mistakes
- longer + incorrect questions
- topics where further practice would help

Do not turn a longer-but-correct question into a weakness by itself.

============================================================
TRAINEE POV
============================================================

Trainee-facing fields:
- feedback
- recommendations
- strengths
- areas_for_improvement

Use SECOND-PERSON language.

Do NOT mention EEG, brainwave bands, cognitive load, attention ratio,
engagement ratio, baseline, EEG segments, or technical processing.

Translate EEG-informed reasoning into learning guidance.

If a difficult question took more time but was answered correctly,
do NOT recommend the topic as a weakness solely because it took longer.

If a difficult question took longer, had an EEG-supported pattern,
and was answered incorrectly, that topic MAY be prioritized for review.

------------------------------------------------------------
feedback
------------------------------------------------------------

Return EXACTLY 4 concise trainee-facing statements.

Use:
1. overall result
2. broad strengths
3. main areas needing review
4. practical next-step guidance

Do not simply repeat individual question numbers.

------------------------------------------------------------
recommendations
------------------------------------------------------------

Return EXACTLY 4 practical trainee-facing recommendations.

Recommendations should come from the learning patterns in the
assessment, not from EEG values.

------------------------------------------------------------
strengths
------------------------------------------------------------

Return EXACTLY 4 trainee-facing strengths.

Use second-person language.

------------------------------------------------------------
areas_for_improvement
------------------------------------------------------------

Return EXACTLY 4 trainee-facing improvement areas.

Use second-person language.

============================================================
AVOID REPETITION
============================================================

Each field must add new information.

Do not repeat the same sentence, question group, or conclusion across:
- overall_summary
- cognitive_analysis
- ai_cognitive_insights
- assessor_strengths
- assessor_areas_for_improvement
- feedback
- recommendations
- strengths
- areas_for_improvement

Each section has a distinct purpose.

============================================================
COMPETENCY AND SCORE
============================================================

Use Ground Truth score/result exactly.

Do not recalculate.
Do not invent another grade.

============================================================
NO CONFIDENCE SCORE FROM THE MODEL
============================================================

Do NOT generate confidence_score.
The backend calculates confidence_score separately.

============================================================
OUTPUT
============================================================

Return ONLY valid JSON.
Do NOT return Markdown.
Do NOT return code fences.
Do NOT add fields outside this exact structure:

{
  "overall_summary": "Assessor-facing overall assessment summary.",
  "feedback": [
    "Trainee-facing feedback 1.",
    "Trainee-facing feedback 2.",
    "Trainee-facing feedback 3.",
    "Trainee-facing feedback 4."
  ],
  "cognitive_analysis": "Assessor-facing multimodal analysis.",
  "ai_cognitive_insights": [
    "Evaluation Summary insight 1.",
    "Evaluation Summary insight 2.",
    "Evaluation Summary insight 3.",
    "Evaluation Summary insight 4."
  ],
  "recommendations": [
    "Trainee recommendation 1.",
    "Trainee recommendation 2.",
    "Trainee recommendation 3.",
    "Trainee recommendation 4."
  ],
  "strengths": [
    "Trainee strength 1.",
    "Trainee strength 2.",
    "Trainee strength 3.",
    "Trainee strength 4."
  ],
  "areas_for_improvement": [
    "Trainee improvement 1.",
    "Trainee improvement 2.",
    "Trainee improvement 3.",
    "Trainee improvement 4."
  ],
  "assessor_strengths": [
    "Assessor strength 1.",
    "Assessor strength 2.",
    "Assessor strength 3.",
    "Assessor strength 4."
  ],
  "assessor_areas_for_improvement": [
    "Assessor improvement 1.",
    "Assessor improvement 2.",
    "Assessor improvement 3.",
    "Assessor improvement 4."
  ]
}

Every array MUST contain exactly 4 meaningful complete sentences.
`;

    // ------------------------------------------------------------
    // 7. Build OpenAI input
    // ------------------------------------------------------------
    const promptText = `
EEG AVAILABLE:
${hasEegData ? "true" : "false"}

GROUND TRUTH DATA:
${JSON.stringify(normalizedGroundTruth)}
`;

    // ------------------------------------------------------------
    // 8. OpenAI configuration
    // ------------------------------------------------------------
    // [OPENAI CHANGE] Model + API endpoint.
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      throw new Error(
        "OPENAI_API_KEY is not set in Supabase secrets."
      );
    }

    const openaiModel = "gpt-5.6-luna";
    const openaiApiUrl =
      "https://api.openai.com/v1/responses";

    const responseSchema = {
      type: "object",
      additionalProperties: false,
      properties: {
        overall_summary: { type: "string" },
        feedback: {
          type: "array",
          items: { type: "string" },
        },
        cognitive_analysis: { type: "string" },
        ai_cognitive_insights: {
          type: "array",
          items: { type: "string" },
        },
        recommendations: {
          type: "array",
          items: { type: "string" },
        },
        strengths: {
          type: "array",
          items: { type: "string" },
        },
        areas_for_improvement: {
          type: "array",
          items: { type: "string" },
        },
        assessor_strengths: {
          type: "array",
          items: { type: "string" },
        },
        assessor_areas_for_improvement: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: [
        "overall_summary",
        "feedback",
        "cognitive_analysis",
        "ai_cognitive_insights",
        "recommendations",
        "strengths",
        "areas_for_improvement",
        "assessor_strengths",
        "assessor_areas_for_improvement",
      ],
    };

    const apiBody = JSON.stringify({
      model: openaiModel,
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: promptText,
        },
      ],
      reasoning: {
        effort: "low",
      },
      text: {
        format: {
          type: "json_schema",
          name: "noerion_assessment_insights",
          strict: true,
          schema: responseSchema,
        },
      },
      max_output_tokens: 3500,
    });

    // ------------------------------------------------------------
    // 9. Call OpenAI with retry logic
    // ------------------------------------------------------------
    let aiResult: any = null;
    const maxRetries = 3;
    let lastOpenAIStatus: number | null = null;
    let lastOpenAIMessage = "OpenAI service unavailable.";
    let retryAfterSeconds: number | null = null;
    let temporaryOpenAIFailure = false;

    const retryableStatusCodes = new Set([
      500,
      502,
      503,
      504,
    ]);

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // [OPENAI CHANGE] Actual API call.
        const aiResponse = await fetch(
          openaiApiUrl,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiApiKey}`,
            },
            body: apiBody,
          }
        );

        lastOpenAIStatus = aiResponse.status;

        let responseText = "";

        try {
          responseText = await aiResponse.text();
        } catch (readError: any) {
          lastOpenAIMessage =
            readError?.message ||
            "Unable to read OpenAI response.";
        }

        try {
          aiResult = responseText
            ? JSON.parse(responseText)
            : null;
        } catch (_parseError) {
          aiResult = null;
        }

        const openAIErrorMessage =
          aiResult?.error?.message ||
          (responseText
            ? responseText
            : `OpenAI returned HTTP ${aiResponse.status}.`);

        lastOpenAIMessage = openAIErrorMessage;

        if (aiResponse.ok && !aiResult?.error) {
          temporaryOpenAIFailure = false;
          break;
        }

        if (aiResponse.status === 429) {
          const retryAfterHeader =
            aiResponse.headers.get("Retry-After");

          const parsedRetryAfter =
            retryAfterHeader
              ? Number(retryAfterHeader)
              : NaN;

          if (
            Number.isFinite(parsedRetryAfter) &&
            parsedRetryAfter >= 0
          ) {
            retryAfterSeconds = parsedRetryAfter;
          }

          return new Response(
            JSON.stringify({
              success: false,
              error:
                "OpenAI rate limit reached. Please wait before trying again.",
              details: lastOpenAIMessage,
              retryable: true,
              openai_status: 429,
              retry_after_seconds: retryAfterSeconds,
            }),
            {
              status: 429,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                ...(retryAfterSeconds !== null
                  ? {
                      "Retry-After":
                        String(retryAfterSeconds),
                    }
                  : {}),
              },
            }
          );
        }

        temporaryOpenAIFailure =
          retryableStatusCodes.has(aiResponse.status);

        if (!temporaryOpenAIFailure) {
          break;
        }

        if (attempt < maxRetries) {
          const baseDelay =
            3000 * Math.pow(2, attempt - 1);
          const jitter =
            Math.floor(Math.random() * 1000);
          const delay = Math.min(
            baseDelay + jitter,
            30000
          );

          await sleep(delay);
        }
      } catch (error: any) {
        lastOpenAIStatus = null;
        lastOpenAIMessage =
          error?.message ||
          "Network error while contacting OpenAI.";
        temporaryOpenAIFailure = true;

        if (attempt < maxRetries) {
          const baseDelay =
            3000 * Math.pow(2, attempt - 1);
          const jitter =
            Math.floor(Math.random() * 1000);
          const delay = Math.min(
            baseDelay + jitter,
            30000
          );

          await sleep(delay);
        }
      }
    }

    // ------------------------------------------------------------
    // 10. Handle OpenAI failure
    // ------------------------------------------------------------
    if (!aiResult || aiResult?.error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: temporaryOpenAIFailure
            ? "OpenAI service is temporarily unavailable after retries."
            : `OpenAI API Error: ${lastOpenAIMessage}`,
          details: lastOpenAIMessage,
          retryable: temporaryOpenAIFailure,
          openai_status: lastOpenAIStatus,
        }),
        {
          status: temporaryOpenAIFailure ? 503 : 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ------------------------------------------------------------
    // 11. Extract OpenAI structured output
    // ------------------------------------------------------------
    const candidateText =
      aiResult?.output_text ||
      aiResult?.output
        ?.find((item: any) => item?.type === "message")
        ?.content
        ?.find((item: any) => item?.type === "output_text")
        ?.text;

    if (!candidateText) {
      throw new Error(
        `OpenAI returned empty structured output: ${JSON.stringify(aiResult)}`
      );
    }

    const rawContent = String(candidateText).trim();

    let insights: any;

    try {
      insights = JSON.parse(rawContent);
    } catch (_parseError) {
      throw new Error(
        `OpenAI returned invalid JSON: ${rawContent}`
      );
    }

    // ------------------------------------------------------------
    // 12. Output normalization helpers
    // ------------------------------------------------------------
    const normalizeString = (
      value: unknown,
      fieldName: string
    ): string => {
      if (typeof value !== "string") {
        throw new Error(
          `OpenAI output field must be a string: ${fieldName}`
        );
      }

      const normalized = value.trim();

      if (!normalized) {
        throw new Error(
          `OpenAI output field is empty: ${fieldName}`
        );
      }

      return normalized;
    };

    const normalizeStringArray = (
      value: unknown,
      fieldName: string,
      expectedLength = 4
    ): string[] => {
      if (!Array.isArray(value)) {
        throw new Error(
          `OpenAI output field must be an array: ${fieldName}`
        );
      }

      if (value.length !== expectedLength) {
        throw new Error(
          `OpenAI output field ${fieldName} must contain exactly ${expectedLength} items. Received ${value.length}.`
        );
      }

      return value.map((item, index) => {
        if (typeof item !== "string") {
          throw new Error(
            `OpenAI output field ${fieldName}[${index}] must be a string.`
          );
        }

        const text = item.trim();

        if (!text) {
          throw new Error(
            `OpenAI output field ${fieldName}[${index}] is empty.`
          );
        }

        return text;
      });
    };

    // ------------------------------------------------------------
    // 13. Validate required fields
    // ------------------------------------------------------------
    const overallSummary = normalizeString(
      insights?.overall_summary,
      "overall_summary"
    );

    const cognitiveAnalysis = normalizeString(
      insights?.cognitive_analysis,
      "cognitive_analysis"
    );

    const aiCognitiveInsights = normalizeStringArray(
      insights?.ai_cognitive_insights,
      "ai_cognitive_insights",
      4
    );

    const feedback = normalizeStringArray(
      insights?.feedback,
      "feedback",
      4
    );

    const recommendations = normalizeStringArray(
      insights?.recommendations,
      "recommendations",
      4
    );

    const strengths = normalizeStringArray(
      insights?.strengths,
      "strengths",
      4
    );

    const areasForImprovement = normalizeStringArray(
      insights?.areas_for_improvement,
      "areas_for_improvement",
      4
    );

    const assessorStrengths = normalizeStringArray(
      insights?.assessor_strengths,
      "assessor_strengths",
      4
    );

    const assessorAreasForImprovement =
      normalizeStringArray(
        insights?.assessor_areas_for_improvement,
        "assessor_areas_for_improvement",
        4
      );

    const allowedFields = new Set([
      "overall_summary",
      "feedback",
      "cognitive_analysis",
      "ai_cognitive_insights",
      "recommendations",
      "strengths",
      "areas_for_improvement",
      "assessor_strengths",
      "assessor_areas_for_improvement",
    ]);

    const unexpectedFields = Object.keys(
      insights || {}
    ).filter(
      (field) => !allowedFields.has(field)
    );

    if (unexpectedFields.length > 0) {
      throw new Error(
        `OpenAI returned unexpected fields: ${unexpectedFields.join(", ")}`
      );
    }

    // ------------------------------------------------------------
    // 14. Determine trainee ID
    // ------------------------------------------------------------
    const finalTraineeId =
      traineeId ||
      normalizedGroundTruth?.submission?.trainee_id ||
      null;

    if (!finalTraineeId) {
      throw new Error(
        "Missing trainee ID. Could not determine trainee_id from payload or Ground Truth."
      );
    }

    // ------------------------------------------------------------
    // 15. Save AI insights
    // ------------------------------------------------------------
    const insightPayload = {
      submission_id: submissionId,
      trainee_id: finalTraineeId,

      confidence_score: confidenceScore,

      overall_summary: overallSummary,
      feedback: feedback,
      cognitive_analysis: cognitiveAnalysis,

      // Used by the Evaluation Summary page. This remains separate
      // from the Assessor Performance Patterns fields below.
      ai_cognitive_insights: aiCognitiveInsights,

      recommendations: recommendations,
      strengths: strengths,
      areas_for_improvement: areasForImprovement,

      // NEW: assessor-only versions of strengths/improvements.
      assessor_strengths: assessorStrengths,
      assessor_areas_for_improvement:
        assessorAreasForImprovement,

      generated_at: new Date().toISOString(),
    };

    const {
      data: updatedRows,
      error: updateError,
    } = await supabaseAdmin
      .from("ai_assessment_insights")
      .update(insightPayload)
      .eq("submission_id", submissionId)
      .select("id, submission_id, confidence_score")
      .limit(1);

    if (updateError) {
      throw new Error(
        `DB Update Error: ${updateError.message}`
      );
    }

    if (!updatedRows || updatedRows.length === 0) {
      const { error: insertError } =
        await supabaseAdmin
          .from("ai_assessment_insights")
          .insert(insightPayload);

      if (insertError) {
        throw new Error(
          `DB Insert Error: ${insertError.message}`
        );
      }
    }

    console.log("=== AI INSIGHT SAVED ===");
    console.log("submission_id:", submissionId);
    console.log("confidence_score:", confidenceScore);

    // ------------------------------------------------------------
    // 16. Success response
    // ------------------------------------------------------------
    return new Response(
      JSON.stringify({
        success: true,
        submission_id: submissionId,
        confidence_score: confidenceScore,
        message:
          "AI assessment insights generated successfully.",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error(
      "Edge Function Error:",
      error?.message || error
    );

    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
