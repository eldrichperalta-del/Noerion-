import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import tesdaLogo from "../../assets/tesda.png";
import registerIcon from "../../assets/register.svg";
import eegIcon from "../../assets/eeg.svg";
import examIcon from "../../assets/exam.svg";
import aiIcon from "../../assets/ai.svg";
import certIcon from "../../assets/cert.svg";

import { Brain, Cpu, BadgeCheck } from "lucide-react";

import "../../styles/landing.css";



const featuresData = [
    {
        icon: Brain,
        title: "Cognitive Tracking (EEG)",
        desc: "Capture cognitive load and focus metrics to capture cognitive load and measure focus metrics.",
    },
    {
        icon: Cpu,
        title: "AI Skill Evaluation",
        desc: "Machine learning analysis performance data in the performance data to analyze performance data.",
    },
    {
        icon: BadgeCheck,
        title: "Secure Digital Certification",
        desc: "Immutable digital credentials and hooks immutable digital credentials.",
    },
];

const timelineSteps = [
    { name: "Register", icon: registerIcon },
    { name: "EEG Calibration", icon: eegIcon },
    { name: "Exam", icon: examIcon },
    { name: "AI Analysis", icon: aiIcon },
    { name: "Certification", icon: certIcon },
];



// THEN START THE COMPONENT

export default function Landing() {
    const shadowWaveRef = useRef(null);
    const cyanWaveRef = useRef(null);
    const blueWaveRef = useRef(null);

    useEffect(() => {
        let animationTick = 0;
        let animationFrameId;

        function renderAggressiveWaves() {
            let shadowPath = "";
            let cyanPath = "";
            let blueSecondaryPath = "";

            const canvasWidth = 1400;
            const verticalCenter = 200;
            const resolutionPoints = 100;

            for (let i = 0; i <= resolutionPoints; i++) {
                const x = (i / resolutionPoints) * canvasWidth;

                const continuousVolume =
                    Math.sin((i / resolutionPoints) * Math.PI);

                const edgeFlattener =
                    Math.pow(continuousVolume, 0.35);

                // PRIMARY CYAN SIGNAL

                let cyanSineMix =
                    Math.sin(i * 0.25 + animationTick * 0.14) *
                    45;

                let cyanSpikeMix =
                    Math.cos(i * 0.65 - animationTick * 0.22) *
                    Math.abs(Math.sin(i * 0.15)) *
                    125;

                let cyanPointedModifier =
                    Math.abs(
                        Math.sin(i * 0.4 + animationTick * 0.1)
                    ) * 30;

                let cyanY =
                    verticalCenter +
                    (
                        cyanSineMix +
                        cyanSpikeMix -
                        cyanPointedModifier
                    ) *
                    edgeFlattener;

                cyanPath += `${i === 0 ? "M" : "L"} ${x} ${cyanY}`;

                // SHADOW SIGNAL

                let shadowSineMix =
                    Math.sin(
                        i * 0.25 +
                        (animationTick - 5) * 0.13
                    ) * 47;

                let shadowSpikeMix =
                    Math.cos(
                        i * 0.65 -
                        (animationTick - 5) * 0.21
                    ) *
                    Math.abs(Math.sin(i * 0.15)) *
                    120;

                let shadowPointedModifier =
                    Math.abs(
                        Math.sin(
                            i * 0.4 +
                            (animationTick - 5) * 0.1
                        )
                    ) * 28;

                let shadowY =
                    verticalCenter +
                    6 +
                    (
                        shadowSineMix +
                        shadowSpikeMix -
                        shadowPointedModifier
                    ) *
                    edgeFlattener;

                shadowPath += `${i === 0 ? "M" : "L"} ${x} ${shadowY}`;

                // SECONDARY BLUE SIGNAL

                let blueAltSineMix =
                    Math.sin(
                        i * 0.18 -
                        animationTick * 0.09
                    ) * 55;

                let blueAltSpikeMix =
                    Math.sin(
                        i * 0.52 +
                        animationTick * 0.18
                    ) *
                    Math.cos(i * 0.12) *
                    95;

                let blueAltPointedModifier =
                    Math.abs(
                        Math.cos(
                            i * 0.35 -
                            animationTick * 0.15
                        )
                    ) * 25;

                let blueSecondaryY =
                    verticalCenter +
                    (
                        blueAltSineMix +
                        blueAltSpikeMix +
                        blueAltPointedModifier
                    ) *
                    edgeFlattener;

                blueSecondaryPath += `${i === 0 ? "M" : "L"} ${x} ${blueSecondaryY}`;
            }

            shadowWaveRef.current?.setAttribute("d", shadowPath);
            cyanWaveRef.current?.setAttribute("d", cyanPath);
            blueWaveRef.current?.setAttribute("d", blueSecondaryPath);

            animationTick++;

            animationFrameId =
                requestAnimationFrame(renderAggressiveWaves);
        }

        renderAggressiveWaves();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, []);


    return (
        <div className="bg-[#030712] text-white font-sans antialiased overflow-x-hidden">

            {/* NAVBAR */}
            <nav className="fixed top-0 w-full z-50 bg-[#030712]/70 backdrop-blur-md border-b border-white/5 px-6 md:px-12 py-4 flex justify-between items-center">

                <div className="text-xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white">
                    NOERION
                </div>

                <div className="hidden md:flex space-x-14 text-sm font-medium text-gray-400">
                    <a href="#features" className="hover:text-cyan-400 transition-colors duration-300">
                        Features
                    </a>

                    <a href="#how-it-works" className="hover:text-cyan-400 transition-colors duration-300">
                        How it Works
                    </a>

                    <a href="#institution" className="hover:text-cyan-400 transition-colors duration-300">
                        Institution
                    </a>
                </div>

                <Link
                    to="/login"
                    className="border border-cyan-400/50 text-cyan-400 text-xs font-semibold px-5 py-2 rounded-full hover:bg-cyan-400 hover:text-gray-900 shadow-[0_0_15px_rgba(0,242,254,0.2)] transition-all duration-300"
                >
                    Login / Request Access
                </Link>
            </nav>

            {/* HERO */}
            <section
                id="hero"
                className="min-h-screen pt-28 pb-16 px-6 flex flex-col items-center justify-start text-center relative overflow-hidden"
            >

                <div className="absolute inset-0 w-full h-full pointer-events-none z-0">

                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-400/5 rounded-full blur-[120px]" />

                    <div className="absolute top-[400px] left-[-100px] w-[600px] h-[600px] bg-cyan-400/5 rounded-full blur-[150px]" />

                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,24,48,0.4)_0%,transparent_70%)]" />

                    <div className="absolute -left-20 top-1/4 w-96 h-96 bg-cyan-400/5 rounded-full blur-[100px]" />

                    {/* SVG WAVE */}

                    <div className="absolute top-[75%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[400px] mix-blend-screen opacity-90">

                        <svg
                            className="w-full h-full"
                            viewBox="0 0 1400 400"
                            preserveAspectRatio="none"
                            fill="none"
                        >

                            <defs>

                                <filter id="glow-cyan">
                                    <feGaussianBlur stdDeviation="6" result="blur1" />
                                    <feGaussianBlur stdDeviation="12" result="blur2" />

                                    <feMerge>
                                        <feMergeNode in="blur2" />
                                        <feMergeNode in="blur1" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>

                                <filter id="glow-blue-alt">
                                    <feGaussianBlur stdDeviation="5" result="blur1" />
                                    <feGaussianBlur stdDeviation="10" result="blur2" />

                                    <feMerge>
                                        <feMergeNode in="blur2" />
                                        <feMergeNode in="blur1" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>

                                <filter id="glow-scatter-blue">
                                    <feGaussianBlur stdDeviation="22" result="scatterBlur" />

                                    <feMerge>
                                        <feMergeNode in="scatterBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>

                            </defs>

                            <g filter="url(#glow-scatter-blue)">
                                <path
                                    ref={shadowWaveRef}
                                    className="stroke-cyan-300/40"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            </g>

                            <g filter="url(#glow-cyan)">
                                <path
                                    ref={cyanWaveRef}
                                    className="stroke-cyan-400"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            </g>

                            <g filter="url(#glow-blue-alt)">
                                <path
                                    ref={blueWaveRef}
                                    className="stroke-cyan-300"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            </g>

                        </svg>

                    </div>
                </div>

                <div className="w-full flex flex-col items-center flex-1 relative z-20">

                    <div className="max-w-5xl mx-auto flex flex-col items-center mt-4 mb-6">

                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 leading-tight max-w-4xl">
                            Measure Skills
                            <br className="hidden sm:inline" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300">
                                Beyond Scores
                            </span>
                        </h1>

                        <p className="text-gray-400 text-sm sm:text-base tracking-wide max-w-2xl mb-8 font-light">
                            EEG + AI + Secure Digital Certification for Smarter Evaluation
                        </p>

                        <div className="flex flex-wrap justify-center gap-4">

                            <button className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-white font-bold px-8 py-3 rounded-full hover:opacity-90 shadow-[0_0_25px_rgba(0,242,254,0.45)] transition-all">
                                Get Started
                            </button>

                            <Link to="/certificate-verification" className="bg-transparent border border-gray-700 text-gray-300 font-semibold px-8 py-3 rounded-full hover:border-cyan-400/50 hover:text-cyan-400 transition-all">
                                Verify Certificate
                            </Link>

                        </div>

                        <div className="w-full min-h-[340px] relative mt-auto flex items-center justify-center">

                            <div className="relative w-full max-w-2xl h-[280px] border border-white/10 rounded-2xl bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none overflow-hidden shadow-[2px_4px_24px_rgba(0,0,0,0.6)]">

                                <div
                                    className="absolute inset-0 opacity-[0.04]"
                                    style={{
                                        backgroundImage:
                                            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                                        backgroundSize: "30px 30px",
                                    }}
                                />

                            </div>

                        </div>

                    </div>

                </div>

            </section>

            {/* FEATURES */}
            <section
                id="features"
                className="scroll-mt-24 py-24 px-6 max-w-6xl mx-auto relative z-10"
            >
                <h2 className="text-center text-3xl font-bold mb-16 tracking-wide">
                    Features
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {featuresData.map((feature, index) => {
                        const Icon = feature.icon;

                        return (
                            <div
                                key={index}
                                className="
                        group
                        glass-panel
                        border border-white/5
                        rounded-3xl
                        p-10
                        text-left

                        transition-all
                        duration-300

                        hover:border-cyan-400/40
                        hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]
                        hover:-translate-y-2
                    "
                            >
                                {/* ICON BOX */}
                                <div
                                    className="
                            w-14 h-14
                            rounded-2xl

                            bg-cyan-400/10
                            border border-cyan-400/20

                            flex items-center justify-center

                            mb-8

                            transition-all
                            duration-300

                            group-hover:bg-cyan-400
                            group-hover:shadow-[0_0_20px_rgba(34,211,238,0.5)]
                        "
                                >
                                    <Icon
                                        size={28}
                                        className="
                                text-cyan-400
                                transition-all
                                duration-300

                                group-hover:text-[#030712]
                            "
                                    />
                                </div>

                                <h3 className="text-xl font-bold text-white mb-4">
                                    {feature.title}
                                </h3>

                                <p className="text-gray-400 leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section
                id="how-it-works"
                className="scroll-mt-24 py-24 px-6 max-w-5xl mx-auto relative z-10"
            >
                <h2 className="text-center text-3xl font-bold mb-20 tracking-wide">
                    How it Works
                </h2>

                <div className="relative">
                    <div className="absolute top-8 left-0 w-full h-[2px] bg-cyan-400/30 hidden md:block" />

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 relative z-10">
                        {timelineSteps.map((step, index) => (
                            <div
                                key={index}
                                className="group flex flex-col items-center text-center cursor-pointer"
                            >
                                {/* CIRCLE */}
                                <div
                                    className="
                                    w-14 h-14
                                    md:w-16 md:h-16
                                    lg:w-18 lg:h-18

                                    bg-[#0a0c16]
                                    border border-cyan-400/30
                                    rounded-full

                                    flex items-center justify-center
                                    mb-4

                                    transition-all duration-300 ease-out

                                    group-hover:scale-125
                                    group-hover:border-cyan-400
                                    group-hover:shadow-[0_0_25px_rgba(34,211,238,0.6)]
                                    "
                                >
                                    {/* ICON */}
                                    <img
                                        src={step.icon}
                                        alt={step.name}
                                        className="
                                        w-6 h-6
                                        md:w-7 md:h-7

                                        transition-all duration-300 ease-out

                                        group-hover:scale-125
                                        "
                                    />
                                </div>

                                {/* LABEL */}
                                <span className="
                                    text-xs font-semibold tracking-wider text-gray-400
                                    transition-all duration-300
                                    group-hover:text-cyan-400
                                    group-hover:scale-110
                                    ">
                                    {step.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section
                id="institution"
                className="scroll-mt-24 py-24 px-6 max-w-5xl mx-auto relative z-10"
            >
                <h2 className="text-center text-3xl font-bold mb-16 tracking-wide">
                    Institution
                </h2>

                <div className="glass-panel rounded-3xl p-10 flex flex-col items-center">

                    <img
                        src={tesdaLogo}
                        alt="TESDA Logo"
                        className="w-40 h-40 object-contain mx-auto mb-6 tesda-logo-glow"
                    />

                    <h3 className="text-4xl font-extrabold text-white mb-4">
                        TESDA
                    </h3>

                    <p className="text-xl md:text-2xl font-bold text-gray-200 max-w-3xl">
                        Technical Education and Skills Development Authority
                    </p>

                </div>
            </section>

            <footer className="border-t border-white/5 py-12 px-6 max-w-6xl mx-auto text-xs text-gray-600 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>© 2026 NOERION. All rights reserved.</div>

                <div className="flex gap-8">
                    <a href="#">About NOERION</a>
                    <a href="#">Contact</a>
                    <a href="#">Support</a>
                </div>
            </footer>

        </div>
    );
}
