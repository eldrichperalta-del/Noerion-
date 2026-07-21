import AssessorPanel from "../shared/AssessorPanel";
import {
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
} from "lucide-react";

export default function PerformancePatternsCard({
    patterns,
}) {

    // ==========================================================
    // BACKEND HANDOFF:
    // Replace the mock "patterns" prop with the AI-generated
    // performance pattern analysis.
    //
    // Expected object:
    //
    // {
    //   strengths: string[],
    //   weaknesses: string[],
    //   notableTrends: string[]
    // }
    // ==========================================================

    return (
        <AssessorPanel>

            <div className="p-6">

                {/* Card Title */}
                <h2 className="mb-8 text-sm font-semibold tracking-wide text-slate-700">
                    PERFORMANCE PATTERNS
                </h2>


                {/* Strengths */}
                <PatternSection
                    icon={
                        <CheckCircle2
                            size={20}
                            className="text-green-600"
                        />
                    }
                    title="Strengths"
                    items={patterns.strengths}
                />


                {/* Weaknesses */}
                <PatternSection
                    icon={
                        <AlertTriangle
                            size={20}
                            className="text-amber-500"
                        />
                    }
                    title="Weaknesses"
                    items={patterns.weaknesses}
                />


                {/* Trends */}
                <PatternSection
                    icon={
                        <TrendingUp
                            size={20}
                            className="text-blue-600"
                        />
                    }
                    title="Notable Trends"
                    items={patterns.notableTrends}
                />

            </div>

        </AssessorPanel>
    );
}


function PatternSection({
    icon,
    title,
    items,
}) {
    return (
        <div className="mb-8">

            <div className="mb-4 flex items-center gap-3">
                {icon}

                <h3 className="font-semibold text-slate-900">
                    {title}
                </h3>
            </div>


            <ul className="space-y-3">

                {items.map((item, index) => (
                    <li
                        key={index}
                        className="flex gap-3 text-sm leading-7 text-slate-700"
                    >
                        <span className="mt-2 h-2 w-2 rounded-full bg-slate-400" />

                        <span>{item}</span>
                    </li>
                ))}

            </ul>

        </div>
    );
}