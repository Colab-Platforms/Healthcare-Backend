const mongoose = require("mongoose")

const labSchema = new mongoose.Schema(
  {
    // Basic Information
    facilityName: { type: String, required: true },
    facilityType: {
      type: String,
      required: true,
      enum: ["Lab", "Diagnostic", "Radiology", "Multi-specialty"],
    },
    fullAddress: { type: String, required: true },
    cityDistrict: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }, // New pincode field
    googleMapsLocation: { type: String },
    dateOfEstablishment: { type: Date, required: true },

    // Ownership & Contact Details
    ownerName: { type: String, required: true },
    designation: { type: String, required: true },
    primaryMobile: { type: String, required: true },
    alternateContact: { type: String },
    email: { type: String, required: true },
    receptionNumber: { type: String },
    kycDocumentType: { type: String, required: true }, // New KYC document type field
    kycDocumentPath: { type: String, required: true }, // New KYC document path field

    // Licensing & Accreditation
    labLicenseNumber: { type: String, required: true },
    issuingAuthority: { type: String, required: true },
    licenseValidTill: { type: Date, required: true },
    labTechnicianName: { type: String, required: true },
    labTechnicianLicenseNumber: { type: String, required: true },
    nablAccredited: {
      type: String,
      required: true,
      enum: ["Yes", "No"],
    },
    otherCertifications: { type: String },
    biomedicalWasteAgreement: {
      type: String,
      required: true,
      enum: ["Yes", "No"],
    },

    // Infrastructure & Facility
    operatingHours: { type: String, required: true },
    daysOfOperation: { type: String, required: true },

    // Services Offered
    homeCollectionAvailable: {
      type: String,
      required: true,
      enum: ["Yes", "No"],
    },
    trainedPhlebotomists: { type: Number },
    aayushBrandedKits: {
      type: String,
      required: true,
      enum: ["Yes", "No"],
    },
    radiologyServicesAvailable: {
      type: String,
      required: true,
      enum: ["Yes", "No"],
    },
    radiologyModalities: { type: String },
    specialDiagnostics: { type: String },
    dailySampleCapacity: { type: String, required: true },
    routineTestTurnaround: { type: String, required: true },
    radiologyReportTurnaround: { type: String },
    labRateCardPath: { type: String, required: true }, // New lab rate card path field

    additionalNotes: { type: String },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Lab", labSchema, "Lab")
