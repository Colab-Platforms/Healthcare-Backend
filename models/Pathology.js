const mongoose = require("mongoose");

const pathologySchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  postalCode: { type: String },
  pathologyname: { type: String },
  yearinoperation: { type: String },
  website: { type: String },
  ownername: { type: String },
  designation: { type: String },
  phoneno: { type: String },
  emailid: { type: String },
  additionalNotes: { type: String },
 
},{ timestamps: true });

module.exports = mongoose.model("Pathology", pathologySchema, "Pathology");


