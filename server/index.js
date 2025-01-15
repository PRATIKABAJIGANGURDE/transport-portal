const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://pratik:Pratik121ffybl@transportportal.s4bwb.mongodb.net/?retryWrites=true&w=majority&appName=TransportPortal', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// Create Transport Schema
const transportSchema = new mongoose.Schema({
  date: Date,
  vehicleNo: String,
  driverName: String,
  driverMobile: String,
  place: String,
  transportName: String,
  rentAmount: Number,
  advanceAmount: Number,
  advanceDate: Date,
  advanceType: {
    type: String,
    enum: ['cash', 'phonepay']
  },
  balanceAmount: Number,
  balanceDate: Date,
  balanceStatus: {
    type: String,
    enum: ['PAID', 'UNPAID'],
    default: 'UNPAID'
  }
});

const Transport = mongoose.model('Transport', transportSchema);

// Routes
app.post('/api/transport', async (req, res) => {
  try {
    console.log('Received data:', req.body); // Debug log

    // Validate required fields
    const requiredFields = ['date', 'vehicleNo', 'rentAmount', 'advanceAmount', 'advanceDate'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    // Format the data
    const transportData = {
      ...req.body,
      date: new Date(req.body.date),
      advanceDate: new Date(req.body.advanceDate),
      balanceDate: req.body.balanceDate ? new Date(req.body.balanceDate) : null,
      rentAmount: Number(req.body.rentAmount),
      advanceAmount: Number(req.body.advanceAmount),
      balanceAmount: Number(req.body.balanceAmount),
      balanceStatus: 'UNPAID' // Set default status
    };

    console.log('Formatted data:', transportData); // Debug log

    const transport = new Transport(transportData);
    await transport.save();

    console.log('Saved successfully:', transport); // Debug log
    res.status(201).json(transport);
  } catch (err) {
    console.error('Server error:', err); // Detailed error log
    res.status(500).json({ 
      error: 'Error saving data',
      details: err.message 
    });
  }
});

app.get('/api/transport', async (req, res) => {
  try {
    const data = await Transport.find().sort({ date: -1 });
    console.log('Sending data:', data); // Debug log
    res.status(200).json(data);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Error fetching data' });
  }
});

app.put('/api/transport/:id', async (req, res) => {
  try {
    const updatedTransport = await Transport.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          balanceStatus: 'PAID',
          balanceDate: new Date()
        }
      },
      { new: true }
    );
    res.status(200).json(updatedTransport);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Error updating data' });
  }
});

app.delete('/api/transport/:id', async (req, res) => {
  try {
    await Transport.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting data' });
  }
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
}); 