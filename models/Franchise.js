const mongoose = require("mongoose");

const franchiseSchema = new mongoose.Schema({
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
  specialty: { type: String },
  locality: { type: String },
  additionalNotes: { type: String },
  establishment: { type: String, enum: ["yes", "no"] }, // Added Establishment Field
  city1: { type: String },
  amount:{type:String},
  state1: { type: String },
  aadharCard: { type: String }, // Aadhaar image URL
  panCard: { type: String   }  , // PAN image URL
  certificates: { type: [String ]}, // Array of certificate URLs
},{ timestamps: true });

module.exports = mongoose.model("Franchise", franchiseSchema, "Franchise");
