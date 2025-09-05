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
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  GetApp as ExportIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

export default function SheetTable({ title, columns, data, onDeleteJob, allowDelete = false }) {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

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
      default: return 'default';
    }
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
    
    return value || '-';
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
        }}
      >
        <TableContainer sx={{ height: '100%' }}>
          <Table stickyHeader size="medium">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
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
                    width: 80,
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((row, idx) => (
                <TableRow 
                  key={idx} 
                  hover
                  sx={{
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    },
                    '&:nth-of-type(even)': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.02),
                    },
                  }}
                >
                  {columns.map((col) => (
                    <TableCell 
                      key={col}
                      sx={{
                        fontSize: '0.875rem',
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                        maxWidth: 200,
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
                      width: 80,
                    }}
                  >
                    <Tooltip title="View Details">
                      <span>
                        <IconButton size="small" color="primary">
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    {allowDelete && (row.job_id || row['Job Reference']) && (
                      <Tooltip title="Delete Job">
                        <span>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteJob(row)}
                            sx={{ ml: 0.5 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
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
