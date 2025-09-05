import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
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
  Visibility as PreviewIcon,
  CloudUpload as CloudUploadIcon,
  ContentPaste as ContentPasteIcon
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
  const [realHeaders, setRealHeaders] = useState({});
  const [loadingHeaders, setLoadingHeaders] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadMode, setUploadMode] = useState('paste'); // 'paste' or 'upload'

  // Known column structures for different sheets - using real Google Sheets headers
  const sheetStructures = {
    'Motorway Jobs': {
      required: ['job_id', 'VRM', 'collection_date', 'delivery_date', 'collection_full_address', 'delivery_full_address'],
      optional: ['date_time_created', 'dealer', 'date_time_assigned', 'collection_postcode', 'collection_town_city', 'collection_address_1', 'collection_address_2', 'collection_contact_first_name', 'collection_contact_surname', 'collection_email', 'collection_phone_number', 'preferred_seller_collection_dates', 'delivery_postcode', 'delivery_town_city', 'delivery_address_1', 'delivery_address_2', 'delivery_contact_first_name', 'delivery_contact_surname', 'delivery_email', 'delivery_phone_number', 'job_type', 'distance', 'vehicle_year', 'vehicle_gearbox', 'vehicle_fuel', 'vehicle_colour', 'vehicle_vin', 'vehicle_mileage'],
      description: 'Motorway delivery jobs sheet with vehicle details'
    },
    'ATMoves Jobs': {
      required: ['job_id', 'VRM', 'collection_date', 'delivery_date', 'collection_full_address', 'delivery_full_address'],
      optional: ['date_time_created', 'dealer', 'date_time_assigned', 'collection_postcode', 'collection_town_city', 'collection_address_1', 'collection_address_2', 'collection_contact_first_name', 'collection_contact_surname', 'collection_email', 'collection_phone_number', 'preferred_seller_collection_dates', 'delivery_postcode', 'delivery_town_city', 'delivery_address_1', 'delivery_address_2', 'delivery_contact_first_name', 'delivery_contact_surname', 'delivery_email', 'delivery_phone_number', 'job_type', 'distance', 'vehicle_year', 'vehicle_gearbox', 'vehicle_fuel', 'vehicle_colour', 'vehicle_vin', 'vehicle_mileage'],
      description: 'ATMoves delivery jobs sheet with vehicle details'
    },
    'Private Customer Jobs': {
      required: ['job_id', 'VRM', 'collection_date', 'delivery_date', 'collection_full_address', 'delivery_full_address'],
      optional: ['date_time_created', 'dealer', 'date_time_assigned', 'collection_postcode', 'collection_town_city', 'collection_address_1', 'collection_address_2', 'collection_contact_first_name', 'collection_contact_surname', 'collection_email', 'collection_phone_number', 'preferred_seller_collection_dates', 'delivery_postcode', 'delivery_town_city', 'delivery_address_1', 'delivery_address_2', 'delivery_contact_first_name', 'delivery_contact_surname', 'delivery_email', 'delivery_phone_number', 'job_type', 'distance', 'vehicle_year', 'vehicle_gearbox', 'vehicle_fuel', 'vehicle_colour', 'vehicle_vin', 'vehicle_mileage'],
      description: 'Private customer delivery jobs sheet with vehicle details'
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

  // Fetch real headers when target sheet changes
  useEffect(() => {
    if (targetSheet) {
      fetchRealHeaders(targetSheet);
    }
  }, [targetSheet]);

  const fetchRealHeaders = async (sheetType) => {
    setLoadingHeaders(true);
    try {
      // Map display names to API sheet types
      const sheetTypeMap = {
        'Motorway Jobs': 'motorway',
        'ATMoves Jobs': 'atmoves', 
        'Private Customer Jobs': 'privateCustomers',
        'Driver Availability': 'drivers',
        'Processed Jobs': 'processedJobs'
      };

      const apiSheetType = sheetTypeMap[sheetType];
      if (!apiSheetType) {
        console.error('Unknown sheet type:', sheetType);
        return;
      }

      const response = await apiFetch(`/api/sheets/${apiSheetType}/headers`);
      
      setRealHeaders(prev => ({
        ...prev,
        [sheetType]: response.headers || []
      }));

    } catch (error) {
      console.error('Error fetching headers:', error);
      setError(`Failed to fetch headers for ${sheetType}: ${error.message}`);
    } finally {
      setLoadingHeaders(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/tab-separated-values'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv|tsv)$/i)) {
      alert('Please upload a valid Excel (.xlsx, .xls) or CSV file');
      return;
    }

    setUploadedFile(file);
    
    // Parse the file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        let parsedData = '';
        
        if (file.type.includes('csv') || file.name.toLowerCase().endsWith('.csv')) {
          // Handle CSV files
          parsedData = data;
        } else if (file.name.toLowerCase().endsWith('.tsv')) {
          // Handle TSV files
          parsedData = data;
        } else if (file.type.includes('sheet') || file.name.match(/\.xlsx?$/i)) {
          // Handle Excel files using xlsx library
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to CSV format
          parsedData = XLSX.utils.sheet_to_csv(worksheet);
        } else {
          parsedData = data; // Assume tab-separated or similar
        }
        
        setRawData(parsedData);
        setUploadMode('upload');
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Error parsing file. Please check the file format.');
        setUploadedFile(null);
      }
    };
    
    // Read file appropriately based on type
    if (file.type.includes('csv') || file.name.toLowerCase().endsWith('.csv') || 
        file.name.toLowerCase().endsWith('.tsv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  // Reset upload
  const resetUpload = () => {
    setUploadedFile(null);
    setUploadMode('paste');
    setRawData('');
  };

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

        // Special keyword detection for vehicle transport industry
        if (normalizedHeader.includes('job') && (normalizedHeader.includes('id') || normalizedHeader.includes('ref'))) {
          if (sheetName.includes('Jobs') || sheetName === 'Processed Jobs') {
            mapping[index] = 'job_id';
            score += 3;
          }
        }
        if (normalizedHeader.includes('vrm') || normalizedHeader.includes('registration')) {
          if (sheetName.includes('Jobs')) {
            mapping[index] = 'VRM';
            score += 3;
          }
        }
        if (normalizedHeader.includes('dealer') || normalizedHeader.includes('dealership')) {
          if (sheetName.includes('Jobs')) {
            mapping[index] = 'dealer';
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
            mapping[index] = 'collection_date';
            score += 3;
          } else if (normalizedHeader.includes('deliver')) {
            mapping[index] = 'delivery_date';
            score += 3;
          } else if (normalizedHeader.includes('created')) {
            mapping[index] = 'date_time_created';
            score += 2;
          } else if (normalizedHeader.includes('assigned')) {
            mapping[index] = 'date_time_assigned';
            score += 2;
          }
        }
        if (normalizedHeader.includes('address') || normalizedHeader.includes('location')) {
          if (normalizedHeader.includes('collect') || normalizedHeader.includes('pickup')) {
            if (normalizedHeader.includes('full')) {
              mapping[index] = 'collection_full_address';
              score += 3;
            } else if (normalizedHeader.includes('1')) {
              mapping[index] = 'collection_address_1';
              score += 2;
            } else if (normalizedHeader.includes('2')) {
              mapping[index] = 'collection_address_2';
              score += 2;
            } else {
              mapping[index] = 'collection_full_address';
              score += 2;
            }
          } else if (normalizedHeader.includes('deliver') || normalizedHeader.includes('drop')) {
            if (normalizedHeader.includes('full')) {
              mapping[index] = 'delivery_full_address';
              score += 3;
            } else if (normalizedHeader.includes('1')) {
              mapping[index] = 'delivery_address_1';
              score += 2;
            } else if (normalizedHeader.includes('2')) {
              mapping[index] = 'delivery_address_2';
              score += 2;
            } else {
              mapping[index] = 'delivery_full_address';
              score += 2;
            }
          }
        }
        if (normalizedHeader.includes('postcode') || normalizedHeader.includes('postal')) {
          if (normalizedHeader.includes('collect')) {
            mapping[index] = 'collection_postcode';
            score += 2;
          } else if (normalizedHeader.includes('deliver')) {
            mapping[index] = 'delivery_postcode';
            score += 2;
          }
        }
        if (normalizedHeader.includes('contact') || normalizedHeader.includes('phone') || normalizedHeader.includes('email')) {
          if (normalizedHeader.includes('collect')) {
            if (normalizedHeader.includes('first') || normalizedHeader.includes('fname')) {
              mapping[index] = 'collection_contact_first_name';
              score += 2;
            } else if (normalizedHeader.includes('surname') || normalizedHeader.includes('last')) {
              mapping[index] = 'collection_contact_surname';
              score += 2;
            } else if (normalizedHeader.includes('email')) {
              mapping[index] = 'collection_email';
              score += 2;
            } else if (normalizedHeader.includes('phone')) {
              mapping[index] = 'collection_phone_number';
              score += 2;
            }
          } else if (normalizedHeader.includes('deliver')) {
            if (normalizedHeader.includes('first') || normalizedHeader.includes('fname')) {
              mapping[index] = 'delivery_contact_first_name';
              score += 2;
            } else if (normalizedHeader.includes('surname') || normalizedHeader.includes('last')) {
              mapping[index] = 'delivery_contact_surname';
              score += 2;
            } else if (normalizedHeader.includes('email')) {
              mapping[index] = 'delivery_email';
              score += 2;
            } else if (normalizedHeader.includes('phone')) {
              mapping[index] = 'delivery_phone_number';
              score += 2;
            }
          }
        }
        if (normalizedHeader.includes('vehicle') || normalizedHeader.includes('car')) {
          if (normalizedHeader.includes('year')) {
            mapping[index] = 'vehicle_year';
            score += 2;
          } else if (normalizedHeader.includes('gearbox') || normalizedHeader.includes('transmission')) {
            mapping[index] = 'vehicle_gearbox';
            score += 2;
          } else if (normalizedHeader.includes('fuel')) {
            mapping[index] = 'vehicle_fuel';
            score += 2;
          } else if (normalizedHeader.includes('colour') || normalizedHeader.includes('color')) {
            mapping[index] = 'vehicle_colour';
            score += 2;
          } else if (normalizedHeader.includes('vin')) {
            mapping[index] = 'vehicle_vin';
            score += 2;
          } else if (normalizedHeader.includes('mileage') || normalizedHeader.includes('miles')) {
            mapping[index] = 'vehicle_mileage';
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
                <Typography variant="h6">Import Your Data</Typography>
              </Stack>

              {/* Upload/Paste Mode Toggle */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Choose import method:</Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant={uploadMode === 'paste' ? 'contained' : 'outlined'}
                    onClick={() => setUploadMode('paste')}
                    startIcon={<ContentPasteIcon />}
                    size="small"
                  >
                    Paste Data
                  </Button>
                  <Button
                    variant={uploadMode === 'upload' ? 'contained' : 'outlined'}
                    onClick={() => setUploadMode('upload')}
                    startIcon={<CloudUploadIcon />}
                    size="small"
                  >
                    Upload File
                  </Button>
                </Stack>
              </Box>

              {uploadMode === 'upload' ? (
                <Box>
                  {/* File Upload Section */}
                  <Box sx={{ 
                    border: '2px dashed #ccc', 
                    borderRadius: 2, 
                    p: 3, 
                    textAlign: 'center',
                    mb: 2,
                    backgroundColor: uploadedFile ? '#f5f5f5' : 'transparent'
                  }}>
                    {uploadedFile ? (
                      <Box>
                        <CloudUploadIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                        <Typography variant="h6" color="success.main">
                          File Uploaded Successfully!
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(2)} KB)
                        </Typography>
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Button
                            variant="outlined"
                            onClick={resetUpload}
                            size="small"
                          >
                            Choose Different File
                          </Button>
                          <Button
                            variant="contained"
                            onClick={analyzeData}
                            disabled={loading || !rawData.trim()}
                            startIcon={loading ? <RefreshIcon /> : <AutoFixIcon />}
                            size="small"
                          >
                            {loading ? 'Analyzing...' : 'Analyze Data'}
                          </Button>
                        </Stack>
                      </Box>
                    ) : (
                      <Box>
                        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          Upload Job Data File
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Support: CSV (.csv), Excel (.xlsx, .xls), TSV (.tsv)
                        </Typography>
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls,.tsv"
                          onChange={handleFileUpload}
                          style={{ display: 'none' }}
                          id="file-upload-input"
                        />
                        <label htmlFor="file-upload-input">
                          <Button
                            variant="contained"
                            component="span"
                            startIcon={<CloudUploadIcon />}
                          >
                            Choose File
                          </Button>
                        </label>
                      </Box>
                    )}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    💡 Upload your job data file and let AI automatically detect and map columns
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {/* Paste Data Section */}
                  <TextField
                    fullWidth
                    multiline
                    minRows={10}
                    maxRows={15}
                    value={rawData}
                    onChange={(e) => setRawData(e.target.value)}
                    placeholder="Paste your copied sheet data here (CSV, TSV, or Excel format)...

Examples:

📋 For Vehicle Transport Jobs:
job_id	VRM	dealer	collection_date	delivery_date	collection_full_address	delivery_full_address	vehicle_year	vehicle_fuel
JOB001	AB12 CDE	Ford Main Dealer	2024-01-15	2024-01-16	123 Main St, London, SW1A 1AA	456 Oak Ave, Birmingham, B1 1AA	2020	Petrol
JOB002	FG34 HIJ	BMW Dealership	2024-01-16	2024-01-17	789 High St, Manchester, M1 1AA	321 Elm Rd, Liverpool, L1 1AA	2019	Diesel

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
                </Box>
              )}
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

                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => fetchRealHeaders(targetSheet)}
                    disabled={loadingHeaders || !targetSheet}
                    startIcon={loadingHeaders ? <RefreshIcon /> : <RefreshIcon />}
                  >
                    {loadingHeaders ? 'Loading...' : 'Refresh Headers'}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Get latest column headers from Google Sheets
                  </Typography>
                </Stack>

                <Typography variant="h6" sx={{ mb: 1 }}>Column Mapping</Typography>
                
                {loadingHeaders && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <RefreshIcon />
                      <Typography>Loading real column headers from {targetSheet}...</Typography>
                    </Stack>
                  </Alert>
                )}

                {realHeaders[targetSheet] && realHeaders[targetSheet].length > 0 && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">
                      📋 Real Sheet Headers ({realHeaders[targetSheet].length} columns):
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {realHeaders[targetSheet].map((header, index) => (
                        <Chip 
                          key={index} 
                          label={header} 
                          size="small" 
                          sx={{ m: 0.25 }} 
                          color="primary" 
                          variant="outlined" 
                        />
                      ))}
                    </Box>
                  </Alert>
                )}

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
                        
                        {/* Show real headers if available */}
                        {realHeaders[targetSheet] && realHeaders[targetSheet].length > 0 ? (
                          realHeaders[targetSheet].map(header => (
                            <MenuItem key={header} value={header}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <span>📊</span>
                                <Box>
                                  <Typography variant="body2">{header}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Real sheet column
                                  </Typography>
                                </Box>
                              </Stack>
                            </MenuItem>
                          ))
                        ) : (
                          /* Fallback to predefined structure */
                          targetSheet && sheetStructures[targetSheet] && [
                            ...sheetStructures[targetSheet].required,
                            ...sheetStructures[targetSheet].optional
                          ].map(column => (
                            <MenuItem key={column} value={column}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <span>{sheetStructures[targetSheet].required.includes(column) ? '⚠️' : '📝'}</span>
                                <Box>
                                  <Typography variant="body2">
                                    {column} {sheetStructures[targetSheet].required.includes(column) && '*'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {sheetStructures[targetSheet].required.includes(column) ? 'Required' : 'Optional'}
                                  </Typography>
                                </Box>
                              </Stack>
                            </MenuItem>
                          ))
                        )}
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
