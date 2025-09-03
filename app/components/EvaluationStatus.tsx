import type { Schema } from "@/amplify/data/resource";

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
        onClick={onNextRecord}
        disabled={!areAllLabelsEvaluated || totalUsefulRecords <= 1}
        style={{
          padding: "15px 30px",
          backgroundColor:
            !areAllLabelsEvaluated || totalUsefulRecords <= 1
              ? "#f8f9fa"
              : "#007bff",
          color:
            !areAllLabelsEvaluated || totalUsefulRecords <= 1
              ? "#6c757d"
              : "white",
          border:
            !areAllLabelsEvaluated || totalUsefulRecords <= 1
              ? "2px solid #dee2e6"
              : "2px solid #007bff",
          borderRadius: "8px",
          cursor:
            !areAllLabelsEvaluated || totalUsefulRecords <= 1
              ? "not-allowed"
              : "pointer",
          fontWeight: "bold",
          fontSize: "18px",
          transition: "all 0.2s ease",
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
