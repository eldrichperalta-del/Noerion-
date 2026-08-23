import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const record = payload.record || payload;

    const submissionId = record.submission_id || record.submissionId || record.id;
    const traineeId = record.trainee_id || record.traineeId || record.trainee_uid;

    if (!submissionId) {
      throw new Error("Missing submission ID in payload.");
    }

    // 1. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 2. Fetch Aggregated Ground Truth Data
    const { data: rawGroundTruth, error: gtError } = await supabaseAdmin.rpc(
      "get_submission_ground_truth",
      { p_submission_id: submissionId }
    );

    if (gtError) throw new Error(`Ground Truth RPC Error: ${gtError.message}`);

    // 2b. Add deterministic pre-computed metrics to lower AI hallucination
    const groundTruth = {
      ...rawGroundTruth,
      questions_analysis: (rawGroundTruth?.questions_analysis || []).map((q: any) => ({
        ...q,
        // Deterministic heuristic: correlates duration with hesitation logs
        perceived_friction_score: Math.round(((q.time_spent_seconds || 0) * ((q.event_count || 0) + 1)) / 10)
      }))
    };

    // 3. Construct System Prompt & Payload
    const systemPrompt = `You are an expert cognitive & technical assessment analyst for NOERION.

DATA LIMITATIONS & STRICT RULES:
1. You DO NOT have individual per-question live EEG sensor channels. You ONLY have overall session active EEG averages and item-level duration/event metrics.
2. DO NOT fabricate or state specific numerical EEG percentages for individual questions.
3. Evaluate question-level cognitive strain STRICTLY using "perceived_friction_score", "time_spent_seconds", "event_count", and answer correctness.
4. Output concise, single-sentence bullet points for ALL array fields (max 10-12 words per bullet).
5. TIME CONSTRAINT GUARDRAIL: The candidate used "time_used_pct" of their total allowed limit. DO NOT state, imply, or hallucinate that the candidate suffered from "time constraints", "time pressure", "pacing issues", or "ran out of time" unless "time_used_pct" is greater than 90%.

Output ONLY valid JSON matching this exact schema:
{
  "overall_summary": "High-level summary incorporating score accuracy and baseline vs active EEG comparison...",
  "competency_breakdown": { "Remembering": 85.0, "Applying": 60.0, "Easy": 90.0, "Hard": 50.0 },
  "cognitive_analysis": "Qualitative analysis linking overall cognitive strain to questions with high perceived_friction_scores...",
  "ai_cognitive_insights": [
    "Concise observation on attention patterns during assessment",
    "Concise observation on cognitive load or fatigue detected",
    "Concise observation on mental workload stability",
    "Concise observation on engagement levels during examination"
  ],
  "recommendations": [
    "Actionable recommendation point 1",
    "Actionable recommendation point 2",
    "Actionable recommendation point 3",
    "Actionable recommendation point 4"
  ],
  "strengths": [
    "Key performance strength bullet 1",
    "Key performance strength bullet 2",
    "Key performance strength bullet 3",
    "Key performance strength bullet 4"
  ],
  "areas_for_improvement": [
    "Targeted improvement area bullet 1",
    "Targeted improvement area bullet 2",
    "Targeted improvement area bullet 3",
    "Targeted improvement area bullet 4"
  ]
}`;

    const promptText = `${systemPrompt}\n\nDATA:\n${JSON.stringify(groundTruth)}`;

    // 4. Call Gemini API with Retry Logic, Temperature Constraints & Exponential Backoff
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not set in Supabase secrets.");
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`;
    const apiBody = JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: { 
        responseMimeType: "application/json",
        temperature: 0.1 // Forces deterministic output and minimizes creative hallucination
      }
    });

    let aiResult: any = null;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const aiResponse = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: apiBody
        });

        aiResult = await aiResponse.json();

        if (aiResponse.ok && !aiResult.error) {
          break;
        }

        console.warn(`Gemini API Attempt ${attempt} failed: ${aiResult.error?.message || 'Unknown error'}`);
      } catch (e: any) {
        console.warn(`Fetch Attempt ${attempt} error: ${e.message}`);
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
      }
    }

    if (!aiResult || aiResult.error) {
      throw new Error(`Gemini API Error after retries: ${aiResult?.error?.message || 'Service unavailable'}`);
    }

    const candidateText = aiResult.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error(`Gemini API returned empty text: ${JSON.stringify(aiResult)}`);
    }

    let rawContent = candidateText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const insights = JSON.parse(rawContent);

    // 5. Save Insights in Database
    const { error: insertError } = await supabaseAdmin
      .from("ai_assessment_insights")
      .insert({
        submission_id: submissionId,
        trainee_id: traineeId || rawGroundTruth.submission?.trainee_id || null,
        overall_summary: insights.overall_summary,
        competency_breakdown: insights.competency_breakdown,
        cognitive_analysis: insights.cognitive_analysis,
        ai_cognitive_insights: insights.ai_cognitive_insights || [],
        recommendations: insights.recommendations || [],
        strengths: insights.strengths || [],
        areas_for_improvement: insights.areas_for_improvement || [],
        generated_at: new Date().toISOString()
      });

    if (insertError) throw new Error(`DB Insert Error: ${insertError.message}`);

    return new Response(
      JSON.stringify({ success: true, message: "Insights generated cleanly via Gemini!" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("Edge Function Error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});