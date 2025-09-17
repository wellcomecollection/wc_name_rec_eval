import type { Schema } from "@/amplify/data/resource";
import { useEffect, useRef, useState } from "react";
// canvas-confetti dynamically imported (avoids SSR issues in Next.js)
let fireConfetti: ((opts: any) => void) | null = null;
async function loadConfetti() {
  if (!fireConfetti) {
    try {
      const mod = await import("canvas-confetti");
      fireConfetti = mod.default || (mod as any);
    } catch (e) {
      // Silently fail – animation just won't show
      return null;
    }
  }
  return fireConfetti;
}
import styles from "./EvaluationStatus.module.css";

interface EvaluationStatusProps {
  record: Schema["NameReconciliation"]["type"];
  areAllLabelsEvaluated: boolean;
  totalUsefulRecords: number;
  unevaluatedCount: number;
  userEvaluationCount: number;
  leadingEvaluationCount: number;
  onNextRecord: () => void;
}

export default function EvaluationStatus({
  record,
  areAllLabelsEvaluated,
  totalUsefulRecords,
  unevaluatedCount,
  userEvaluationCount,
  leadingEvaluationCount,
  onNextRecord,
}: EvaluationStatusProps) {
  // Track whether the button has just transitioned from disabled -> enabled to trigger animation
  const [justEnabled, setJustEnabled] = useState(false);
  const prevEnabledRef = useRef<boolean | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const isEnabled = areAllLabelsEvaluated && totalUsefulRecords > 1;

  useEffect(() => {
    const prev = prevEnabledRef.current;
    if (prev === false && isEnabled) {
      // Transitioned from disabled to enabled
      setJustEnabled(true);
      // Fire celebratory confetti respecting reduced motion preference
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (!prefersReducedMotion) {
        loadConfetti().then((confetti) => {
          if (!confetti) return;
          const btn = buttonRef.current;
          if (!btn) return;
          const rect = btn.getBoundingClientRect();
          const vw = window.innerWidth || 1;
          const vh = window.innerHeight || 1;
          // Normalized origins (0 top/left, 1 bottom/right)
          const centerX = (rect.left + rect.width / 2) / vw;
          // Place just above the button (subtract small offset). Clamp to >= 0.
          const y = Math.max(rect.top / vh - 0.02, 0);
          // Side positions relative to button width
          const leftX = (rect.left + rect.width * 0.2) / vw;
          const rightX = (rect.left + rect.width * 0.8) / vw;
          const common = { spread: 60, startVelocity: 42, gravity: 0.9, scalar: 0.9 } as const;
          confetti({ ...common, particleCount: 55, origin: { x: leftX, y } });
          confetti({ ...common, particleCount: 55, origin: { x: rightX, y } });
          // Gentle follow-up burst from center
          setTimeout(() => {
            confetti({
              particleCount: 45,
              spread: 75,
              startVelocity: 30,
              gravity: 0.85,
              scalar: 0.75,
              ticks: 180,
              origin: { x: centerX, y: Math.max(y - 0.01, 0) },
            });
          }, 240);
        });
      }
      // Remove the animation class after it finishes so hover shimmer can run separately
      const timeout = setTimeout(() => setJustEnabled(false), 1400); // > pulseRing duration
      return () => clearTimeout(timeout);
    }
    prevEnabledRef.current = isEnabled;
    if (prev === null) {
      // initialise previous after first render
      prevEnabledRef.current = isEnabled;
    }
  }, [isEnabled]);
  return (
    <div
      style={{
        textAlign: "center",
      }}
    >
      <p
        style={{
          margin: "0 0 20px 0",
          fontSize: "16px",
          color: areAllLabelsEvaluated ? "#28a745" : "#856404",
          fontWeight: "bold",
          backgroundColor: areAllLabelsEvaluated ? "transparent" : "#fff3cd",
          padding: areAllLabelsEvaluated ? "0" : "12px 16px",
          borderRadius: areAllLabelsEvaluated ? "0" : "8px",
          border: areAllLabelsEvaluated ? "none" : "2px solid #ffeaa7",
          textAlign: "center",
        }}
      >
        {areAllLabelsEvaluated
          ? "✓ All labels evaluated! Ready to continue to the next record."
          : "⚠️ Please evaluate all reconciled labels above before continuing."}
      </p>

      <button
        ref={buttonRef}
        onClick={onNextRecord}
        disabled={!isEnabled}
        className={[
          styles.buttonBase,
          isEnabled ? styles.afterEnableHover : undefined,
          justEnabled ? styles.enabledPop : undefined,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          padding: "15px 30px",
          backgroundColor: isEnabled ? "#007bff" : "#f8f9fa",
            // Add a subtle gradient when enabled (without hover) for depth
          backgroundImage: isEnabled
            ? "linear-gradient(180deg, #1994ff 0%, #007bff 70%)"
            : "none",
          color: isEnabled ? "white" : "#6c757d",
          border: isEnabled ? "2px solid #007bff" : "2px solid #dee2e6",
          borderRadius: "8px",
          cursor: isEnabled ? "pointer" : "not-allowed",
          fontWeight: "bold",
          fontSize: "18px",
          transition: "all 0.2s ease",
          position: "relative",
          overflow: "hidden",
        }}
      >
        Next Record →
      </button>

      <p
        style={{
          margin: "15px 0 0 0",
          fontSize: "14px",
          color: "#666",
          textAlign: "center",
          fontStyle: "italic",
        }}
      >
        {(() => {
          if (totalUsefulRecords === 0) {
            return "No useful records to evaluate.";
          }
          if (unevaluatedCount > 0) {
            const plural = unevaluatedCount === 1 ? "record" : "records";
            const percent = Math.round(
              ((totalUsefulRecords - unevaluatedCount) / totalUsefulRecords) *
                100
            );
            return `${unevaluatedCount} of ${totalUsefulRecords} ${plural} left to evaluate (${percent}% complete)`;
          }
          return `🎉 All ${totalUsefulRecords} record${
            totalUsefulRecords === 1 ? "" : "s"
          } have been evaluated!`;
        })()}
      </p>
      <p
        style={{
          margin: "6px 0 0 0",
          fontSize: "13px",
          color: "#444",
          textAlign: "center",
        }}
      >
        You have made {userEvaluationCount} label decision
        {userEvaluationCount === 1 ? "" : "s"}. The leading evaluator has made{" "}
        {leadingEvaluationCount}.
      </p>
    </div>
  );
}
