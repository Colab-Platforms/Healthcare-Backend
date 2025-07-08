const express = require("express")
const router = express.Router()
const Lab = require("../models/Lab")
const excel = require("exceljs")
const multer = require("multer")
const cloudinary = require("cloudinary").v2
const { CloudinaryStorage } = require("multer-storage-cloudinary")

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "lab-documents", // Folder name in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "pdf", "doc", "docx"],
    resource_type: "auto", // Automatically detect file type
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
      return `${file.fieldname}-${uniqueSuffix}`
    },
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "kycDocument") {
      // Allow only images and PDFs for KYC
      if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "application/pdf") {
        cb(null, true)
      } else {
        cb(new Error("Only JPG, PNG, and PDF files are allowed for KYC documents"))
      }
    } else if (file.fieldname === "labRateCard") {
      // Allow images, PDFs, and DOC files for rate card
      if (
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/png" ||
        file.mimetype === "application/pdf" ||
        file.mimetype === "application/msword" ||
        file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        cb(null, true)
      } else {
        cb(new Error("Only JPG, PNG, PDF, DOC, and DOCX files are allowed for rate cards"))
      }
    } else {
      cb(null, true)
    }
  },
})

// Helper function to delete files from Cloudinary
const deleteCloudinaryFiles = async (files) => {
  if (files) {
    for (const key of Object.keys(files)) {
      for (const file of files[key]) {
        try {
          // Extract public_id from the Cloudinary URL
          const publicId = file.filename
          await cloudinary.uploader.destroy(publicId)
          console.log(`Deleted file from Cloudinary: ${publicId}`)
        } catch (error) {
          console.error("Error deleting file from Cloudinary:", error)
        }
      }
    }
  }
}

// Add a new lab with file uploads
router.post(
  "/add",
  upload.fields([
    { name: "kycDocument", maxCount: 1 },
    { name: "labRateCard", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("Received lab data:", req.body) // Debug log

      const labData = req.body

      // Check for duplicate email
      const emailCheckDb = await Lab.findOne({ email: labData.email })
      if (emailCheckDb) {
        console.log("Email already exists:", emailCheckDb.email)

        // Delete uploaded files from Cloudinary if email exists
        await deleteCloudinaryFiles(req.files)

        return res.status(400).json({ message: "Email already exists!" })
      }

      if (!labData) {
        return res.status(400).json({ message: "Cannot Submit Null data" })
      }

      // Validate required radio button fields
      const requiredRadioFields = [
        "nablAccredited",
        "biomedicalWasteAgreement",
        "homeCollectionAvailable",
        "aayushBrandedKits",
        "radiologyServicesAvailable",
      ]

      for (const field of requiredRadioFields) {
        if (!labData[field] || (labData[field] !== "Yes" && labData[field] !== "No")) {
          return res.status(400).json({
            message: `${field} is required and must be either "Yes" or "No"`,
          })
        }
      }

      // Add Cloudinary file URLs to lab data
      if (req.files) {
        if (req.files.kycDocument && req.files.kycDocument[0]) {
          labData.kycDocumentPath = req.files.kycDocument[0].path // Cloudinary URL
          labData.kycDocumentPublicId = req.files.kycDocument[0].filename // Cloudinary public_id
        } else {
          return res.status(400).json({ message: "KYC document is required" })
        }

        if (req.files.labRateCard && req.files.labRateCard[0]) {
          labData.labRateCardPath = req.files.labRateCard[0].path // Cloudinary URL
          labData.labRateCardPublicId = req.files.labRateCard[0].filename // Cloudinary public_id
        } else {
          return res.status(400).json({ message: "Lab rate card is required" })
        }
      } else {
        return res.status(400).json({ message: "Required files are missing" })
      }

      // Save lab details
      const newLab = new Lab(labData)
      await newLab.save()

      console.log("Lab saved successfully:", newLab._id) // Debug log

      res.status(201).json({
        message: "Lab added successfully",
        lab: newLab,
      })
    } catch (error) {
      console.error("Error adding lab:", error)

      // Delete uploaded files from Cloudinary if there's an error
      await deleteCloudinaryFiles(req.files)

      res.status(500).json({
        message: "Error onboarding lab data",
        error: error.message,
      })
    }
  },
)

// Get all labs
router.get("/all", async (req, res) => {
  try {
    const labs = await Lab.find().sort({ _id: -1 }).lean()
    res.json(labs)
  } catch (error) {
    console.error("Error fetching labs:", error)
    res.status(500).json({ error: "Error fetching labs", details: error.message })
  }
})

// Download labs as Excel
router.get("/download", async (req, res) => {
  try {
    const labs = await Lab.find()

    const workbook = new excel.Workbook()
    const worksheet = workbook.addWorksheet("Labs")

    worksheet.columns = [
      { header: "SNo", key: "sno", width: 5 },
      { header: "Facility Name", key: "facilityName", width: 30 },
      { header: "Facility Type", key: "facilityType", width: 20 },
      { header: "Full Address", key: "fullAddress", width: 40 },
      { header: "City/District", key: "cityDistrict", width: 20 },
      { header: "State", key: "state", width: 20 },
      { header: "Pincode", key: "pincode", width: 10 },
      { header: "Google Maps Location", key: "googleMapsLocation", width: 30 },
      { header: "Date of Establishment", key: "dateOfEstablishment", width: 20 },
      { header: "Owner Name", key: "ownerName", width: 25 },
      { header: "Designation", key: "designation", width: 20 },
      { header: "Primary Mobile", key: "primaryMobile", width: 15 },
      { header: "Alternate Contact", key: "alternateContact", width: 15 },
      { header: "Email", key: "email", width: 30 },
      { header: "Reception Number", key: "receptionNumber", width: 15 },
      { header: "KYC Document Type", key: "kycDocumentType", width: 20 },
      { header: "KYC Document URL", key: "kycDocumentPath", width: 50 }, // Now contains Cloudinary URL
      { header: "Lab License Number", key: "labLicenseNumber", width: 20 },
      { header: "Issuing Authority", key: "issuingAuthority", width: 25 },
      { header: "License Valid Till", key: "licenseValidTill", width: 20 },
      { header: "Lab Technician Name", key: "labTechnicianName", width: 25 },
      { header: "Lab Technician License Number", key: "labTechnicianLicenseNumber", width: 25 },
      { header: "NABL Accredited", key: "nablAccredited", width: 15 },
      { header: "Other Certifications", key: "otherCertifications", width: 30 },
      { header: "Biomedical Waste Agreement", key: "biomedicalWasteAgreement", width: 25 },
      { header: "Operating Hours", key: "operatingHours", width: 20 },
      { header: "Days of Operation", key: "daysOfOperation", width: 25 },
      { header: "Home Collection Available", key: "homeCollectionAvailable", width: 25 },
      { header: "Trained Phlebotomists", key: "trainedPhlebotomists", width: 20 },
      { header: "Aayush Branded Kits", key: "aayushBrandedKits", width: 20 },
      { header: "Radiology Services Available", key: "radiologyServicesAvailable", width: 25 },
      { header: "Radiology Modalities", key: "radiologyModalities", width: 30 },
      { header: "Special Diagnostics", key: "specialDiagnostics", width: 30 },
      { header: "Daily Sample Capacity", key: "dailySampleCapacity", width: 20 },
      { header: "Routine Test Turnaround", key: "routineTestTurnaround", width: 25 },
      { header: "Radiology Report Turnaround", key: "radiologyReportTurnaround", width: 25 },
      { header: "Lab Rate Card URL", key: "labRateCardPath", width: 50 }, // Now contains Cloudinary URL
      { header: "Additional Notes", key: "additionalNotes", width: 50 },
      { header: "Created At", key: "createdAt", width: 20 },
    ]

    labs.forEach((lab, index) => {
      worksheet.addRow({
        sno: index + 1,
        facilityName: lab.facilityName,
        facilityType: lab.facilityType,
        fullAddress: lab.fullAddress,
        cityDistrict: lab.cityDistrict,
        state: lab.state,
        pincode: lab.pincode || "N/A",
        googleMapsLocation: lab.googleMapsLocation || "N/A",
        dateOfEstablishment: lab.dateOfEstablishment ? lab.dateOfEstablishment.toDateString() : "N/A",
        ownerName: lab.ownerName,
        designation: lab.designation,
        primaryMobile: lab.primaryMobile,
        alternateContact: lab.alternateContact || "N/A",
        email: lab.email,
        receptionNumber: lab.receptionNumber || "N/A",
        kycDocumentType: lab.kycDocumentType || "N/A",
        kycDocumentPath: lab.kycDocumentPath || "N/A", // Cloudinary URL
        labLicenseNumber: lab.labLicenseNumber,
        issuingAuthority: lab.issuingAuthority,
        licenseValidTill: lab.licenseValidTill ? lab.licenseValidTill.toDateString() : "N/A",
        labTechnicianName: lab.labTechnicianName,
        labTechnicianLicenseNumber: lab.labTechnicianLicenseNumber,
        nablAccredited: lab.nablAccredited,
        otherCertifications: lab.otherCertifications || "N/A",
        biomedicalWasteAgreement: lab.biomedicalWasteAgreement,
        operatingHours: lab.operatingHours,
        daysOfOperation: lab.daysOfOperation,
        homeCollectionAvailable: lab.homeCollectionAvailable,
        trainedPhlebotomists: lab.trainedPhlebotomists || "N/A",
        aayushBrandedKits: lab.aayushBrandedKits,
        radiologyServicesAvailable: lab.radiologyServicesAvailable,
        radiologyModalities: lab.radiologyModalities || "N/A",
        specialDiagnostics: lab.specialDiagnostics || "N/A",
        dailySampleCapacity: lab.dailySampleCapacity,
        routineTestTurnaround: lab.routineTestTurnaround,
        radiologyReportTurnaround: lab.radiologyReportTurnaround || "N/A",
        labRateCardPath: lab.labRateCardPath || "N/A", // Cloudinary URL
        additionalNotes: lab.additionalNotes || "N/A",
        createdAt: lab.createdAt ? lab.createdAt.toDateString() : "N/A",
      })
    })

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", "attachment; filename=labs.xlsx")

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error("Error generating Excel:", error)
    res.status(500).json({ error: "Error generating Excel file" })
  }
})

module.exports = router
