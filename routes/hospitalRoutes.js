
const express = require("express");
const router = express.Router();
const Hospital = require("../models/Hospital");
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
      const HospitalData = req.body;
      const emailBody = HospitalData.email;
      const emailCheckDb = await Hospital.findOne({ email : emailBody});
    if (emailCheckDb){
      console.log("Email already exists:", emailCheckDb.email);
      // Handle duplicate email scenario
      return res.status(400).json({ message: "Email already exists!" });
    }

      if (!HospitalData){
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
      const newHospital =  new Hospital({
        ...HospitalData,
        establishment: HospitalData.establishment, // Added Establishment Field
       
        panCard: panUrl,
        certificates: certificateUrls,
      });

      await newHospital.save();
      res.status(201).json({ message: "Hospital added successfully", hospital: newHospital });
    } catch (error) {
      console.error("Error adding Hospital:", error);
      res.status(500).json({message: "Error saving Hospital data" , error});
    }
  }
);

// **2. Get all doctors**
router.get("/all", async (req, res) => {
  try {
    const hospitals = await Hospital.find().sort({ _id: -1 }).lean();
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Hospital", error });
  }
});

// **3. Download doctors as Excel**
router.get("/download", async (req, res) => {
  try {
    const hospital = await Hospital.find();

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("Hospital");

    worksheet.columns = [
      { header: "SNo", key: "sno", width: 5 },
      { header: "First Name", key: "firstName", width: 200 },
      { header: "Last Name", key: "lastName", width: 200 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 20 },
      { header: "designation", key: "designation", width: 30 },
      { header: "hospitalname", key: "hospitalname", width: 200 },    
      { header: "hospitaltype", key: "hospitaltype", width: 25 },
      { header: "registrationNumber", key: "registrationNumber", width: 25 },
      { header: "Accreditation", key: "Accreditation", width: 100 },
      { header: "EstablishedYear", key: "EstablishedYear", width: 105 },
      { header: "hospitaladd", key: "hospitaladd", width: 105 },    
      { header: "country", key: "country", width: 50 },
      { header: "additionalNotes", key: "additionalNotes", width: 500 },
      
    ];

   


    hospital.forEach((doc, index) => {
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
    res.setHeader("Content-Disposition", "attachment; filename=hospital.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel:", error);
    res.status(500).json({ error: "Error generating Excel file" });
  }
});

module.exports = router;
