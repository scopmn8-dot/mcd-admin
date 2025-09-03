import React, { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";

export default function AddRowModal({ open, onClose, columns, onSubmit }) {
  const [row, setRow] = useState(Array(columns.length).fill(""));
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (idx, value) => {
    setRow(r => {
      const copy = [...r];
      copy[idx] = value;
      return copy;
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit(row);
    setSubmitting(false);
    setRow(Array(columns.length).fill(""));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>Add New Row</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {columns.map((col, idx) => (
            <TextField
              key={col}
              label={col}
              value={row[idx]}
              onChange={e => handleChange(idx, e.target.value)}
              fullWidth
              size="small"
              variant="outlined"
              margin="dense"
              sx={{ flex: '1 1 250px', minWidth: 200 }}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting}>Add</Button>
      </DialogActions>
    </Dialog>
  );
}
