const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String },
  phone: { type: String },
  designation: { type: String },
  hospitalname: { type: String },
  hospitaltype: { type: String },
  registrationNumber: { type: String },
  Accreditation: { type: String },
  EstablishedYear: { type: Number },
  hospitaladd: { type: String },
  country: { type: String },
  additionalNotes: { type: String },
 
},{ timestamps: true });

module.exports = mongoose.model("Hospital", hospitalSchema, "Hospital");


