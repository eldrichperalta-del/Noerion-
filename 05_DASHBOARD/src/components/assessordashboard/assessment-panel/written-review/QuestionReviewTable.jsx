import {
  CheckCircle2,
  XCircle,
} from "lucide-react";

import AssessorPanel from "../../shared/AssessorPanel";

export default function QuestionReviewTable({
  questions = [],
}) {
  return (
    <AssessorPanel title="">
      <div className="overflow-hidden rounded-2xl border border-gray-200">

        {/* Header */}
        <div className="grid grid-cols-12 bg-gray-100 px-6 py-4 text-sm font-semibold text-gray-700 sticky top-0 z-10">
          <div className="col-span-1">
            #
          </div>

          <div className="col-span-4">
            Question
          </div>

          <div className="col-span-2">
            Trainee Answer
          </div>

          <div className="col-span-2">
            Correct Answer
          </div>

          <div className="col-span-2 text-center">
            Result
          </div>

          <div className="col-span-1 text-center">
            System Score
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[450px] overflow-y-auto">
          {questions.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              No questions available.
            </div>
          ) : (
            questions.map((question, index) => {
              const correct =
                question.traineeAnswer ===
                question.correctAnswer;

              return (
                <div
                  key={question.id}
                  className="grid grid-cols-12 items-start border-t border-gray-100 px-6 py-4 transition-colors hover:bg-slate-50"
                >
                  {/* Number */}
                  <div className="col-span-1 pt-1 font-semibold text-[#002f86]">
                    {index + 1}
                  </div>

                  {/* Question */}
                  <div className="col-span-4 pr-5">
                    <p className="font-medium leading-6 text-gray-900">
                      {question.question}
                    </p>
                  </div>

                  {/* Trainee Answer */}
                  <div className="col-span-2 pr-5">
                    <p className="text-sm font-medium leading-6 text-gray-800">
                      {question.traineeAnswer}
                    </p>
                  </div>

                  {/* Correct Answer */}
                  <div className="col-span-2 pr-5">
                    <p className="text-sm font-medium leading-6 text-gray-800">
                      {question.correctAnswer}
                    </p>
                  </div>

                  {/* Result */}
                  <div className="col-span-2 flex justify-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                        correct
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {correct ? (
                        <>
                          <CheckCircle2 size={14} />
                          Correct
                        </>
                      ) : (
                        <>
                          <XCircle size={14} />
                          Incorrect
                        </>
                      )}
                    </span>
                  </div>

                  {/* System Score */}
                  <div className="col-span-1 flex justify-center">
                    <span
                      className={`inline-flex min-w-[60px] justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                        correct
                          ? "bg-blue-100 text-[#002f86]"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {question.score} / {question.points}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AssessorPanel>
  );
}