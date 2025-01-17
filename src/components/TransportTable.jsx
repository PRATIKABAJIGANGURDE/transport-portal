import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Container, TextField, Box, Typography, Grid, CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axios from 'axios';
import * as XLSX from 'xlsx';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { DataGrid } from '@mui/x-data-grid';

// Styled components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  fontWeight: 'bold',
  whiteSpace: 'nowrap',
  '&.MuiTableCell-head': {
    backgroundColor: theme.palette.primary.main,
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const TransportTable = () => {
  const navigate = useNavigate();
  const [transportData, setTransportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editData, setEditData] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = transportData;
    
    // Apply date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(row => {
        const rowDate = dayjs(row.date);
        return rowDate.isAfter(dateRange.start) && rowDate.isBefore(dateRange.end);
      });
    }
    
    // Apply search term filter (existing logic)
    if (searchTerm) {
      filtered = filtered.filter(row => 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    setFilteredData(filtered);
  }, [searchTerm, transportData, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/transport`);
      const sortedData = response.data.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      setTransportData(sortedData);
      setFilteredData(sortedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error loading data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaidClick = async (row) => {
    try {
      console.log('Attempting to update row:', row);

      // Make the API call first
      const response = await axios.put(`http://localhost:5000/api/transport/${row._id}`, {
        isPaid: true,
        balanceDate: new Date()
      });

      console.log('Server response:', response.data);

      if (response.data) {
        // Update local state after successful server update
        const updatedLocalData = transportData.map(item => {
          if (item._id === row._id) {
            return {
              ...item,
              ...response.data
            };
          }
          return item;
        });

        setTransportData(updatedLocalData);
        setFilteredData(updatedLocalData);

        // Verify update
        const freshDataResponse = await axios.get('http://localhost:5000/api/transport');
        console.log('Fresh data:', freshDataResponse.data);
        
        setTransportData(freshDataResponse.data);
        setFilteredData(freshDataResponse.data);
      }
    } catch (error) {
      console.error('Detailed error:', error);
      console.error('Error response:', error.response?.data);
      
      alert(
        error.response?.data?.error || 
        error.response?.data?.details || 
        'Error updating payment status. Please try again.'
      );
      
      // Refresh data to ensure consistency
      await fetchData();
    }
  };

  const handleEditClick = (row) => {
    setEditData({
      ...row,
      date: dayjs(row.date),
      advanceDate: dayjs(row.advanceDate),
      balanceDate: row.balanceDate ? dayjs(row.balanceDate) : null
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await axios.delete(`http://localhost:5000/api/transport/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Error deleting record');
      }
    }
  };

  const exportToExcel = () => {
    const exportData = filteredData.map(row => ({
      Date: dayjs(row.date).format('DD/MM/YYYY'),
      'Vehicle No': row.vehicleNo,
      'Driver Name': row.driverName,
      'Mobile': row.driverMobile,
      'Place': row.place,
      'Transport': row.transportName,
      'Rent Amount': row.rentAmount,
      'Advance': row.advanceAmount,
      'Advance Date': dayjs(row.advanceDate).format('DD/MM/YYYY'),
      'Payment Mode': row.advanceType,
      'Balance': row.balanceAmount,
      'Balance Date': row.balanceDate ? dayjs(row.balanceDate).format('DD/MM/YYYY') : '-',
      'Status': row.balanceStatus || 'UNPAID'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transport Data");
    XLSX.writeFile(wb, `transport_records_${dayjs().format('DD-MM-YYYY')}.xlsx`);
  };

  const handleEditSave = async () => {
    try {
      const formattedData = {
        ...editData,
        date: dayjs(editData.date).format('YYYY-MM-DD'),
        advanceDate: dayjs(editData.advanceDate).format('YYYY-MM-DD'),
        balanceDate: editData.balanceDate ? dayjs(editData.balanceDate).format('YYYY-MM-DD') : null
      };

      await axios.put(`http://localhost:5000/api/transport/${editData._id}`, formattedData);
      setOpenDialog(false);
      setEditData(null);
      fetchData();
    } catch (error) {
      console.error('Error updating record:', error);
      alert('Error updating record');
    }
  };

  // Calculate statistics
  const stats = {
    total: filteredData.length,
    paid: filteredData.filter(row => row.balanceStatus === 'PAID').length,
    pending: filteredData.filter(row => row.balanceStatus !== 'PAID').length,
    totalBalance: filteredData.reduce((sum, row) => 
      sum + (row.balanceStatus !== 'PAID' ? Number(row.balanceAmount) : 0), 0
    )
  };

  // Define columns for the DataGrid
  const columns = [
    { field: 'date', headerName: 'Date', width: 120, 
      valueFormatter: (params) => dayjs(params.value).format('DD/MM/YYYY') 
    },
    { field: 'vehicleNo', headerName: 'Vehicle No', width: 130 },
    { field: 'driverName', headerName: 'Driver Name', width: 150 },
    { field: 'driverMobile', headerName: 'Driver Mobile', width: 150 },
    { field: 'place', headerName: 'Place', width: 150 },
    { field: 'transportName', headerName: 'Transport Name', width: 180 },
    { field: 'rentAmount', headerName: 'Rent Amount', width: 130 },
    { field: 'advanceAmount', headerName: 'Advance Amount', width: 150 },
    { field: 'advanceDate', headerName: 'Advance Date', width: 150,
      valueFormatter: (params) => params.value ? dayjs(params.value).format('DD/MM/YYYY') : ''
    },
    { field: 'advanceType', headerName: 'Payment Mode', width: 150 },
    { field: 'balanceStatus', headerName: 'Balance Status', width: 150 },
    { field: 'balanceDate', headerName: 'Balance Date', width: 150,
      valueFormatter: (params) => params.value ? dayjs(params.value).format('DD/MM/YYYY') : ''
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">Transport Records</Typography>
          {/* ... other header content ... */}
        </Box>

        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={transportData}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
            getRowId={(row) => row._id}
            disableSelectionOnClick
            autoHeight
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default TransportTable; 