import { useEffect, useRef } from "react";

export default function EEGWave({
  variant = "landing",
  className = "",
  showBackground = false,
}) {
  const shadowRef = useRef(null);
  const cyanRef = useRef(null);
  const blueRef = useRef(null);

  useEffect(() => {
    let tick = 0;
    let animationFrame;

    const width = 1400;
    const centerY = 180;
    const totalPoints = 100;

    function animate() {
      let shadowPath = "";
      let cyanPath = "";
      let bluePath = "";

      for (let i = 0; i <= totalPoints; i++) {
        const x = (i / totalPoints) * width;
        const fade = Math.sin((i / totalPoints) * Math.PI);
        const edge = Math.pow(fade, 0.45);

        // Movement with slight spikiness
        const wave1 = Math.sin(i * 0.4 + tick * 0.05) * 30 + Math.cos(i * 0.4 - tick * 0.05) * 50;
        const wave2 = Math.sin(i * 0.2 + tick * 0.08) * 40 + Math.cos(i * 0.5 - tick * 0.08) * 60;
        const wave3 = Math.sin(i * 0.15 + tick * 0.04) * 35 + Math.cos(i * 0.3 - tick * 0.04) * 45;

        const shadowY = centerY + (wave1 * edge) + 8;
        const cyanY = centerY + (wave2 * edge);
        const blueY = centerY + (wave3 * edge);

        shadowPath += `${i === 0 ? "M" : "L"} ${x} ${shadowY}`;
        cyanPath += `${i === 0 ? "M" : "L"} ${x} ${cyanY}`;
        bluePath += `${i === 0 ? "M" : "L"} ${x} ${blueY}`;
      }

      if (shadowRef.current) shadowRef.current.setAttribute("d", shadowPath);
      if (cyanRef.current) cyanRef.current.setAttribute("d", cyanPath);
      if (blueRef.current) blueRef.current.setAttribute("d", bluePath);

      tick += 0.8;
      animationFrame = requestAnimationFrame(animate);
    }

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [variant]);

  return (
    <div className={`relative w-full h-full pointer-events-none ${className}`}>
      {showBackground && (
        <>
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-[80px] blur-[350px]" />
          <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/15 blur-[120px]" />
          <div className="absolute -left-[100px] -top-[150px] h-[500px] w-[500px] rounded-full bg-cyan-400/15 blur-[180px]" />
          <div className="absolute -bottom-[200px] -right-[100px] h-[500px] w-[500px] rounded-full bg-purple-500/15 blur-[180px]" />
        </>
      )}

      <svg viewBox="0 0 1400 400" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.30)" strokeWidth="1" />
          </pattern>

          <filter id="glow-scatter-blue" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="22" result="scatterBlur" />
            <feMerge>
              <feMergeNode in="scatterBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-cyan" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur1" />
            <feGaussianBlur stdDeviation="12" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-blue-alt" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur1" />
            <feGaussianBlur stdDeviation="10" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid)" />


        {/* Shadow Path */}
        <g filter="url(#glow-scatter-blue)">
          <path ref={shadowRef} className="stroke-cyan-300/40" strokeWidth="8" strokeLinecap="round" fill="none" />
        </g>

        {/* Main Cyan Path */}
        <g filter="url(#glow-cyan)">
          <path ref={cyanRef} className="stroke-cyan-400" strokeWidth="4" strokeLinecap="round" fill="none" />
        </g>

        {/* Secondary Blue Path */}
        <g filter="url(#glow-blue-alt)">
          <path ref={blueRef} className="stroke-cyan-300" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
      </svg>
      {showBackground && <div className="absolute inset-0 bg-[#040814]/30" />}
    </div>
  );
}