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
  const [data, setData] = useState([]);
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
    let filtered = data;
    
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
  }, [searchTerm, data, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/transport`);
      const sortedData = response.data.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      setData(sortedData);
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
        const updatedLocalData = data.map(item => {
          if (item._id === row._id) {
            return {
              ...item,
              ...response.data
            };
          }
          return item;
        });

        setData(updatedLocalData);
        setFilteredData(updatedLocalData);

        // Verify update
        const freshDataResponse = await axios.get('http://localhost:5000/api/transport');
        console.log('Fresh data:', freshDataResponse.data);
        
        setData(freshDataResponse.data);
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
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Stats Cards */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, flex: 1, minWidth: 200, bgcolor: '#bbdefb' }}>
          <Typography variant="h6">Total Transactions</Typography>
          <Typography variant="h4">{stats.total}</Typography>
        </Paper>
        
        <Paper sx={{ p: 2, flex: 1, minWidth: 200, bgcolor: '#c8e6c9' }}>
          <Typography variant="h6">Paid</Typography>
          <Typography variant="h4">{stats.paid}</Typography>
        </Paper>
        
        <Paper sx={{ p: 2, flex: 1, minWidth: 200, bgcolor: '#ffcdd2' }}>
          <Typography variant="h6">Pending</Typography>
          <Typography variant="h4">{stats.pending}</Typography>
        </Paper>
        
        <Paper sx={{ p: 2, flex: 1, minWidth: 200, bgcolor: '#fff9c4' }}>
          <Typography variant="h6">Total Balance</Typography>
          <Typography variant="h4">₹{stats.totalBalance}</Typography>
        </Paper>
      </Box>

      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 2,
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Left side - Search and Date filters */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="From Date"
              value={dateRange.start}
              onChange={(newValue) => {
                setDateRange(prev => ({ ...prev, start: newValue }));
              }}
              slotProps={{ 
                textField: { 
                  size: 'small',
                  sx: { width: '150px' }
                } 
              }}
            />
            <DatePicker
              label="To Date"
              value={dateRange.end}
              onChange={(newValue) => {
                setDateRange(prev => ({ ...prev, end: newValue }));
              }}
              slotProps={{ 
                textField: { 
                  size: 'small',
                  sx: { width: '150px' }
                } 
              }}
            />
          </LocalizationProvider>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => setDateRange({ start: null, end: null })}
          >
            Clear Dates
          </Button>
        </Box>

        {/* Existing Search Field */}
        <TextField
          placeholder="Search..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ 
            minWidth: { xs: '100%', md: '300px' },
            backgroundColor: 'white'
          }}
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
          }}
        />

        {/* Right side - Action buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => navigate('/')}
            startIcon={<ArrowBackIcon />}
          >
            Back to Form
          </Button>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={exportToExcel}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </Box>
      </Box>

      {error && (
        <Box sx={{ mb: 2, color: 'error.main' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ 
          width: '100%', 
          overflow: 'hidden',
          boxShadow: 3,
          backgroundColor: 'white' 
        }}>
          <TableContainer sx={{ 
            maxHeight: 'calc(100vh - 250px)',
            overflowX: { xs: 'auto', md: 'hidden' },
            '&::-webkit-scrollbar': {
              width: '10px',
              height: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#888',
              borderRadius: '5px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
            },
          }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Date</StyledTableCell>
                  <StyledTableCell>Vehicle No</StyledTableCell>
                  <StyledTableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    Driver Name
                  </StyledTableCell>
                  <StyledTableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    Driver Mobile
                  </StyledTableCell>
                  <StyledTableCell>Place</StyledTableCell>
                  <StyledTableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    Transport Name
                  </StyledTableCell>
                  <StyledTableCell>Rent Amount</StyledTableCell>
                  <StyledTableCell>Advance</StyledTableCell>
                  <StyledTableCell>Advance Date</StyledTableCell>
                  <StyledTableCell>Balance</StyledTableCell>
                  <StyledTableCell>Status</StyledTableCell>
                  <StyledTableCell>Balance Date</StyledTableCell>
                  <StyledTableCell>Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((row) => (
                  <StyledTableRow key={row._id}>
                    <TableCell>{dayjs(row.date).format('DD/MM/YYYY')}</TableCell>
                    <TableCell>{row.vehicleNo}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{row.driverName}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{row.driverMobile}</TableCell>
                    <TableCell>{row.place}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{row.transportName}</TableCell>
                    <TableCell>{row.rentAmount}</TableCell>
                    <TableCell>{row.advanceAmount}</TableCell>
                    <TableCell>{dayjs(row.advanceDate).format('DD/MM/YYYY')}</TableCell>
                    <TableCell>{row.balanceAmount}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        color={row.balanceStatus === 'PAID' ? "success" : "warning"}
                        onClick={() => row.balanceStatus !== 'PAID' && handlePaidClick(row)}
                        disabled={row.balanceStatus === 'PAID'}
                        sx={{ 
                          minWidth: '100px',
                          backgroundColor: row.balanceStatus === 'PAID' ? '#2e7d32' : '#ed6c02',
                          '&:disabled': {
                            backgroundColor: '#2e7d32',
                            color: 'white'
                          }
                        }}
                      >
                        {row.balanceStatus === 'PAID' ? "PAID" : "Mark Paid"}
                      </Button>
                    </TableCell>
                    <TableCell>{row.balanceStatus === 'PAID' && row.balanceDate 
                      ? dayjs(row.balanceDate).format('DD/MM/YYYY')
                      : '-'}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleEditClick(row)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => handleDelete(row._id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Record</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date"
                  value={editData?.date}
                  onChange={(newValue) => setEditData({ ...editData, date: newValue })}
                  slotProps={{
                    textField: { fullWidth: true }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vehicle No"
                value={editData?.vehicleNo || ''}
                onChange={(e) => setEditData({ ...editData, vehicleNo: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Driver Name"
                value={editData?.driverName || ''}
                onChange={(e) => setEditData({ ...editData, driverName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Mobile"
                value={editData?.driverMobile || ''}
                onChange={(e) => setEditData({ ...editData, driverMobile: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Place"
                value={editData?.place || ''}
                onChange={(e) => setEditData({ ...editData, place: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Transport"
                value={editData?.transportName || ''}
                onChange={(e) => setEditData({ ...editData, transportName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Rent Amount"
                type="number"
                value={editData?.rentAmount || ''}
                onChange={(e) => setEditData({ ...editData, rentAmount: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Advance Amount"
                type="number"
                value={editData?.advanceAmount || ''}
                onChange={(e) => setEditData({ ...editData, advanceAmount: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Advance Date"
                  value={editData?.advanceDate}
                  onChange={(newValue) => setEditData({ ...editData, advanceDate: newValue })}
                  slotProps={{
                    textField: { fullWidth: true }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Payment Mode"
                value={editData?.advanceType || ''}
                onChange={(e) => setEditData({ ...editData, advanceType: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Balance Amount"
                type="number"
                value={editData?.balanceAmount || ''}
                onChange={(e) => setEditData({ ...editData, balanceAmount: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleEditSave} color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TransportTable; 