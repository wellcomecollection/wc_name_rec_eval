import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useAuthenticator } from "@aws-amplify/ui-react";

const client = generateClient<Schema>();

export function useNameReconciliation(autoSelectRecord: boolean = true) {
  const { user } = useAuthenticator();
  const [nameReconciliations, setNameReconciliations] = useState<
    Array<Schema["NameReconciliation"]["type"]>
  >([]);
  const [currentRecordIndex, setCurrentRecordIndex] = useState(0);
  const [idxFilter, setIdxFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "evaluated" | "unevaluated"
  >("all");

  function listNameReconciliations() {
    client.models.NameReconciliation.observeQuery().subscribe({
      next: (data) => setNameReconciliations([...data.items]),
    });
  }

  useEffect(() => {
    listNameReconciliations();
  }, []);

  // Filter records by idx substring and evaluation status
  const filteredNameReconciliations = nameReconciliations
    .filter((r) =>
      idxFilter.trim() === ""
        ? true
        : String(r.idx ?? "").includes(idxFilter.trim())
    )
    .filter((r) => {
      const isEvaluated = !!(r.evaluator_id && r.evaluator_id.trim() !== "");
      if (statusFilter === "evaluated") return isEvaluated;
      if (statusFilter === "unevaluated") return !isEvaluated;
      return true; // all
    });

  // Initialize to a random unevaluated useful record when data loads
  useEffect(() => {
    if (
      autoSelectRecord &&
      filteredNameReconciliations.length > 0 &&
      currentRecordIndex === 0
    ) {
      const randomIndex = findRandomUnevaluatedRecord();
      if (randomIndex !== currentRecordIndex) {
        setCurrentRecordIndex(randomIndex);
      }
    }
  }, [nameReconciliations, idxFilter, statusFilter, currentRecordIndex, autoSelectRecord]);

  // Ensure current index remains valid when the filter changes
  useEffect(() => {
    if (currentRecordIndex >= filteredNameReconciliations.length) {
      setCurrentRecordIndex(0);
    }
  }, [idxFilter, statusFilter, nameReconciliations]);

  // When the filter text changes, jump to the first useful match (if any)
  useEffect(() => {
    if (filteredNameReconciliations.length > 0) {
      const firstUseful = findFirstUsefulIndex();
      setCurrentRecordIndex(firstUseful);
    } else {
      setCurrentRecordIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idxFilter, statusFilter]);

  // Helper function to check if a record is useful for evaluation
  const isRecordUseful = (record: Schema["NameReconciliation"]["type"]) => {
    // Parse reconciled_labels
    const reconciledLabels =
      typeof record.reconciled_labels === "string"
        ? JSON.parse(record.reconciled_labels)
        : record.reconciled_labels || [];

    // Skip if reconciled_labels only contains the same idx as the main record
    const filteredLabels = reconciledLabels.filter(
      (reconLabel: any) => reconLabel.idx !== record.idx
    );

    return filteredLabels.length > 0;
  };

  // Find the previous useful record within the filtered set
  function findPreviousUsefulIndex(): number {
    for (let i = currentRecordIndex - 1; i >= 0; i--) {
      if (isRecordUseful(filteredNameReconciliations[i])) {
        return i;
      }
    }
    // If no useful records before current, wrap to end
    for (
      let i = filteredNameReconciliations.length - 1;
      i > currentRecordIndex;
      i--
    ) {
      if (isRecordUseful(filteredNameReconciliations[i])) {
        return i;
      }
    }
    return currentRecordIndex; // Stay on current if no other useful records
  }

  // Find the next useful record within the filtered set
  function findNextUsefulIndex(): number {
    for (
      let i = currentRecordIndex + 1;
      i < filteredNameReconciliations.length;
      i++
    ) {
      if (isRecordUseful(filteredNameReconciliations[i])) {
        return i;
      }
    }
    // If no useful records after current, wrap to beginning
    for (let i = 0; i < currentRecordIndex; i++) {
      if (isRecordUseful(filteredNameReconciliations[i])) {
        return i;
      }
    }
    return currentRecordIndex; // Stay on current if no other useful records
  }

  // Find the first useful record within the filtered set
  function findFirstUsefulIndex(): number {
    for (let i = 0; i < filteredNameReconciliations.length; i++) {
      if (isRecordUseful(filteredNameReconciliations[i])) {
        return i;
      }
    }
    return 0; // Fallback to first record if no useful records found
  }

  // New function to handle individual reconciled label evaluation
  function setReconciledLabelEvaluation(
    recordId: string,
    labelIdx: number,
    result: "yes" | "no" | "unsure" | null
  ) {
    const record = nameReconciliations.find((r) => r.id === recordId);
    if (!record) return;

    // Parse existing evaluations
    const existingEvaluations =
      typeof record.reconciled_labels_evaluations === "string"
        ? JSON.parse(record.reconciled_labels_evaluations || "{}")
        : record.reconciled_labels_evaluations || {};

    // Update the specific label evaluation
    const updatedEvaluations = {
      ...existingEvaluations,
      [labelIdx]: result,
    };

    // Remove the evaluation if it's null (cleared)
    if (result === null) {
      delete updatedEvaluations[labelIdx];
    }

    client.models.NameReconciliation.update({
      id: recordId,
      reconciled_labels_evaluations: JSON.stringify(updatedEvaluations),
    });

    // Update local state immediately for better UX
    setNameReconciliations((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              reconciled_labels_evaluations: JSON.stringify(updatedEvaluations),
            }
          : r
      )
    );
  }

  // Helper function to check if all reconciled labels in a record have been evaluated
  function areAllLabelsEvaluated(
    record: Schema["NameReconciliation"]["type"]
  ): boolean {
    const reconciledLabels =
      typeof record.reconciled_labels === "string"
        ? JSON.parse(record.reconciled_labels)
        : record.reconciled_labels || [];

    // Filter out labels with the same idx as the main record
    const filteredLabels = reconciledLabels.filter(
      (reconLabel: any) => reconLabel.idx !== record.idx
    );

    if (filteredLabels.length === 0) return true; // No labels to evaluate

    const labelEvaluations =
      typeof record.reconciled_labels_evaluations === "string"
        ? JSON.parse(record.reconciled_labels_evaluations || "{}")
        : record.reconciled_labels_evaluations || {};

    // Check if every filtered label has an evaluation
    return filteredLabels.every((reconLabel: any) => {
      const evaluation = labelEvaluations[reconLabel.idx];
      return (
        evaluation === "yes" || evaluation === "no" || evaluation === "unsure"
      );
    });
  }

  // Function to find a random useful record that hasn't been evaluated yet
  function findRandomUnevaluatedRecord(): number {
    // Filter for useful records that don't have an evaluator_id, within the filtered set
    const unevaluatedRecords = filteredNameReconciliations
      .map((record, index) => ({ record, index }))
      .filter(
        ({ record }) =>
          isRecordUseful(record) &&
          (!record.evaluator_id || record.evaluator_id.trim() === "")
      );

    if (unevaluatedRecords.length === 0) {
      // If no unevaluated records, fall back to any useful record
      const usefulRecords = filteredNameReconciliations
        .map((record, index) => ({ record, index }))
        .filter(({ record }) => isRecordUseful(record));

      if (usefulRecords.length === 0) return currentRecordIndex;

      const randomIndex = Math.floor(Math.random() * usefulRecords.length);
      return usefulRecords[randomIndex].index;
    }

    // Randomly select from unevaluated records
    const randomIndex = Math.floor(Math.random() * unevaluatedRecords.length);
    return unevaluatedRecords[randomIndex].index;
  }

  // Function to handle Next Record button press with evaluator ID recording
  async function handleNextRecord() {
    if (!currentRecord || !user?.userId) return;

    try {
      // Update the record with evaluator ID
      await client.models.NameReconciliation.update({
        id: currentRecord.id,
        evaluator_id: user.userId,
      });

      // Update local state
      setNameReconciliations((prev) =>
        prev.map((r) =>
          r.id === currentRecord.id
            ? { ...r, evaluator_id: user.userId || "" }
            : r
        )
      );

      // Move to a random unevaluated record
      setCurrentRecordIndex(findRandomUnevaluatedRecord());
    } catch (error) {
      console.error("Error updating evaluator ID:", error);
      // Still move to next record even if update fails
      setCurrentRecordIndex(findRandomUnevaluatedRecord());
    }
  }

  // Function to handle Submit Evaluation button press (for expert mode)
  async function handleSubmitEvaluation() {
    if (!currentRecord || !user?.userId) return;

    try {
      // Update the record with evaluator ID to mark it as submitted
      await client.models.NameReconciliation.update({
        id: currentRecord.id,
        evaluator_id: user.userId,
      });

      // Update local state
      setNameReconciliations((prev) =>
        prev.map((r) =>
          r.id === currentRecord.id
            ? { ...r, evaluator_id: user.userId || "" }
            : r
        )
      );

      console.log("Evaluation submitted successfully");
    } catch (error) {
      console.error("Error submitting evaluation:", error);
    }
  }

  const currentRecord = filteredNameReconciliations[currentRecordIndex];
  const usefulRecords = filteredNameReconciliations.filter(isRecordUseful);
  const currentRecordUsefulIndex = usefulRecords.findIndex(
    (rec) => rec.id === currentRecord?.id
  );

  const unevaluatedCount = nameReconciliations.filter(
    (record) =>
      isRecordUseful(record) &&
      (!record.evaluator_id || record.evaluator_id.trim() === "")
  ).length;

  return {
    nameReconciliations,
    filteredNameReconciliations,
    currentRecord,
    currentRecordIndex,
    usefulRecords,
    currentRecordUsefulIndex,
    unevaluatedCount,
    setCurrentRecordIndex,
    findPreviousUsefulIndex,
    findNextUsefulIndex,
    findFirstUsefulIndex,
    setReconciledLabelEvaluation,
    areAllLabelsEvaluated,
    handleNextRecord,
    handleSubmitEvaluation,
    isRecordUseful,
    idxFilter,
    setIdxFilter,
    statusFilter,
    setStatusFilter,
  };
}
