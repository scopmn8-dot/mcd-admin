import React, { useState, useMemo } from "react";
import ModernDataTable from "./ModernDataTable";
import {
  Paper,
  Typography,
  Chip,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

export default function SheetTable({ title, columns, data, onDeleteJob, allowDelete = false }) {
  // Define column configuration for the modern table
  const tableColumns = useMemo(() => {
    return columns.map(col => ({
      key: col,
      label: col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      width: getColumnWidth(col),
      sortable: true,
      type: getColumnType(col),
      render: (value) => renderCellContent(value, col),
      statusColors: getStatusColors(col),
      maxWidth: getColumnMaxWidth(col)
    }));
  }, [columns]);

  // Primary columns to show in main table
  const primaryColumns = ['job_id', 'VRM', 'selected_driver', 'collection_postcode', 'delivery_postcode', 'job_status', 'forward_return_flag'];

  const getColumnWidth = (column) => {
    const widthMap = {
      'job_id': '120px',
      'VRM': '100px',
      'selected_driver': '150px',
      'collection_postcode': '120px',
      'delivery_postcode': '120px',
      'job_status': '100px',
      'forward_return_flag': '100px',
      'date_time_created': '140px',
      'distance': '80px'
    };
    return widthMap[column] || '120px';
  };

  const getColumnMaxWidth = (column) => {
    const maxWidthMap = {
      'job_id': 120,
      'VRM': 100,
      'selected_driver': 150,
      'collection_postcode': 120,
      'delivery_postcode': 120
    };
    return maxWidthMap[column] || 200;
  };

  const getColumnType = (column) => {
    if (column === 'job_status') return 'status';
    if (column === 'forward_return_flag') return 'chip';
    if (column === 'selected_driver') return 'chip';
    if (column.includes('date')) return 'date';
    if (column === 'distance') return 'number';
    return 'text';
  };

  const getStatusColors = (column) => {
    if (column === 'job_status') {
      return {
        'completed': 'success',
        'assigned': 'info',
        'pending': 'warning',
        'cancelled': 'error',
        'active': 'warning'
      };
    }
    return {};
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
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {date.toLocaleDateString()}
        </Typography>
      );
    }
    
    if (column === 'distance' && value) {
      return (
        <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
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
          whiteSpace: 'nowrap'
        }}
        title={value?.toString()}
      >
        {value || '-'}
      </Typography>
    );
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
        await onDeleteJob(jobId, title);
      } catch (error) {
        alert(`❌ Error deleting job: ${error.message}`);
      }
    }
  };

  // Custom actions for the table
  const customActions = [
    {
      label: 'View Details',
      icon: <ViewIcon />,
      onClick: (selectedRows) => {
        console.log('View details for:', selectedRows);
      },
      color: 'primary'
    },
    ...(allowDelete ? [{
      label: 'Delete Selected',
      icon: <DeleteIcon />,
      onClick: (selectedRows) => {
        selectedRows.forEach(job => handleDeleteJob(job));
      },
      color: 'error'
    }] : [])
  ];

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          No Data Available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title} sheet is empty or still loading.
        </Typography>
      </Paper>
    );
  }

  return (
    <ModernDataTable
      title={title}
      data={data}
      columns={tableColumns}
      primaryColumns={primaryColumns}
      customActions={customActions}
      enableSearch={true}
      enableFilter={true}
      enableExport={true}
      enableSelection={allowDelete}
      enableExpand={true}
      enablePagination={true}
      pageSize={25}
      density="medium"
      stickyHeader={true}
      maxHeight="calc(100vh - 300px)"
    />
  );
}
