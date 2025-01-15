import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, TextField, Button, Grid, Box,
  Typography, MenuItem, CircularProgress
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axios from 'axios';
const TransportForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: null,
    vehicleNo: '',
    driverName: '',
    driverMobile: '',
    place: '',
    transportName: '',
    rentAmount: '',
    advanceAmount: '',
    advanceDate: null,
    advanceType: 'cash',
    balanceAmount: '',
    balanceStatus: 'UNPAID',
    balanceDate: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const resetForm = () => {
    setFormData({
      date: null,
      vehicleNo: '',
      driverName: '',
      driverMobile: '',
      place: '',
      transportName: '',
      rentAmount: '',
      advanceAmount: '',
      advanceDate: null,
      advanceType: 'cash',
      balanceAmount: '',
      balanceStatus: 'UNPAID',
      balanceDate: null
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const rent = Number(formData.rentAmount) || 0;
      const advance = Number(formData.advanceAmount) || 0;
      const balance = rent - advance;

      const dataToSubmit = {
        ...formData,
        date: formData.date ? dayjs(formData.date).format('YYYY-MM-DD') : null,
        advanceDate: formData.advanceDate ? dayjs(formData.advanceDate).format('YYYY-MM-DD') : null,
        balanceDate: formData.balanceDate ? dayjs(formData.balanceDate).format('YYYY-MM-DD') : null,
        vehicleNo: formData.vehicleNo.toUpperCase(),
        rentAmount: rent,
        advanceAmount: advance,
        balanceAmount: balance
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/transport`, 
        dataToSubmit
      );
      
      if (response.status === 201) {
        alert('Data saved successfully!');
        resetForm();
      }
    } catch (error) {
      console.error('Error:', error);
      setError(
        error.response?.data?.message || 
        'Error saving data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const rent = Number(formData.rentAmount) || 0;
    const advance = Number(formData.advanceAmount) || 0;
    const balance = rent - advance;
    setFormData(prev => ({ ...prev, balanceAmount: balance }));
  }, [formData.rentAmount, formData.advanceAmount]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4">Transport Entry Form</Typography>
        </Box>

        {error && (
          <Box sx={{ mb: 2, color: 'error.main' }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date"
                  value={formData.date}
                  onChange={(newValue) => setFormData({...formData, date: newValue})}
                  slotProps={{
                    textField: { fullWidth: true }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Vehicle Number"
                value={formData.vehicleNo}
                onChange={(e) => setFormData({
                  ...formData, 
                  vehicleNo: e.target.value.toUpperCase()
                })}
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Driver Name"
                value={formData.driverName}
                onChange={(e) => setFormData({
                  ...formData, 
                  driverName: e.target.value.toUpperCase()
                })}
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Driver Mobile"
                value={formData.driverMobile}
                onChange={(e) => setFormData({...formData, driverMobile: e.target.value})}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Place"
                value={formData.place}
                onChange={(e) => setFormData({
                  ...formData, 
                  place: e.target.value.toUpperCase()
                })}
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Transport Name"
                value={formData.transportName}
                onChange={(e) => setFormData({
                  ...formData, 
                  transportName: e.target.value.toUpperCase()
                })}
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Rent Amount"
                type="number"
                value={formData.rentAmount}
                onChange={(e) => setFormData({...formData, rentAmount: e.target.value})}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Advance Amount"
                type="number"
                value={formData.advanceAmount}
                onChange={(e) => setFormData({...formData, advanceAmount: e.target.value})}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Advance Date"
                  value={formData.advanceDate}
                  onChange={(newValue) => setFormData({...formData, advanceDate: newValue})}
                  slotProps={{
                    textField: { fullWidth: true }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Advance Type"
                value={formData.advanceType}
                onChange={(e) => setFormData({...formData, advanceType: e.target.value})}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="phonepay">PhonePay</MenuItem> 
                </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Balance Amount"
                value={formData.balanceAmount}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Balance Status"
                value={formData.balanceStatus}
                onChange={(e) => {
                  setFormData({
                    ...formData, 
                    balanceStatus: e.target.value,
                    balanceDate: e.target.value === 'UNPAID' ? null : formData.balanceDate
                  });
                }}
              >
                <MenuItem value="UNPAID">UNPAID</MenuItem>
                <MenuItem value="PAID">PAID</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Balance Date"
                  value={formData.balanceDate}
                  onChange={(newValue) => setFormData({...formData, balanceDate: newValue})}
                  slotProps={{
                    textField: { 
                      fullWidth: true,
                      required: formData.balanceStatus === 'PAID',
                      error: formData.balanceStatus === 'PAID' && !formData.balanceDate,
                      helperText: formData.balanceStatus === 'PAID' && !formData.balanceDate 
                        ? 'Balance Date is required when status is PAID' 
                        : ''
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: 2, 
                mt: 3 
              }}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate('/data')}
                >
                  Show Data
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Submit'
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default TransportForm; 
