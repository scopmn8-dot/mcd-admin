import React, { useState, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Collapse,
  alpha,
  useTheme,
  TablePagination,
  Checkbox,
  Menu,
  MenuItem,
  Button,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  GetApp as ExportIcon,
  MoreVert as MoreVertIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  Sort as SortIcon,
  ViewColumn as ViewColumnIcon
} from '@mui/icons-material';

const ModernDataTable = ({
  title,
  data = [],
  columns = [],
  primaryColumns = [],
  onRowClick,
  onRowSelect,
  onDelete,
  onEdit,
  customActions = [],
  enableSearch = true,
  enableFilter = true,
  enableExport = true,
  enableSelection = false,
  enableExpand = true,
  enablePagination = true,
  pageSize = 25,
  maxHeight = 'calc(100vh - 250px)',
  density = 'medium',
  stickyHeader = true
}) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [columnAnchor, setColumnAnchor] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(new Set(columns.map(col => col.key)));

  // Use primary columns if specified, otherwise show all
  const displayColumns = primaryColumns.length > 0 ? 
    columns.filter(col => primaryColumns.includes(col.key)) : 
    columns.filter(col => visibleColumns.has(col.key));
  
  const secondaryColumns = columns.filter(col => !primaryColumns.includes(col.key));

  // Enhanced filtering and sorting
  const processedData = useMemo(() => {
    let filtered = data;

    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sorting
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!enablePagination) return processedData;
    const startIndex = page * rowsPerPage;
    return processedData.slice(startIndex, startIndex + rowsPerPage);
  }, [processedData, page, rowsPerPage, enablePagination]);

  const handleSort = (columnKey) => {
    setSortConfig(prev => ({
      key: columnKey,
      direction: prev.key === columnKey && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExpandRow = (rowIndex) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowIndex)) {
      newExpanded.delete(rowIndex);
    } else {
      newExpanded.add(rowIndex);
    }
    setExpandedRows(newExpanded);
  };

  const handleSelectRow = (rowIndex) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex);
    } else {
      newSelected.add(rowIndex);
    }
    setSelectedRows(newSelected);
    onRowSelect?.(Array.from(newSelected).map(idx => paginatedData[idx]));
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
      onRowSelect?.([]);
    } else {
      const allIndices = new Set(paginatedData.map((_, idx) => idx));
      setSelectedRows(allIndices);
      onRowSelect?.(paginatedData);
    }
  };

  const renderCellContent = (value, column) => {
    if (column.render) {
      return column.render(value);
    }

    if (column.type === 'status') {
      return (
        <Chip
          label={value}
          size="small"
          color={column.statusColors?.[value] || 'default'}
          sx={{ fontWeight: 600, minWidth: 80 }}
        />
      );
    }

    if (column.type === 'chip') {
      return (
        <Chip
          label={value}
          size="small"
          color={column.color || 'primary'}
          variant={column.variant || 'filled'}
          sx={{ fontWeight: 600 }}
        />
      );
    }

    if (column.type === 'date') {
      return (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {value ? new Date(value).toLocaleDateString() : '-'}
        </Typography>
      );
    }

    if (column.type === 'number') {
      return (
        <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
          {value || '0'}
        </Typography>
      );
    }

    return (
      <Typography
        variant="body2"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: column.maxWidth || 200
        }}
        title={value?.toString()}
      >
        {value || '-'}
      </Typography>
    );
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Section */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {processedData.length} {processedData.length === 1 ? 'item' : 'items'}
            {searchTerm && ` (filtered from ${data.length} total)`}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          {enableSearch && (
            <TextField
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          )}

          {enableFilter && (
            <Tooltip title="Filter">
              <IconButton onClick={(e) => setFilterAnchor(e.currentTarget)}>
                <FilterIcon />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Column Settings">
            <IconButton onClick={(e) => setColumnAnchor(e.currentTarget)}>
              <ViewColumnIcon />
            </IconButton>
          </Tooltip>

          {enableExport && (
            <Tooltip title="Export">
              <IconButton>
                <ExportIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      {/* Selection Actions */}
      {enableSelection && selectedRows.size > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="subtitle2">
              {selectedRows.size} item{selectedRows.size !== 1 ? 's' : ''} selected
            </Typography>
            <Divider orientation="vertical" flexItem />
            {customActions.map((action, idx) => (
              <Button
                key={idx}
                size="small"
                startIcon={action.icon}
                onClick={() => action.onClick(Array.from(selectedRows).map(idx => paginatedData[idx]))}
                color={action.color || 'primary'}
              >
                {action.label}
              </Button>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Table */}
      <Paper
        sx={{
          flexGrow: 1,
          borderRadius: 2,
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[1]
        }}
      >
        <TableContainer sx={{ maxHeight, overflow: 'auto' }}>
          <Table stickyHeader={stickyHeader} size={density} sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                {enableSelection && (
                  <TableCell sx={{ width: 50, padding: 1 }}>
                    <Checkbox
                      indeterminate={selectedRows.size > 0 && selectedRows.size < paginatedData.length}
                      checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      onChange={handleSelectAll}
                      size="small"
                    />
                  </TableCell>
                )}

                {enableExpand && secondaryColumns.length > 0 && (
                  <TableCell sx={{ width: 50, padding: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      Details
                    </Typography>
                  </TableCell>
                )}

                {displayColumns.map((column) => (
                  <TableCell
                    key={column.key}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: theme.palette.primary.main,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      width: column.width || 'auto',
                      cursor: column.sortable ? 'pointer' : 'default',
                      '&:hover': column.sortable ? { bgcolor: alpha(theme.palette.primary.main, 0.1) } : {}
                    }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <span>{column.label}</span>
                      {column.sortable && (
                        <SortIcon 
                          fontSize="small" 
                          sx={{ 
                            opacity: sortConfig.key === column.key ? 1 : 0.3,
                            transform: sortConfig.key === column.key && sortConfig.direction === 'desc' ? 'rotate(180deg)' : 'none'
                          }} 
                        />
                      )}
                    </Stack>
                  </TableCell>
                ))}

                <TableCell sx={{ width: 80, textAlign: 'center', fontWeight: 700, fontSize: '0.875rem', color: theme.palette.primary.main, textTransform: 'uppercase' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedData.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <TableRow
                    hover
                    selected={selectedRows.has(rowIndex)}
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                      '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                    }}
                    onClick={() => onRowClick?.(row)}
                  >
                    {enableSelection && (
                      <TableCell sx={{ padding: 1 }}>
                        <Checkbox
                          checked={selectedRows.has(rowIndex)}
                          onChange={() => handleSelectRow(rowIndex)}
                          onClick={(e) => e.stopPropagation()}
                          size="small"
                        />
                      </TableCell>
                    )}

                    {enableExpand && secondaryColumns.length > 0 && (
                      <TableCell sx={{ padding: 1 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExpandRow(rowIndex);
                          }}
                        >
                          {expandedRows.has(rowIndex) ? <ArrowUpIcon /> : <ArrowDownIcon />}
                        </IconButton>
                      </TableCell>
                    )}

                    {displayColumns.map((column) => (
                      <TableCell
                        key={column.key}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {renderCellContent(row[column.key], column)}
                      </TableCell>
                    ))}

                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Show action menu
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Row */}
                  {enableExpand && secondaryColumns.length > 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={displayColumns.length + (enableSelection ? 1 : 0) + (enableExpand ? 1 : 0) + 1}
                        sx={{ paddingBottom: 0, paddingTop: 0 }}
                      >
                        <Collapse in={expandedRows.has(rowIndex)} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2 }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                              Additional Details
                            </Typography>
                            
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                              {secondaryColumns.map((column) => (
                                <Box key={column.key}>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    {column.label}
                                  </Typography>
                                  <Box sx={{ mt: 0.5 }}>
                                    {renderCellContent(row[column.key], column)}
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {enablePagination && (
          <TablePagination
            component="div"
            count={processedData.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            sx={{
              borderTop: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.background.default, 0.3)
            }}
          />
        )}
      </Paper>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={() => setFilterAnchor(null)}
      >
        <MenuItem>
          <Typography>Filter options coming soon...</Typography>
        </MenuItem>
      </Menu>

      {/* Column Settings Menu */}
      <Menu
        anchorEl={columnAnchor}
        open={Boolean(columnAnchor)}
        onClose={() => setColumnAnchor(null)}
      >
        {columns.map((column) => (
          <MenuItem key={column.key}>
            <Checkbox
              checked={visibleColumns.has(column.key)}
              onChange={(e) => {
                const newVisible = new Set(visibleColumns);
                if (e.target.checked) {
                  newVisible.add(column.key);
                } else {
                  newVisible.delete(column.key);
                }
                setVisibleColumns(newVisible);
              }}
              size="small"
            />
            <Typography>{column.label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default ModernDataTable;
