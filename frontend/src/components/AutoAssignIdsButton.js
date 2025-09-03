import React, { useState } from "react";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

export default function AutoAssignIdsButton() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleClick = async () => {
    setLoading(true);
    setSuccess("");
    setError("");
    try {
  const res = await fetch("http://localhost:3001/api/jobs/auto-assign-ids", {
        method: "POST"
      });
      if (res.ok) {
        setSuccess("Job, cluster, and order IDs assigned successfully.");
      } else {
        const err = await res.json();
        setError(err.error || "Error assigning IDs");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <Button variant="contained" color="secondary" onClick={handleClick} disabled={loading}>
        {loading ? "Assigning IDs..." : "Auto-Assign Job/Cluster/Order IDs"}
      </Button>
      {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </div>
  );
}
