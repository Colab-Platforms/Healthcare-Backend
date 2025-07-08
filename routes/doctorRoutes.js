
const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");
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
      const doctorData = req.body;
      const emailBody = doctorData.email;
      const emailCheckDb = await Doctor.findOne({ email : emailBody});
    if (emailCheckDb){
      console.log("Email already exists:", emailCheckDb.email);
      // Handle duplicate email scenario
      return res.status(400).json({ message: "Email already exists!" });
    }

      if (!doctorData){
         res.send({message:false , Error: "Cannot Submit Null data"})
      }
      // Upload files to Cloudinary
     

      const panUrl = req.files["panCard"]
        ? await uploadToCloudinary(req.files["panCard"][0].buffer, "pan_cards")
        : res.send({message: "pan card cannot be empty"});

      const certificateUrls = req.files["certificates"]
        ? await Promise.all(
            req.files["certificates"].map((file) => uploadToCloudinary(file.buffer, "certificates"))
          )
        : [];

      // Save doctor details with Cloudinary URLs, including establishment
      const newDoctor = await new Doctor({
        ...doctorData,
        establishment: doctorData.establishment, // Added Establishment Field
       
        panCard: panUrl,
        certificates: certificateUrls,
      });

      await newDoctor.save();
      res.status(201).json({ message: "Doctor added successfully", doctor: newDoctor });
    } catch (error) {
      console.error("Error adding doctor:", error);
      res.status(500).json({message: "Error saving doctor data" , error});
    }
  }
);

// **2. Get all doctors**
router.get("/all", async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ _id: -1 }).lean();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: "Error fetching doctors", error });
  }
});

// **3. Download doctors as Excel**
router.get("/download", async (req, res) => {
  try {
    const doctors = await Doctor.find();

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("Doctors");

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
      { header: "Registration Number", key: "registrationNumber", width: 25 },
      { header: "Registration Council", key: "registrationCouncil", width: 30 },
      { header: "Registration Year", key: "registrationYear", width: 15 },
      { header: "Qualification", key: "qualification", width: 20 },
      { header: "Year of Completion", key: "yearOfCompletion", width: 15 },
      { header: "College/Institute", key: "collegeInstitute", width: 30 },
      { header: "Years of Experience", key: "yearsOfExperience", width: 15 },
      { header: "Specialty", key: "specialty", width: 20 },
      { header: "Locality", key: "locality", width: 20 },
      { header: "Establishment", key: "establishment", width: 30 }, // Added Establishment Field
      { header: "City1", key: "city1", width: 20 },
      { header: "State1", key: "state1", width: 20 },
      { header: "Additional Notes", key: "additionalNotes", width: 50 },
      { header: "Aadhaar Card", key: "aadharCard", width: 30 },
      { header: "PAN Card", key: "panCard", width: 30 },
      { header: "Certificates", key: "certificates", width: 50 },
    ];

    doctors.forEach((doc, index) => {
      worksheet.addRow({
        sno: index + 1,
        ...doc.toObject(),
        establishment: doc.establishment || "Not specified", // Added Establishment Data
        aadharCard: doc.aadharCard || "Not uploaded",
        panCard: doc.panCard || "Not uploaded",
        certificates: doc.certificates.length > 0 ? doc.certificates.join(", ") : "Not uploaded",
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
