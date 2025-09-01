"use client";

import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { useNameReconciliation } from "../components/useNameReconciliation";
import Header from "../components/Header";
import Navigation from "../components/Navigation";
import RecordDisplay from "../components/RecordDisplay";
import ReconciledLabelsEvaluator from "../components/ReconciledLabelsEvaluator";
import CandidatesViewer from "../components/CandidatesViewer";
import EvaluationStatus from "../components/EvaluationStatus";
import UserInfo from "../components/UserInfo";
import "../app.css";

Amplify.configure(outputs);

export default function ExpertApp() {
  const {
    nameReconciliations,
    filteredNameReconciliations,
    currentRecord,
    currentRecordUsefulIndex,
    usefulRecords,
    unevaluatedCount,
    setCurrentRecordIndex,
    findPreviousUsefulIndex,
    findNextUsefulIndex,
    findFirstUsefulIndex,
    setReconciledLabelEvaluation,
    areAllLabelsEvaluated,
    handleNextRecord,
    handleSubmitEvaluation,
    idxFilter,
    setIdxFilter,
  } = useNameReconciliation(false);

  return (
    <main>
      <Header isExpertMode={true} />

      <div style={{ marginTop: "20px" }}>
        {/* Determine safe list length to avoid undefined access during hydration */}
        {(() => null)()}
        {/* idx filter input */}
        <div style={{ maxWidth: "800px", margin: "0 auto 16px auto" }}>
          <input
            type="text"
            value={idxFilter}
            onChange={(e) => setIdxFilter(e.target.value)}
            placeholder="Filter by idx (substring match)"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          />
          {idxFilter && (
            <div style={{ marginTop: "6px", fontSize: "12px", color: "#666" }}>
              Showing {(filteredNameReconciliations?.length ?? nameReconciliations.length)} of {nameReconciliations.length} records
            </div>
          )}
        </div>

        {(filteredNameReconciliations?.length ?? nameReconciliations.length) === 0 ? (
          <p>No name reconciliation records found.</p>
        ) : !currentRecord ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ marginBottom: "20px", fontSize: "16px" }}>
              Welcome to Expert Mode. Use the navigation controls to select a record to evaluate.
            </p>
            <button
              onClick={() => setCurrentRecordIndex(findFirstUsefulIndex())}
              style={{
                padding: "12px 24px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              Start with First Record
            </button>
          </div>
        ) : (
          <>
            <Navigation
              currentRecordUsefulIndex={currentRecordUsefulIndex}
              totalUsefulRecords={usefulRecords.length}
              onPrevious={() =>
                setCurrentRecordIndex(findPreviousUsefulIndex())
              }
              onNext={() => setCurrentRecordIndex(findNextUsefulIndex())}
              areAllLabelsEvaluated={
                currentRecord ? areAllLabelsEvaluated(currentRecord) : false
              }
            />

            {currentRecord && (
              <div
                style={{
                  border: "2px solid #ccc",
                  padding: "25px",
                  borderRadius: "8px",
                  backgroundColor: "#fafafa",
                  maxWidth: "800px",
                  margin: "0 auto",
                }}
              >
                <RecordDisplay record={currentRecord} />

                <ReconciledLabelsEvaluator
                  record={currentRecord}
                  onEvaluate={setReconciledLabelEvaluation}
                  isExpertMode={true}
                />

                {/* Submit Evaluation Button */}
                <div style={{ marginTop: "20px", textAlign: "center" }}>
                  <button
                    onClick={handleSubmitEvaluation}
                    disabled={!areAllLabelsEvaluated(currentRecord)}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: areAllLabelsEvaluated(currentRecord)
                        ? "#28a745"
                        : "#f8f9fa",
                      color: areAllLabelsEvaluated(currentRecord)
                        ? "white"
                        : "#6c757d",
                      border: "none",
                      borderRadius: "6px",
                      cursor: areAllLabelsEvaluated(currentRecord)
                        ? "pointer"
                        : "not-allowed",
                      fontWeight: "bold",
                      fontSize: "16px",
                      minWidth: "160px",
                      boxShadow: areAllLabelsEvaluated(currentRecord)
                        ? "0 2px 4px rgba(0,0,0,0.1)"
                        : "none",
                    }}
                  >
                    Submit Evaluation
                  </button>
                  {!areAllLabelsEvaluated(currentRecord) && (
                    <p
                      style={{
                        margin: "8px 0 0 0",
                        fontSize: "14px",
                        color: "#dc3545",
                        fontStyle: "italic",
                      }}
                    >
                      Complete all label evaluations to submit
                    </p>
                  )}
                </div>

                {/* Evaluator ID Display */}
                <div style={{ marginTop: "20px", marginBottom: "20px" }}>
                  <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>
                    Evaluator ID:
                  </h4>
                  <div
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      backgroundColor: currentRecord.evaluator_id
                        ? "#e6fffa"
                        : "#fff3cd",
                      padding: "10px",
                      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div style={{ fontSize: "14px" }}>
                      {currentRecord.evaluator_id ? (
                        <span
                          style={{ color: "#2d3748", fontFamily: "monospace" }}
                        >
                          {currentRecord.evaluator_id}
                        </span>
                      ) : (
                        <span style={{ color: "#975a16", fontStyle: "italic" }}>
                          Not yet evaluated
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <CandidatesViewer record={currentRecord} />
              </div>
            )}
          </>
        )}
      </div>

      <UserInfo />
    </main>
  );
}
