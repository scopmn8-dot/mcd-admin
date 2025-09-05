import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  SmartToy as AIIcon,
  ExpandMore as ExpandMoreIcon,
  Upload as UploadIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AutoFixHigh as AutoFixIcon,
  DataArray as DataIcon,
  TableChart as TableIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';
import { apiFetch } from '../api';

const AIDataMapper = () => {
  const [rawData, setRawData] = useState('');
  const [mappedData, setMappedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [targetSheet, setTargetSheet] = useState('');
  const [columnMapping, setColumnMapping] = useState({});
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [sheets, setSheets] = useState([]);

  // Known column structures for different sheets
  const sheetStructures = {
    'Motorway Jobs': {
      required: ['Job Reference', 'Customer Name', 'Collection Date', 'Delivery Date', 'Collection Address', 'Delivery Address'],
      optional: ['Driver', 'Status', 'Notes', 'Job Type', 'Collection Postcode', 'Delivery Postcode'],
      description: 'Motorway delivery jobs sheet'
    },
    'ATMoves Jobs': {
      required: ['Job Reference', 'Customer Name', 'Collection Date', 'Delivery Date', 'Collection Address', 'Delivery Address'],
      optional: ['Driver', 'Status', 'Notes', 'Job Type', 'Collection Postcode', 'Delivery Postcode'],
      description: 'ATMoves delivery jobs sheet'
    },
    'Private Customer Jobs': {
      required: ['Job Reference', 'Customer Name', 'Collection Date', 'Delivery Date', 'Collection Address', 'Delivery Address'],
      optional: ['Driver', 'Status', 'Notes', 'Job Type', 'Collection Postcode', 'Delivery Postcode'],
      description: 'Private customer delivery jobs sheet'
    },
    'Driver Availability': {
      required: ['Driver Name', 'Date', 'Available'],
      optional: ['Notes', 'Region', 'Preferred Jobs'],
      description: 'Driver availability tracking'
    },
    'Processed Jobs': {
      required: ['Job Reference', 'Driver', 'Status', 'Date Completed'],
      optional: ['Notes', 'Completion Time', 'Customer Feedback'],
      description: 'Completed and processed jobs'
    }
  };

  useEffect(() => {
    // Set available sheets
    setSheets(Object.keys(sheetStructures));
  }, []);

  const analyzeData = () => {
    if (!rawData.trim()) {
      setError('Please paste some data to analyze');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Parse the pasted data (could be CSV, TSV, or Excel format)
      const lines = rawData.trim().split('\n');
      const headers = lines[0].split(/\t|,/).map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => 
        line.split(/\t|,/).map(cell => cell.trim().replace(/"/g, ''))
      );

      // AI-like column detection
      const detectedMapping = detectColumns(headers);
      
      setMappedData({
        headers,
        rows,
        detectedSheet: detectedMapping.suggestedSheet,
        confidence: detectedMapping.confidence,
        mapping: detectedMapping.mapping,
        warnings: detectedMapping.warnings
      });

      setTargetSheet(detectedMapping.suggestedSheet);
      setColumnMapping(detectedMapping.mapping);
      
    } catch (err) {
      setError(`Error parsing data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const detectColumns = (headers) => {
    let bestMatch = { sheet: '', score: 0 };
    const suggestions = {};
    const warnings = [];

    // Score each sheet based on header matches
    Object.entries(sheetStructures).forEach(([sheetName, structure]) => {
      let score = 0;
      const mapping = {};

      headers.forEach((header, index) => {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Check for exact or partial matches
        const allColumns = [...structure.required, ...structure.optional];
        allColumns.forEach(column => {
          const normalizedColumn = column.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          if (normalizedHeader.includes(normalizedColumn) || normalizedColumn.includes(normalizedHeader)) {
            score += structure.required.includes(column) ? 3 : 1;
            mapping[index] = column;
          }
        });

        // Special keyword detection
        if (normalizedHeader.includes('ref') || normalizedHeader.includes('id')) {
          if (sheetName.includes('Jobs') || sheetName === 'Processed Jobs') {
            mapping[index] = 'Job Reference';
            score += 2;
          }
        }
        if (normalizedHeader.includes('driver') || normalizedHeader.includes('name')) {
          if (sheetName === 'Driver Availability' || sheetName === 'Processed Jobs') {
            mapping[index] = sheetName === 'Driver Availability' ? 'Driver Name' : 'Driver';
            score += 2;
          }
        }
        if (normalizedHeader.includes('date') || normalizedHeader.includes('time')) {
          if (normalizedHeader.includes('collect')) {
            mapping[index] = 'Collection Date';
            score += 2;
          } else if (normalizedHeader.includes('deliver')) {
            mapping[index] = 'Delivery Date';
            score += 2;
          }
        }
        if (normalizedHeader.includes('address') || normalizedHeader.includes('location')) {
          if (normalizedHeader.includes('collect') || normalizedHeader.includes('pickup')) {
            mapping[index] = 'Collection Address';
            score += 2;
          } else if (normalizedHeader.includes('deliver') || normalizedHeader.includes('drop')) {
            mapping[index] = 'Delivery Address';
            score += 2;
          }
        }
      });

      suggestions[sheetName] = { score, mapping };
      if (score > bestMatch.score) {
        bestMatch = { sheet: sheetName, score };
      }
    });

    // Generate warnings for missing required fields
    if (bestMatch.sheet) {
      const requiredFields = sheetStructures[bestMatch.sheet].required;
      const mappedFields = Object.values(suggestions[bestMatch.sheet].mapping);
      requiredFields.forEach(field => {
        if (!mappedFields.includes(field)) {
          warnings.push(`Missing required field: ${field}`);
        }
      });
    }

    return {
      suggestedSheet: bestMatch.sheet || 'Motorway Jobs',
      confidence: Math.min(100, Math.round((bestMatch.score / headers.length) * 50)),
      mapping: suggestions[bestMatch.sheet]?.mapping || {},
      warnings
    };
  };

  const handleColumnMappingChange = (headerIndex, targetColumn) => {
    setColumnMapping(prev => ({
      ...prev,
      [headerIndex]: targetColumn
    }));
  };

  const submitToSheet = async () => {
    if (!mappedData || !targetSheet) {
      setError('Please analyze data first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Transform data according to mapping
      const transformedRows = mappedData.rows.map(row => {
        const transformedRow = {};
        Object.entries(columnMapping).forEach(([headerIndex, targetColumn]) => {
          if (targetColumn && row[headerIndex]) {
            transformedRow[targetColumn] = row[headerIndex];
          }
        });
        return transformedRow;
      });

      // Send to backend AI processing endpoint
      const response = await apiFetch('/api/ai-data-import', {
        method: 'POST',
        body: JSON.stringify({
          targetSheet,
          data: transformedRows,
          mapping: columnMapping,
          originalHeaders: mappedData.headers
        })
      });

      setSuccess(`Successfully imported ${transformedRows.length} rows to ${targetSheet}!`);
      setRawData('');
      setMappedData(null);
      
    } catch (err) {
      setError(`Import failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #1e3c72, #2a5298)' }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ color: 'white' }}>
          <AIIcon sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              AI Data Mapper
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Intelligent sheet data parsing and column mapping
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Data Input Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <DataIcon color="primary" />
                <Typography variant="h6">Paste Your Data</Typography>
              </Stack>
              
              <TextField
                fullWidth
                multiline
                minRows={10}
                maxRows={15}
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
                placeholder="Paste your copied sheet data here (CSV, TSV, or Excel format)...

Examples:

📋 For Job Sheets:
Job Reference	Customer Name	Collection Date	Delivery Date	Collection Address	Delivery Address
JOB001	ABC Company	2024-01-15	2024-01-16	123 Main St, London	456 Oak Ave, Birmingham
JOB002	XYZ Ltd	2024-01-16	2024-01-17	789 High St, Manchester	321 Elm Rd, Liverpool

🚗 For Driver Availability:
Driver Name	Date	Available	Notes
John Smith	2024-01-15	Yes	Preferred region: North
Jane Doe	2024-01-16	No	Holiday

✅ For Processed Jobs:
Job Reference	Driver	Status	Date Completed
JOB001	John Smith	Completed	2024-01-15"
                variant="outlined"
                sx={{ mb: 2 }}
              />

              <Button
                variant="contained"
                onClick={analyzeData}
                disabled={loading || !rawData.trim()}
                startIcon={loading ? <RefreshIcon /> : <AutoFixIcon />}
                fullWidth
                sx={{ mb: 2 }}
              >
                {loading ? 'Analyzing...' : 'Analyze Data with AI'}
              </Button>

              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                💡 Supports data copied from Excel, Google Sheets, CSV files, and more
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Results and Mapping Section */}
        <Grid item xs={12} md={6}>
          {mappedData && (
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <TableIcon color="primary" />
                  <Typography variant="h6">AI Analysis Results</Typography>
                  <Chip 
                    label={`${mappedData.confidence}% Confidence`}
                    color={mappedData.confidence > 70 ? 'success' : mappedData.confidence > 40 ? 'warning' : 'error'}
                    size="small"
                  />
                </Stack>

                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    Detected Sheet: <strong>{mappedData.detectedSheet}</strong>
                  </Typography>
                  <Typography variant="body2">
                    {sheetStructures[mappedData.detectedSheet]?.description}
                  </Typography>
                </Alert>

                {mappedData.warnings.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Warnings:</Typography>
                    {mappedData.warnings.map((warning, index) => (
                      <Typography key={index} variant="body2">• {warning}</Typography>
                    ))}
                  </Alert>
                )}

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Target Sheet</InputLabel>
                  <Select
                    value={targetSheet}
                    onChange={(e) => setTargetSheet(e.target.value)}
                    label="Target Sheet"
                  >
                    <MenuItem value="Motorway Jobs">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <span>🛣️</span>
                        <Box>
                          <Typography variant="body2">Motorway Jobs</Typography>
                          <Typography variant="caption" color="text.secondary">Main motorway delivery jobs</Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="ATMoves Jobs">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <span>🏧</span>
                        <Box>
                          <Typography variant="body2">ATMoves Jobs</Typography>
                          <Typography variant="caption" color="text.secondary">ATM relocation jobs</Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="Private Customer Jobs">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <span>👤</span>
                        <Box>
                          <Typography variant="body2">Private Customer Jobs</Typography>
                          <Typography variant="caption" color="text.secondary">Private customer deliveries</Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="Driver Availability">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <span>🚗</span>
                        <Box>
                          <Typography variant="body2">Driver Availability</Typography>
                          <Typography variant="caption" color="text.secondary">Driver schedule and availability</Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="Processed Jobs">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <span>✅</span>
                        <Box>
                          <Typography variant="body2">Processed Jobs</Typography>
                          <Typography variant="caption" color="text.secondary">Completed job records</Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>

                <Typography variant="h6" sx={{ mb: 1 }}>Column Mapping</Typography>
                {mappedData.headers.map((header, index) => (
                  <Box key={index} sx={{ mb: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Source: <strong>{header}</strong>
                    </Typography>
                    <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                      <Select
                        value={columnMapping[index] || ''}
                        onChange={(e) => handleColumnMappingChange(index, e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="">-- Skip Column --</MenuItem>
                        {targetSheet && sheetStructures[targetSheet] && [
                          ...sheetStructures[targetSheet].required,
                          ...sheetStructures[targetSheet].optional
                        ].map(column => (
                          <MenuItem key={column} value={column}>
                            {column} {sheetStructures[targetSheet].required.includes(column) && '*'}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                ))}

                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setPreviewDialogOpen(true)}
                    startIcon={<PreviewIcon />}
                    size="small"
                  >
                    Preview
                  </Button>
                  <Button
                    variant="contained"
                    onClick={submitToSheet}
                    disabled={loading || Object.keys(columnMapping).length === 0}
                    startIcon={<UploadIcon />}
                    sx={{ flex: 1 }}
                  >
                    Import to {targetSheet}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Sheet Structure Reference */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>📊 Sheet Structure Reference</Typography>
          {Object.entries(sheetStructures).map(([sheetName, structure]) => (
            <Accordion key={sheetName}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight="bold">{sheetName}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  {structure.description}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="error">Required Fields:</Typography>
                    {structure.required.map(field => (
                      <Chip key={field} label={field} size="small" sx={{ m: 0.25 }} color="error" variant="outlined" />
                    ))}
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="primary">Optional Fields:</Typography>
                    {structure.optional.map(field => (
                      <Chip key={field} label={field} size="small" sx={{ m: 0.25 }} color="primary" variant="outlined" />
                    ))}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Data Preview</DialogTitle>
        <DialogContent>
          {mappedData && (
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {Object.entries(columnMapping).map(([headerIndex, targetColumn]) => 
                      targetColumn && (
                        <TableCell key={headerIndex}>
                          <Typography variant="subtitle2">{targetColumn}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            (from: {mappedData.headers[headerIndex]})
                          </Typography>
                        </TableCell>
                      )
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mappedData.rows.slice(0, 10).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Object.entries(columnMapping).map(([headerIndex, targetColumn]) => 
                        targetColumn && (
                          <TableCell key={headerIndex}>
                            {row[headerIndex] || '-'}
                          </TableCell>
                        )
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {loading && <LinearProgress sx={{ mt: 2 }} />}
    </Box>
  );
};

export default AIDataMapper;
