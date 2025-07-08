
const express = require("express");
const router = express.Router();
const Healthagent = require("../models/Healthagent");
const excel = require("exceljs");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");

// Multer Storage Configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadToCloudinary = async (fileBuffer, folder) => {
  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type:"auto", folder },
      (err, result) => {
        if (err) reject(err);
        else resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};

// **1. Add a new doctor with file uploads**
router.post(
  "/add",
  upload.fields([
   
    { name: "panCard", maxCount: 1 },
    { name: "certificates", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const HealthagentData = req.body;
      const emailBody = HealthagentData.email;
      const emailCheckDb = await Healthagent.findOne({ email : emailBody});
    if (emailCheckDb){
      console.log("Email already exists:", emailCheckDb.email);
      // Handle duplicate email scenario
      return res.status(400).json({ message: "Email already exists!" });
    }

      if (!HealthagentData){
         res.send({message:false , Error: "Cannot Submit Null data"})
      }
      // Upload files to Cloudinary
     

      const panCardFile = req.files?.["panCard"]?.[0];
      const panUrl = panCardFile
        ? await uploadToCloudinary(req.files["panCard"][0].buffer, "pan_cards")
        : "";
        const certificateFile = req.files?.["certificates"]?.[0];
      const certificateUrls = certificateFile
        ? await Promise.all(
            req.files["certificates"].map((file) => uploadToCloudinary(file.buffer, "certificates"))
          )
        : [];

      // Save doctor details with Cloudinary URLs, including establishment
      const newHealthagent =  new Healthagent({
        ...HealthagentData,
        establishment: HealthagentData.establishment, // Added Establishment Field
       
        panCard: panUrl,
        certificates: certificateUrls,
      });

      await newHealthagent.save();
      res.status(201).json({ message: " added successfully", healthagent: newHealthagent });
    } catch (error) {
      console.error("Error adding :", error);
      res.status(500).json({message: "Error saving  data" , error});
    }
  }
);

// **2. Get all doctors**
router.get("/all", async (req, res) => {
  try {
    const healthagents = await Doctor.find().sort({ _id: -1 }).lean();
    res.json(healthagents);
  } catch (error) {
    res.status(500).json({ error: "Error fetching data", error });
  }
});

// **3. Download doctors as Excel**
router.get("/download", async (req, res) => {
  try {
    const healthagents = await Healthagent.find();

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("Healthagent");

    worksheet.columns = [
      { header: "SNo", key: "sno", width: 5 },
      { header: "First Name", key: "firstName", width: 20 },
      { header: "Last Name", key: "lastName", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 20 },
      { header: "Address", key: "address", width: 30 },
      { header: "City", key: "city", width: 20 },
      { header: "State", key: "state", width: 20 },
      { header: "Postal Code", key: "postalCode", width: 15 },   
      { header: "occupation", key: "occupation", width: 15 },
      { header: "workexp", key: "workexp", width: 20 },
      { header: "Organizations", key: "Organizations", width: 15 },
      { header: "qualification", key: "qualification", width: 15 },
      { header: "yearOfCompletion", key: "yearOfCompletion", width: 30 },
      { header: "collegeInstitute", key: "collegeInstitute", width: 35 },
      { header: "Years of Experience", key: "yearsOfExperience", width: 15 },    
      { header: "Additional Notes", key: "additionalNotes", width: 50 },
      
    ];

    healthagents.forEach((doc, index) => {
      worksheet.addRow({
        sno: index + 1,
        ...doc.toObject(),
        establishment: doc.establishment || "Not specified", // Added Establishment Data
        aadharCard: doc.aadharCard || "Not uploaded",
        panCard: doc.panCard || "Not uploaded",
        certificates: doc.certificates > 0 ? doc.certificates.join(", ") : "Not uploaded",
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=doctors.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel:", error);
    res.status(500).json({ error: "Error generating Excel file" });
  }
});

module.exports = router;


