"use client";

import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { useNameReconciliation } from "./components/useNameReconciliation";
import Header from "./components/Header";
import RecordDisplay from "./components/RecordDisplay";
import ReconciledLabelsEvaluator from "./components/ReconciledLabelsEvaluator";
import EvaluationStatus from "./components/EvaluationStatus";
import UserInfo from "./components/UserInfo";
import "./app.css";

Amplify.configure(outputs);

export default function App() {
  const {
    nameReconciliations,
    currentRecord,
    usefulRecords,
    unevaluatedCount,
  userEvaluationCount,
  leadingEvaluationCount,
    setReconciledLabelEvaluation,
    areAllLabelsEvaluated,
    handleNextRecord,
  } = useNameReconciliation();

  return (
    <main>
      <Header isExpertMode={false} />

      <div style={{ marginTop: "20px" }}>
        {nameReconciliations.length === 0 ? (
          <p>No name reconciliation records found.</p>
        ) : (
          <>
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
                />

                <EvaluationStatus
                  record={currentRecord}
                  areAllLabelsEvaluated={areAllLabelsEvaluated(currentRecord)}
                  totalUsefulRecords={usefulRecords.length}
                  unevaluatedCount={unevaluatedCount}
                  userEvaluationCount={userEvaluationCount}
                  leadingEvaluationCount={leadingEvaluationCount}
                  onNextRecord={handleNextRecord}
                />
              </div>
            )}
          </>
        )}
      </div>

      <UserInfo />
    </main>
  );
}
