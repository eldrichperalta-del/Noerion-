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
    // 4. Determine EEG availability ONLY from Ground Truth
    //
    // This does not create or modify Ground Truth.
    // It is only used to protect the AI prompt.
    // ------------------------------------------------------------
    const activeSegments =
      Number(
        groundTruth?.eeg_analysis
          ?.active_reading
          ?.total_active_segments ?? 0
      );

    const hasEegData = activeSegments > 0;

    // ------------------------------------------------------------
    // 5. System prompt for Gemini
    // ------------------------------------------------------------
    const systemPrompt = `
You are a helpful and direct assessment analyst for NOERION.

Your job is to interpret the provided Ground Truth data and produce
simple assessment insights.

LANGUAGE AND TONE:

1. Use simple, plain, clear English.
2. Avoid unnecessary academic or medical terminology.
3. Prefer terms such as:
   - mental effort
   - mental focus
   - attention
   - brainwave activity
   - work speed
   - test performance
   - question difficulty
4. Do not make medical, neurological, or diagnostic claims.

IMPORTANT DATA RULE:

The provided Ground Truth is the deterministic source of truth.

DO NOT recalculate:
- question time
- total assessment time
- question start/end times
- EEG timestamps
- EEG/question matching
- cognitive load
- attention
- engagement
- friction scores
- accuracy
- scores

Use the values exactly as provided.

EEG RULES:

First inspect whether EEG data is available.

If eeg_analysis indicates that there is NO EEG data
(active EEG segments = 0 or has_eeg_data is false):

You MUST NOT make claims about:
- cognitive load
- attention
- focus patterns
- mental effort
- stress
- brainwave patterns
- EEG changes

For ai_cognitive_insights, return EXACTLY these four strings:

[
  "EEG headset was disconnected or not recorded during this session.",
  "Brainwave and attention metrics were unavailable.",
  "Evaluation is based strictly on quiz score and completion time.",
  "Please check headset connection for future exams."
]

Do not claim that the trainee had stable focus, low mental stress,
optimal attention, or any other EEG-related state.

If EEG data IS available:

Use the question-level EEG values provided by Ground Truth.

For each question, consider the combination of:
- correctness
- time spent
- average cognitive load
- peak cognitive load
- cognitive load delta
- EEG segment count

A high cognitive load value alone does NOT prove struggle,
overload, stress, or poor performance.

Use cautious language such as:
- "higher mental effort"
- "possible difficulty"
- "greater mental demand"
- "the question appears to have required more effort"

Only describe a question as a likely difficulty point when the
available evidence supports it, such as higher mental effort
together with longer time, an incorrect answer, or another
relevant signal.

QUESTION ANALYSIS:

Use the question-level Ground Truth data to identify:
- questions that were answered correctly with efficient timing
- questions that took longer than others
- questions with higher mental effort
- questions where higher effort coincided with an incorrect answer
- questions where higher effort still resulted in a correct answer

Do NOT assume:
high cognitive load = bad performance.

Do NOT assume:
low cognitive load = mastery.

Use the actual combination of the provided metrics.

PACING:

Only mention pacing as a problem when the data clearly supports it.

Do not call a trainee's timing "too slow" merely because one question
took longer than another.

COMPETENCY:

Use the competency information provided by Ground Truth when available.

Do not invent competency scores.

MISSING DATA:

If a value is null, unavailable, or absent:
- do not invent a value
- do not replace it with zero
- do not assume it means low activity
- simply base the interpretation on the available data

OUTPUT:

Return ONLY valid JSON.

The JSON MUST match this exact structure:

{
  "overall_summary": "Simple overall performance summary.",
  "feedback": [
    "Feedback point 1.",
    "Feedback point 2.",
    "Feedback point 3.",
    "Feedback point 4."
  ],
  "cognitive_analysis": "Simple explanation of the relationship between performance, timing, and EEG findings.",
  "ai_cognitive_insights": [
    "Observation 1.",
    "Observation 2.",
    "Observation 3.",
    "Observation 4."
  ],
  "recommendations": [
    "Recommendation 1.",
    "Recommendation 2.",
    "Recommendation 3.",
    "Recommendation 4."
  ],
  "strengths": [
    "Strength 1.",
    "Strength 2.",
    "Strength 3.",
    "Strength 4."
  ],
  "areas_for_improvement": [
    "Improvement 1.",
    "Improvement 2.",
    "Improvement 3.",
    "Improvement 4."
  ]
}

IMPORTANT:

- Do not add extra JSON fields.
- Do not return Markdown.
- Do not wrap the JSON in code fences.
- Do not invent measurements.
- Do not modify the Ground Truth.
- "feedback" MUST contain exactly 4 separate strings.
- "ai_cognitive_insights" MUST contain exactly 4 separate strings.
- "recommendations" MUST contain exactly 4 separate strings.
- "strengths" MUST contain exactly 4 separate strings.
- "areas_for_improvement" MUST contain exactly 4 separate strings.
- Each array item must be a meaningful complete sentence.
`;

    // ------------------------------------------------------------
    // 6. Build Gemini prompt
    //
    // Ground Truth is passed AS-IS.
    // ------------------------------------------------------------
    const promptText = `
${systemPrompt}

EEG AVAILABLE:
${hasEegData ? "true" : "false"}

GROUND TRUTH DATA:
${JSON.stringify(groundTruth)}
`;

    // ------------------------------------------------------------
    // 7. Gemini API configuration
    // ------------------------------------------------------------
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set in Supabase secrets."
      );
    }

    const apiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `gemini-3.6-flash:generateContent?key=${geminiApiKey}`;

    const apiBody = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: promptText,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    // ------------------------------------------------------------
    // 8. Call Gemini with safe retry logic
    //
    // IMPORTANT:
    // - 429 = rate limit. Do NOT immediately retry because that can
    //        consume even more RPM. Return 429 to the caller.
    // - 503/500/502/504 = temporary Gemini service problem. Retry
    //        with exponential backoff + jitter.
    // - Other 4xx errors = permanent request/configuration problem.
    //        Do not retry.
    // ------------------------------------------------------------
    let aiResult: any = null;

    const maxRetries = 3;

    let lastGeminiStatus: number | null = null;
    let lastGeminiMessage = "Gemini service unavailable.";
    let retryAfterSeconds: number | null = null;
    let temporaryGeminiFailure = false;

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
        const aiResponse = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: apiBody,
        });

        lastGeminiStatus = aiResponse.status;

        // Read the response body exactly once.
        let responseText = "";

        try {
          responseText = await aiResponse.text();
        } catch (readError: any) {
          lastGeminiMessage =
            readError?.message ||
            "Unable to read Gemini response.";
        }

        try {
          aiResult = responseText
            ? JSON.parse(responseText)
            : null;
        } catch (_parseError) {
          aiResult = null;
        }

        const geminiErrorMessage =
          aiResult?.error?.message ||
          (responseText
            ? responseText
            : `Gemini returned HTTP ${aiResponse.status}.`);

        lastGeminiMessage = geminiErrorMessage;

        // ----------------------------------------------------------
        // Successful Gemini response
        // ----------------------------------------------------------
        if (aiResponse.ok && !aiResult?.error) {
          temporaryGeminiFailure = false;
          break;
        }

        // ----------------------------------------------------------
        // 429 RATE LIMIT
        // ----------------------------------------------------------
        // Do NOT retry a 429 inside this function. If the project has
        // reached its RPM/TPM limit, another immediate request only
        // makes the rate-limit situation worse.
        if (aiResponse.status === 429) {
          temporaryGeminiFailure = false;

          const retryAfterHeader =
            aiResponse.headers.get("Retry-After");

          if (retryAfterHeader) {
            const parsedRetryAfter =
              Number(retryAfterHeader);

            if (
              Number.isFinite(parsedRetryAfter) &&
              parsedRetryAfter >= 0
            ) {
              retryAfterSeconds = parsedRetryAfter;
            }
          }

          console.warn(
            `Gemini rate limit reached (429). ` +
            `No automatic retry will be made. ` +
            `Message: ${geminiErrorMessage}`
          );

          return new Response(
            JSON.stringify({
              success: false,
              error:
                "Gemini rate limit reached. Please wait before trying again.",
              details: lastGeminiMessage,
              retryable: true,
              gemini_status: 429,
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

        // ----------------------------------------------------------
        // Other Gemini errors
        // ----------------------------------------------------------
        temporaryGeminiFailure =
          retryableStatusCodes.has(aiResponse.status);

        console.warn(
          `Gemini API attempt ${attempt}/${maxRetries} failed. ` +
          `Status: ${aiResponse.status}. ` +
          `Message: ${geminiErrorMessage}`
        );

        // Do not retry permanent errors such as 400, 401, 403, 404.
        if (!temporaryGeminiFailure) {
          break;
        }

        // ----------------------------------------------------------
        // Exponential backoff + jitter for 5xx errors
        //
        // Attempt 1 -> about 3-4 seconds
        // Attempt 2 -> about 6-7 seconds
        // ----------------------------------------------------------
        if (attempt < maxRetries) {
          const retryAfterHeader =
            aiResponse.headers.get("Retry-After");

          let delay: number;

          const parsedRetryAfter =
            retryAfterHeader
              ? Number(retryAfterHeader)
              : NaN;

          if (
            Number.isFinite(parsedRetryAfter) &&
            parsedRetryAfter >= 0
          ) {
            delay = Math.min(
              parsedRetryAfter * 1000,
              30000
            );
          } else {
            const baseDelay =
              3000 * Math.pow(2, attempt - 1);

            const jitter =
              Math.floor(Math.random() * 1000);

            delay = Math.min(
              baseDelay + jitter,
              30000
            );
          }

          console.warn(
            `Gemini temporary error (${aiResponse.status}). ` +
            `Retrying in ${delay}ms...`
          );

          await sleep(delay);
        }
      } catch (error: any) {
        // Network/fetch failures have no HTTP status. Treat them as
        // temporary, but still limit the number of attempts.
        lastGeminiStatus = null;

        lastGeminiMessage =
          error?.message ||
          "Network error while contacting Gemini.";

        temporaryGeminiFailure = true;

        console.warn(
          `Gemini fetch attempt ${attempt}/${maxRetries} failed: ` +
          `${lastGeminiMessage}`
        );

        if (attempt < maxRetries) {
          const baseDelay =
            3000 * Math.pow(2, attempt - 1);

          const jitter =
            Math.floor(Math.random() * 1000);

          const delay = Math.min(
            baseDelay + jitter,
            30000
          );

          console.warn(
            `Retrying Gemini request in ${delay}ms...`
          );

          await sleep(delay);
        }
      }
    }

    // ------------------------------------------------------------
    // 9. Handle Gemini failure after all retries
    // ------------------------------------------------------------

    if (!aiResult || aiResult?.error) {
      if (temporaryGeminiFailure) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Gemini service is temporarily unavailable after retries.",
            details: lastGeminiMessage,
            retryable: true,
            gemini_status: lastGeminiStatus,
          }),
          {
            status: 503,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error:
            `Gemini API Error: ${lastGeminiMessage}`,
          retryable: false,
          gemini_status: lastGeminiStatus,
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

    // ------------------------------------------------------------
    // 10. Extract Gemini response
    // ------------------------------------------------------------
    const candidateText =
      aiResult?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error(
        `Gemini API returned empty text: ${JSON.stringify(aiResult)}`
      );
    }

    const rawContent = candidateText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();

    let insights: any;

    try {
      insights = JSON.parse(rawContent);
    } catch (_parseError) {
      throw new Error(
        `Gemini returned invalid JSON: ${rawContent}`
      );
    }

    // ------------------------------------------------------------
    // 11. Helper functions for safe AI output normalization
    // ------------------------------------------------------------

    const normalizeString = (
      value: unknown,
      fieldName: string
    ): string => {
      if (typeof value !== "string") {
        throw new Error(
          `Gemini output field must be a string: ${fieldName}`
        );
      }

      const normalized = value.trim();

      if (!normalized) {
        throw new Error(
          `Gemini output field is empty: ${fieldName}`
        );
      }

      return normalized;
    };

    const normalizeStringArray = (
      value: unknown,
      fieldName: string,
      expectedLength = 4
    ): string[] => {
      let parsedValue = value;

      // Gemini may occasionally return:
      // "[\"item 1\", \"item 2\", ...]"
      //
      // Convert that JSON string into an actual array.
      if (typeof parsedValue === "string") {
        try {
          parsedValue = JSON.parse(parsedValue);
        } catch (_error) {
          throw new Error(
            `Gemini output field is not a valid JSON array: ${fieldName}`
          );
        }
      }

      if (!Array.isArray(parsedValue)) {
        throw new Error(
          `Gemini output field must be an array: ${fieldName}`
        );
      }

      if (parsedValue.length !== expectedLength) {
        throw new Error(
          `Gemini output field ${fieldName} must contain exactly ` +
          `${expectedLength} items. Received ${parsedValue.length}.`
        );
      }

      const normalized = parsedValue.map((item, index) => {
        if (typeof item !== "string") {
          throw new Error(
            `Gemini output field ${fieldName}[${index}] must be a string.`
          );
        }

        const text = item.trim();

        if (!text) {
          throw new Error(
            `Gemini output field ${fieldName}[${index}] is empty.`
          );
        }

        return text;
      });

      return normalized;
    };

    // ------------------------------------------------------------
    // 12. Validate required string fields
    // ------------------------------------------------------------

    const overallSummary = normalizeString(
      insights?.overall_summary,
      "overall_summary"
    );

    const cognitiveAnalysis = normalizeString(
      insights?.cognitive_analysis,
      "cognitive_analysis"
    );

    // ------------------------------------------------------------
    // 13. Validate and normalize array fields
    // ------------------------------------------------------------

    const feedback = normalizeStringArray(
      insights?.feedback,
      "feedback",
      4
    );

    const aiCognitiveInsights = normalizeStringArray(
      insights?.ai_cognitive_insights,
      "ai_cognitive_insights",
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

    // ------------------------------------------------------------
    // 14. Make sure Gemini did not return unexpected fields
    // ------------------------------------------------------------

    const allowedFields = new Set([
      "overall_summary",
      "feedback",
      "cognitive_analysis",
      "ai_cognitive_insights",
      "recommendations",
      "strengths",
      "areas_for_improvement",
    ]);

    const returnedFields = Object.keys(insights || {});

    const unexpectedFields = returnedFields.filter(
      (field) => !allowedFields.has(field)
    );

    if (unexpectedFields.length > 0) {
      throw new Error(
        `Gemini returned unexpected fields: ${unexpectedFields.join(", ")}`
      );
    }

    // ------------------------------------------------------------
    // 15. Determine trainee ID
    // ------------------------------------------------------------

    const finalTraineeId =
      traineeId ||
      groundTruth?.submission?.trainee_id ||
      null;

    if (!finalTraineeId) {
      throw new Error(
        "Missing trainee ID. Could not determine trainee_id from payload or Ground Truth."
      );
    }

    // ------------------------------------------------------------
    // 16. Save AI insights
    //
    // IMPORTANT:
    // feedback / strengths / areas_for_improvement are JSONB arrays.
    // ai_cognitive_insights / recommendations are PostgreSQL text[].
    // ------------------------------------------------------------

    const { error: insertError } = await supabaseAdmin
      .from("ai_assessment_insights")
      .insert({
        submission_id: submissionId,
        trainee_id: finalTraineeId,

        overall_summary: overallSummary,

        // JSONB array
        feedback: feedback,

        cognitive_analysis: cognitiveAnalysis,

        // PostgreSQL text[]
        ai_cognitive_insights: aiCognitiveInsights,

        // PostgreSQL text[]
        recommendations: recommendations,

        // JSONB arrays
        strengths: strengths,
        areas_for_improvement: areasForImprovement,

        generated_at: new Date().toISOString(),
      });

    if (insertError) {
      throw new Error(
        `DB Insert Error: ${insertError.message}`
      );
    }

    // ------------------------------------------------------------
    // 17. Success response
    // ------------------------------------------------------------

    return new Response(
      JSON.stringify({
        success: true,
        submission_id: submissionId,
        message: "AI assessment insights generated successfully.",
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