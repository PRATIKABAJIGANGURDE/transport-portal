const mongoose = require('mongoose');

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
  advanceType: String,
  balanceAmount: Number,
  balanceStatus: {
    type: String,
    enum: ['PAID', 'UNPAID'],
    default: 'UNPAID'
  },
  balanceDate: Date
});

module.exports = mongoose.model('Transport', transportSchema); 