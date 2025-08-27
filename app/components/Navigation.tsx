interface NavigationProps {
  currentRecordUsefulIndex: number;
  totalUsefulRecords: number;
  onPrevious: () => void;
  onNext: () => void;
  areAllLabelsEvaluated: boolean;
}

export default function Navigation({
  currentRecordUsefulIndex,
  totalUsefulRecords,
  onPrevious,
  onNext,
  areAllLabelsEvaluated,
}: NavigationProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        padding: "10px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <div>
        <h3 style={{ margin: 0 }}>
          Record {currentRecordUsefulIndex + 1} of {totalUsefulRecords}
        </h3>
        <p style={{ margin: "5px 0 0 0", color: "#666" }}>
          Evaluate each reconciled label individually
        </p>
        <p
          style={{
            margin: "5px 0 0 0",
            fontSize: "12px",
            color: areAllLabelsEvaluated ? "#28a745" : "#dc3545",
            fontWeight: "bold",
          }}
        >
          {areAllLabelsEvaluated
            ? "✓ All labels evaluated"
            : "⚠ Evaluation incomplete"}
        </p>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={onPrevious}
          disabled={totalUsefulRecords <= 1}
          style={{
            padding: "8px 12px",
            backgroundColor: totalUsefulRecords <= 1 ? "#f8f9fa" : "#007bff",
            color: totalUsefulRecords <= 1 ? "#6c757d" : "white",
            border: "none",
            borderRadius: "4px",
            cursor: totalUsefulRecords <= 1 ? "not-allowed" : "pointer",
          }}
        >
          ← Previous
        </button>
        <button
          onClick={onNext}
          disabled={totalUsefulRecords <= 1}
          style={{
            padding: "8px 12px",
            backgroundColor: totalUsefulRecords <= 1 ? "#f8f9fa" : "#007bff",
            color: totalUsefulRecords <= 1 ? "#6c757d" : "white",
            border: "none",
            borderRadius: "4px",
            cursor: totalUsefulRecords <= 1 ? "not-allowed" : "pointer",
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
