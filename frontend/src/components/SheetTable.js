import React, { useState, useMemo } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  TablePagination,
  Stack,
  Card,
  alpha,
  useTheme,
  Collapse,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  GetApp as ExportIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
} from "@mui/icons-material";

export default function SheetTable({ title, columns, data, onDeleteJob, allowDelete = false }) {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [expandedRow, setExpandedRow] = useState(null);

  // Key columns to show in main table
  const mainColumns = ['job_id', 'VRM', 'selected_driver', 'collection_postcode', 'delivery_postcode', 'job_status', 'forward_return_flag'];
  
  // Secondary columns for expanded view
  const secondaryColumns = columns.filter(col => !mainColumns.includes(col));

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(row =>
      Object.values(row).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Paginate filtered data
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteJob = async (job) => {
    const jobId = job.job_id || job['Job Reference'];
    if (!jobId) {
      alert('❌ Cannot delete job: No job ID found');
      return;
    }

    if (!window.confirm(`⚠️ Delete job "${jobId}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    if (onDeleteJob) {
      try {
        await onDeleteJob(jobId, title); // Pass job ID and sheet name
      } catch (error) {
        alert(`❌ Error deleting job: ${error.message}`);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'assigned': return 'info';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'active': return 'warning';
      default: return 'default';
    }
  };

  const getFlagColor = (flag) => {
    return flag === 'Forward' ? 'primary' : flag === 'Return' ? 'secondary' : 'default';
  };

  const handleToggleExpand = (rowIndex) => {
    setExpandedRow(expandedRow === rowIndex ? null : rowIndex);
  };

  const renderCellContent = (value, column) => {
    if (column === 'job_status' && value) {
      return (
        <Chip 
          label={value} 
          size="small" 
          color={getStatusColor(value)}
          sx={{ fontWeight: 600, minWidth: 80 }}
        />
      );
    }
    
    if (column === 'forward_return_flag' && value) {
      return (
        <Chip 
          label={value} 
          size="small" 
          color={getFlagColor(value)}
          sx={{ fontWeight: 600 }}
        />
      );
    }

    if (column === 'selected_driver' && value) {
      return (
        <Chip 
          label={value} 
          size="small" 
          color="info"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      );
    }
    
    if (column.includes('date') && value) {
      const date = new Date(value);
      return (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {date.toLocaleDateString()}
        </Typography>
      );
    }
    
    if (column === 'distance' && value) {
      return (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {value} km
        </Typography>
      );
    }
    
    if (typeof value === 'boolean') {
      return (
        <Chip 
          label={value ? 'Yes' : 'No'} 
          size="small" 
          color={value ? 'success' : 'default'}
          variant="outlined"
        />
      );
    }
    
    return (
      <Typography 
        variant="body2" 
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 150
        }}
        title={value?.toString()}
      >
        {value || '-'}
      </Typography>
    );
  };

  if (!data || data.length === 0) {
    return (
      <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          No Data Available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          There are no items to display at this time.
        </Typography>
      </Card>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Enhanced Search and Filter Bar */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <TextField
          placeholder="Search all fields..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="medium"
          sx={{ 
            minWidth: { xs: '100%', sm: 300 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.primary.main, 0.02),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        
        <Stack direction="row" spacing={1}>
          <Tooltip title="Export Data">
            <span>
              <IconButton 
                size="large"
                sx={{
                  backgroundColor: 'action.hover',
                  '&:hover': { backgroundColor: 'success.main', color: 'white' },
                }}
              >
                <ExportIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Filter Options">
            <span>
              <IconButton 
                size="large"
                sx={{
                  backgroundColor: 'action.hover',
                  '&:hover': { backgroundColor: 'primary.main', color: 'white' },
                }}
              >
                <FilterIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Results Summary */}
      <Stack direction="row" alignItems="center" justifyContent="between" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {paginatedData.length} of {filteredData.length} items
          {searchTerm && ` (filtered from ${data.length} total)`}
        </Typography>
      </Stack>

      {/* Enhanced Table */}
      <Paper 
        sx={{ 
          flexGrow: 1,
          borderRadius: 3,
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`,
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 400px)'
        }}
      >
        <TableContainer sx={{ height: '100%', overflow: 'auto' }}>
          <Table stickyHeader size="medium" sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', backgroundColor: alpha(theme.palette.primary.main, 0.08), color: theme.palette.primary.main, borderBottom: `2px solid ${theme.palette.primary.main}`, textTransform: 'uppercase', letterSpacing: '0.5px', width: '40px' }}>
                  Expand
                </TableCell>
                {mainColumns.map((col) => (
                  <TableCell 
                    key={col} 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                      borderBottom: `2px solid ${theme.palette.primary.main}`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      whiteSpace: 'nowrap',
                      width: col === 'job_id' ? '120px' : col === 'VRM' ? '100px' : col === 'selected_driver' ? '150px' : '120px'
                    }}
                  >
                    {col.replace(/_/g, ' ')}
                  </TableCell>
                ))}
                <TableCell 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    color: theme.palette.primary.main,
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    width: '120px',
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((row, idx) => (
                <React.Fragment key={idx}>
                  <TableRow 
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      },
                      '&:nth-of-type(even)': {
                        backgroundColor: alpha(theme.palette.action.hover, 0.02),
                      },
                      bgcolor: expandedRow === idx ? alpha(theme.palette.primary.main, 0.08) : 'inherit'
                    }}
                    onClick={() => handleToggleExpand(idx)}
                  >
                    <TableCell sx={{ width: '40px' }}>
                      <IconButton size="small">
                        {expandedRow === idx ? <ArrowUpIcon /> : <ArrowDownIcon />}
                      </IconButton>
                    </TableCell>
                    {mainColumns.map((col) => (
                      <TableCell 
                        key={col}
                        sx={{
                          fontSize: '0.875rem',
                          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {renderCellContent(row[col], col)}
                      </TableCell>
                    ))}
                    <TableCell 
                      sx={{
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                        width: '120px',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary">
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {allowDelete && (row.job_id || row['Job Reference']) && (
                          <Tooltip title="Delete Job">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteJob(row)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={mainColumns.length + 2}>
                      <Collapse in={expandedRow === idx} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }}>
                          <Typography variant="h6" gutterBottom component="div" sx={{ fontWeight: 600 }}>
                            Full Details - {row.job_id || `Row ${idx + 1}`}
                          </Typography>
                          
                          <TableContainer sx={{ maxHeight: '300px', overflow: 'auto' }}>
                            <Table size="small" sx={{ tableLayout: 'auto' }}>
                              <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                  {secondaryColumns.map((col) => (
                                    <TableCell key={col} sx={{ fontWeight: 600, minWidth: '120px' }}>
                                      {col.replace(/_/g, ' ')}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow>
                                  {secondaryColumns.map((col) => (
                                    <TableCell key={col}>
                                      {renderCellContent(row[col], col)}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Enhanced Pagination */}
        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: alpha(theme.palette.background.default, 0.5),
            '& .MuiTablePagination-actions': {
              '& .MuiIconButton-root': {
                borderRadius: 2,
                margin: '0 2px',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                },
              },
            },
          }}
        />
      </Paper>
    </Box>
  );
}
