const mongoose = require('mongoose');

const transportSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  vehicleNo: { type: String, required: true },
  driverName: String,
  driverMobile: String,
  place: String,
  transportName: String,
  rentAmount: { type: Number, required: true },
  advanceAmount: { type: Number, default: 0 },
  advanceDate: Date,
  advanceType: {
    type: String,
    enum: ['cash', 'phonepay'],
    default: 'cash'
  },
  balanceAmount: { type: Number, default: 0 },
  balanceStatus: {
    type: String,
    enum: ['PAID', 'UNPAID'],
    default: 'UNPAID'
  },
  balanceDate: Date
});

module.exports = mongoose.model('Transport', transportSchema); 