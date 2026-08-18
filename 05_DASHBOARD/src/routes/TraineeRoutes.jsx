import { Routes, Route } from "react-router-dom";
import TraineeLayout from "../layouts/TraineeLayout";

import Home from "../pages/traineedashboard/Home";
import Assessment from "../pages/traineedashboard/Assessment";

import AssessmentOverview from "../pages/traineedashboard/assessment-workflow/AssessmentOverview";
import Baseline from "../pages/traineedashboard/assessment-workflow/Baseline";
import Prepare from "../pages/traineedashboard/assessment-workflow/Prepare";
import WrittenAssessment from "../pages/traineedashboard/assessment-workflow/WrittenAssessment";

import Results from "../pages/traineedashboard/Results";
import AssessmentSummary from "../pages/traineedashboard/AssessmentSummary";
import Certificates from "../pages/traineedashboard/Certificates";
import ViewCertificate from "../pages/traineedashboard/ViewCertificate";
import Settings from "../pages/traineedashboard/Settings";

export default function TraineeRoutes() {
    return (
        <Routes>

            {/* ==========================================================
                HOME
            ========================================================== */}

            <Route
                path="/"
                element={
                    <TraineeLayout>
                        <Home />
                    </TraineeLayout>
                }
            />

            {/* ==========================================================
                ASSESSMENT DASHBOARD
            ========================================================== */}

            <Route
                path="/assessment"
                element={
                    <TraineeLayout>
                        <Assessment />
                    </TraineeLayout>
                }
            />

            {/* ==========================================================
                ASSESSMENT WORKFLOW

                Pending
                Assessment Overview
                    ↓
                Baseline
                    ↓
                Prepare
                    ↓
                Written Assessment

                Ongoing
                Assessment Overview
                    ↓
                Written Assessment

                Completed
                Assessment Overview
                    ↓
                Results
            ========================================================== */}

            <Route
                path="/assessment/overview"
                element={
                    <TraineeLayout>
                        <AssessmentOverview />
                    </TraineeLayout>
                }
            />

            <Route
                path="/assessment/baseline"
                element={
                    <TraineeLayout>
                        <Baseline />
                    </TraineeLayout>
                }
            />

            <Route
                path="/assessment/prepare"
                element={
                    <TraineeLayout>
                        <Prepare />
                    </TraineeLayout>
                }
            />

            <Route
                path="/assessment/written-assessment"
                element={
                    <TraineeLayout>
                        <WrittenAssessment />
                    </TraineeLayout>
                }
            />

            {/* ==========================================================
                RESULTS
            ========================================================== */}

            <Route
                path="/results"
                element={
                    <TraineeLayout>
                        <Results />
                    </TraineeLayout>
                }
            />

            <Route
                path="/assessment-summary"
                element={
                    <TraineeLayout>
                        <AssessmentSummary />
                    </TraineeLayout>
                }
            />


            {/* ==========================================================
                CERTIFICATES
            ========================================================== */}

            <Route
                path="/certificates"
                element={
                    <TraineeLayout>
                        <Certificates />
                    </TraineeLayout>
                }
            />

            <Route
                path="/certificates/:id"
                element={
                    <TraineeLayout>
                        <ViewCertificate />
                    </TraineeLayout>
                }
            />

            {/* ==========================================================
                PROFILE
            ========================================================== */}

            {/* ==========================================================
                SETTINGS
            ========================================================== */}

            <Route
                path="/settings"
                element={
                    <TraineeLayout>
                        <Settings />
                    </TraineeLayout>
                }
            />

        </Routes>
    );
}
