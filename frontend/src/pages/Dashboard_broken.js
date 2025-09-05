import React, { useEffect, useState } from "react";
import SheetTable from "../components/SheetTable";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Stack,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Collapse,
  Chip,
  CircularProgress,
  useMediaQuery
} from "@mui/material";
import {
  Add as AddIcon,
  AutoMode as AutoModeIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as LocalShippingIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationOnIcon,
  Group as GroupIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from "@mui/icons-material";
import AddRowModal from "../components/AddRowModal";
// JobCompletionButton removed — complete-job flow is handled automatically

const columns = [
  "job_id", "VRM", "date_time_created", "dealer", "date_time_assigned",
  "collection_full_address", "collection_postcode", "collection_town_city",
  "collection_address_1", "collection_address_2", "collection_contact_first_name",
  "collection_contact_surname", "collection_email", "collection_phone_number",
  "preferred_seller_collection_dates", "delivery_full_address", "delivery_postcode",
  "delivery_town_city", "delivery_address_1", "delivery_address_2", "delivery_contact_first_name",
  "delivery_contact_surname", "delivery_email", "delivery_phone_number", "job_type", "distance",
  "collection_date", "delivery_date", "vehicle_year", "vehicle_gearbox", "vehicle_fuel", "vehicle_colour",
  "vehicle_vin", "vehicle_mileage", "job_stage", "job_status", "selected_driver", "cluster_id",
  "forward_return_flag", "collection_region", "delivery_region", "order_no", "driver_order_sequence", "job_active"
];

const sheetTabs = [
  { 
    label: "Motorway", 
    key: "motorway", 
    icon: <LocalShippingIcon />, 
    color: "#6366f1",
    description: "Long-distance jobs"
  },
  { 
    label: "AT Moves", 
    key: "atmoves", 
    icon: <SpeedIcon />, 
    color: "#8b5cf6",
    description: "Auction transport"
  },
  { 
    label: "Private", 
    key: "privateCustomers", 
    icon: <GroupIcon />, 
    color: "#ec4899",
    description: "Customer deliveries"
  },
  { 
    label: "Assignments", 
    key: "driverAssignments", 
    icon: <AssessmentIcon />, 
    color: "#10b981",
    description: "Driver assignments"
  },
];

