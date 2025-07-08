const mongoose = require("mongoose");

const healthagentSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  postalCode: { type: String },
  registrationNumber: { type: String },
  registrationCouncil: { type: String },
  registrationYear: { type: Number },
  qualification: { type: String },
  yearOfCompletion: { type: Number },
  collegeInstitute: { type: String },
  yearsOfExperience: { type: Number },
  additionalNotes: { type: String },
 
},{ timestamps: true });

module.exports = mongoose.model("Healthagent", healthagentSchema, "Healthagent");
