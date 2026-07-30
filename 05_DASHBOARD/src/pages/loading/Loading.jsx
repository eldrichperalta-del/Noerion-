import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import tesdaLogo from "../../assets/tesda.png";
import { supabase } from "../../supabaseClient";

export default function Loading() {
    const navigate = useNavigate();

    const loadingSteps = [
        "Verifying credentials...",
        "Loading user environment...",
        "Synchronizing assessment data...",
        "Preparing dashboard...",
    ];

    const [titleDots, setTitleDots] = useState(0);
    const [currentStep, setCurrentStep] = useState(loadingSteps[0]);
    const [fade, setFade] = useState("opacity-100 scale-100");

    useEffect(() => {
        let isMounted = true;

        // 1. Animated Dots (...)
        const titleInterval = setInterval(() => {
            setTitleDots((prev) => (prev + 1) % 4);
        }, 300);

        // 2. Faster Visual Step Transition
        let stepIdx = 0;
        const stepInterval = setInterval(() => {
            stepIdx = (stepIdx + 1) % loadingSteps.length;
            if (isMounted) {
                setFade("opacity-0");
                setTimeout(() => {
                    setCurrentStep(loadingSteps[stepIdx]);
                    setFade("opacity-100 scale-100");
                }, 150);
            }
        }, 800); // Cycles step every 800ms instead of 1800ms

        // 3. IMMEDIATE DATABASE & ROLE CHECK
        const verifyAndNavigate = async () => {
            const startTime = Date.now();

            try {
                // Get Session
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    if (isMounted) navigate("/");
                    return;
                }

                // Get User Profile & Role
                const { data: profile, error } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", session.user.id)
                    .single();

                if (error || !profile) {
                    console.error("Profile fetch error:", error);
                    if (isMounted) navigate("/");
                    return;
                }

                // Guarantee a minimum display time of 1.2s so the user sees the cool animation
                const elapsedTime = Date.now() - startTime;
                const minDisplayTime = 1200; 
                const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

                setTimeout(() => {
                    if (!isMounted) return;

                    const role = profile.role?.toLowerCase();
                    const privacyAccepted = localStorage.getItem("privacyAccepted");

                    if (role === "admin") {
                        navigate("/admin");
                    } else if (role === "assessor") {
                        navigate("/assessor");
                    } else if (role === "trainee") {
                        if (privacyAccepted === "true") {
                            navigate("/trainee");
                        } else {
                            navigate("/privacy");
                        }
                    } else {
                        navigate("/");
                    }
                }, remainingTime);

            } catch (err) {
                console.error("Auth routing error:", err);
                if (isMounted) navigate("/");
            }
        };

        verifyAndNavigate();

        return () => {
            isMounted = false;
            clearInterval(titleInterval);
            clearInterval(stepInterval);
        };
    }, [navigate]);

    return (
        <main
            className="
                relative min-h-screen overflow-hidden
                flex items-center justify-center
                text-white
                bg-[linear-gradient(135deg,#010816_0%,#031b3d_45%,#020b1b_100%)]
            "
        >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,95,170,0.10),transparent_34%)]" />

            {/* Side Dots */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-[7%] top-[30%] w-2 h-2 rounded-full bg-cyan-300 blur-sm opacity-60" />
                <div className="absolute left-[16%] top-[43%] w-3 h-3 rounded-full bg-cyan-300 blur-sm opacity-40" />
                <div className="absolute left-[5%] top-[62%] w-2 h-2 rounded-full bg-cyan-300 blur-sm opacity-50" />
                <div className="absolute left-[18%] top-[78%] w-3 h-3 rounded-full bg-cyan-300 blur-sm opacity-40" />

                <div className="absolute right-[7%] top-[27%] w-2 h-2 rounded-full bg-cyan-300 blur-sm opacity-60" />
                <div className="absolute right-[16%] top-[41%] w-3 h-3 rounded-full bg-cyan-300 blur-sm opacity-40" />
                <div className="absolute right-[7%] top-[59%] w-2 h-2 rounded-full bg-cyan-300 blur-sm opacity-50" />
                <div className="absolute right-[20%] top-[76%] w-3 h-3 rounded-full bg-cyan-300 blur-sm opacity-40" />
            </div>

            {/* Content */}
            <section className="relative z-10 flex flex-col items-center text-center -translate-y-12 px-6 max-w-xl">
                {/* Logo */}
                <img
                    src={tesdaLogo}
                    alt="TESDA"
                    className="
                        w-[100px]
                        drop-shadow-[0_0_10px_#4baaff]
                        drop-shadow-[0_0_20px_#4baaff]
                    "
                />

                {/* TESDA */}
                <h2 className="mt-5 mb-2 text-[27px] font-extrabold tracking-wider">
                    TESDA
                </h2>

                {/* Agency */}
                <h1 className="text-[clamp(25px,3vw,34px)] font-bold leading-tight mb-6">
                    Technical Education and Skills
                    <br />
                    Development Authority
                </h1>

                {/* Wave */}
                <svg
                    viewBox="0 0 500 120"
                    className="
                        main-wave
                        w-[420px]
                        max-w-[82vw]
                        h-[100px]
                        mb-10
                        drop-shadow-[0_0_10px_#4baaff]
                        drop-shadow-[0_0_20px_#4baaff]
                    "
                >
                    <path d="M20 60 C70 60 70 25 120 60 S170 95 220 60 270 25 320 60 370 95 420 60 460 60 480 60" />
                    <path d="M20 60 C70 60 70 35 120 60 S170 85 220 60 270 35 320 60 370 85 420 60 460 60 480 60" />
                    <path d="M20 60 C70 60 70 15 120 60 S170 105 220 60 270 15 320 60 370 105 420 60 460 60 480 60" />
                    <path d="M20 60 C70 60 70 45 120 60 S170 75 220 60 270 45 320 60 370 75 420 60 460 60 480 60" />
                    <path d="M20 60 C70 60 70 5 120 60 S170 115 220 60 270 5 320 60 370 115 420 60 460 60 480 60" />
                </svg>

                {/* Title */}
                <h2 className="text-[clamp(25px,2.8vw,32px)] font-medium mb-3">
                    Initializing TESDA System{".".repeat(titleDots)}
                </h2>

                {/* Status */}
                <div
                    className={`min-h-[30px] text-[clamp(17px,1.8vw,21px)] text-white/30 font-medium transition-all duration-300 ${fade}`}
                >
                    {currentStep}
                </div>
            </section>

            {/* Footer */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-lg">
                &copy; 2026 NOERION.
            </div>

            {/* Wave Animation */}
            <style>
                {`
                .main-wave path {
                    fill: none;
                    stroke: #69caff;
                    stroke-width: 2;
                    stroke-linecap: round;
                    opacity: .85;
                    stroke-dasharray: 900;
                    stroke-dashoffset: 900;
                    animation: drawWave 2.8s ease-in-out infinite;
                }

                .main-wave path:nth-child(2) {
                    animation-delay: .15s;
                    opacity: .65;
                }

                .main-wave path:nth-child(3) {
                    animation-delay: .3s;
                    opacity: .5;
                }

                .main-wave path:nth-child(4) {
                    animation-delay: .45s;
                    opacity: .4;
                }

                .main-wave path:nth-child(5) {
                    animation-delay: .6s;
                    opacity: .32;
                }

                @keyframes drawWave {
                    0% {
                        stroke-dashoffset: 900;
                        transform: translateX(-10px);
                    }

                    45%, 65% {
                        stroke-dashoffset: 0;
                    }

                    100% {
                        stroke-dashoffset: -900;
                        transform: translateX(10px);
                    }
                }
                `}
            </style>
        </main>
    );
}