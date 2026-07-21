// ============================================================================
// MOCK AI ANALYSIS DATA
// ----------------------------------------------------------------------------
// FRONTEND DEVELOPMENT ONLY
//
// BACKEND HANDOFF:
//
// Replace this object with the AI analysis API response.
//
// Expected backend response:
//
// {
//   trainee:{
//      name:string,
//      id:string,
//      course:string
//   },
//
//   aiResult:{
//      suggestedResult:string,
//      confidenceScore:number,
//      recommendation:string
//   },
//
//   eeg:{
//      attention:{
//          value:number
//      },
//
//      focus:{
//          value:number
//      },
//
//      engagement:{
//          value:number
//      }
//   },
//
//   patterns:{
//      strengths:string[],
//      weaknesses:string[],
//      notableTrends:string[]
//   },
//
//   interpretation:string[]
// }
//
// ============================================================================


export const mockAIAnalysis = {


  // ==========================================================
  // TRAINEE INFORMATION
  // ==========================================================

  trainee: {

    name:
      "Juan Dela Cruz",

    id:
      "TESDA-2026-00125",

    course:
      "Shielded Metal Arc Welding NC II",

  },



  // ==========================================================
  // AI RESULT SUMMARY
  //
  // Used by:
  // AIResultSummaryCard.jsx
  //
  // ==========================================================

  aiResult: {

    suggestedResult:
      "Competent",


    confidenceScore:
      92,


    recommendation:
      "The trainee demonstrated strong assessment performance and stable cognitive engagement. AI recommends proceeding to final competency validation.",

  },



  // ==========================================================
  // EEG INSIGHTS
  //
  // Visualization:
  //
  // attention  -> Gauge Chart
  // focus      -> Donut Chart
  // engagement -> Bar Chart
  //
  // ==========================================================

  eeg: {


    attention: {

      value:
        91,

    },



    focus: {

      value:
        87,

    },



    engagement: {

      value:
        93,

    },


  },



  // ==========================================================
  // PERFORMANCE PATTERNS
  //
  // Used by:
  // PerformancePatternsCard.jsx
  //
  // ==========================================================

  patterns: {


    strengths: [

      "Maintained consistent attention during practical assessment.",

      "Demonstrated confidence in procedural tasks.",

      "Showed strong concentration during equipment operation.",

    ],



    weaknesses: [

      "Minor decrease in focus during theoretical questioning.",

      "Required additional time for troubleshooting decisions.",

    ],



    notableTrends: [

      "Attention improved throughout the assessment.",

      "Engagement remained stable during practical activities.",

      "Cognitive stability indicates procedural familiarity.",

    ],


  },



  // ==========================================================
  // AI INTERPRETATION
  //
  // Used by:
  // AIInterpretationCard.jsx
  //
  // ==========================================================

  interpretation: [

    "The AI analysis detected stable cognitive engagement throughout the assessment.",


    "EEG measurements showed strong attention and focus during practical activities.",


    "Written assessment results indicate good understanding of procedural concepts.",


    "Minor cognitive fluctuations were observed but did not affect overall performance.",


    "AI recommends proceeding with final competency validation by the assessor.",

  ],


};