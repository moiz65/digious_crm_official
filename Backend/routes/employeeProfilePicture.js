// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const cloudinary = require("../config/cloudinary");
// const pool = require("../config/database");

// // Configure multer for file upload
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 20 * 1024 * 1024, // ✅ CORRECT: 20MB (20 × 1024 × 1024)
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith("image/")) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only image files are allowed!"), false);
//     }
//   },
// });

// // Error handling middleware for multer
// const handleMulterError = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     if (err.code === "LIMIT_FILE_SIZE") {
//       return res.status(400).json({
//         success: false,
//         message: "File size is too large. Maximum size is 20MB.",
//         maxSize: "20MB",
//       });
//     }
//     return res.status(400).json({
//       success: false,
//       message: "File upload error: " + err.code,
//       error: err.message,
//     });
//   } else if (err) {
//     return res.status(400).json({
//       success: false,
//       message: err.message,
//     });
//   }
//   next();
// };

// // Upload profile picture via multipart form
// router.post(
//   "/:id/profile-picture",
//   upload.single("profile_picture"),
//   handleMulterError, // ✅ Add error handler
//   async (req, res) => {
//     const { id } = req.params;

//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "No image file provided",
//       });
//     }

//     try {
//       // Log file details for debugging
//       const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
//       console.log(`📁 File Upload: ${req.file.originalname}`);
//       console.log(`📊 File Size: ${fileSizeMB} MB`);
//       console.log(`📄 File Type: ${req.file.mimetype}`);

//       // Check file size before processing
//       if (req.file.size > 20 * 1024 * 1024) {
//         return res.status(400).json({
//           success: false,
//           message: `File size (${fileSizeMB}MB) exceeds maximum limit of 20MB`,
//           maxSize: "20MB",
//           actualSize: `${fileSizeMB}MB`,
//         });
//       }

//       // Convert buffer to base64 for Cloudinary
//       const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

//       // Log base64 size for debugging
//       const base64SizeKB = Math.round(base64Image.length / 1024);
//       console.log(`📈 Base64 size: ${base64SizeKB} KB`);

//       // Upload to Cloudinary
//       const uploadResult = await new Promise((resolve, reject) => {
//         cloudinary.uploader.upload(
//           base64Image,
//           {
//             folder: "employee_profiles",
//             public_id: `employee_${id}_profile_${Date.now()}`,
//             overwrite: true,
//             transformation: [
//               { width: 500, height: 500, crop: "fill" },
//               { quality: "auto:good", fetch_format: "auto" },
//             ],
//           },
//           (error, result) => {
//             if (error) {
//               console.error("❌ Cloudinary upload error:", error);
//               reject(error);
//             } else {
//               console.log(
//                 "✅ Cloudinary upload successful:",
//                 result.secure_url,
//               );
//               resolve(result);
//             }
//           },
//         );
//       });

//       // Update database with Cloudinary URL
//       const connection = await pool.getConnection();
//       const [result] = await connection.query(
//         `UPDATE employee_onboarding SET profile_picture = ? WHERE id = ?`,
//         [uploadResult.secure_url, id],
//       );

//       // Check if update was successful
//       if (result.affectedRows === 0) {
//         throw new Error("Employee not found");
//       }

//       connection.release();

//       res.json({
//         success: true,
//         message: "Profile picture uploaded successfully",
//         profile_picture_url: uploadResult.secure_url,
//         profile_picture_public_id: uploadResult.public_id,
//         file_size: `${fileSizeMB} MB`,
//       });
//     } catch (error) {
//       console.error("❌ Error uploading profile picture:", error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to upload profile picture",
//         error: error.message,
//       });
//     }
//   },
// );


// // Delete profile picture
// router.delete("/:id/profile-picture", async (req, res) => {
//   const { id } = req.params;

//   try {
//     const connection = await pool.getConnection();

//     // First get the current profile picture URL
//     const [results] = await connection.query(
//       `SELECT profile_picture FROM employee_onboarding WHERE id = ?`,
//       [id],
//     );

//     if (results.length === 0) {
//       connection.release();
//       return res.status(404).json({
//         success: false,
//         message: "Employee not found",
//       });
//     }

//     const profilePictureUrl = results[0].profile_picture;

//     if (profilePictureUrl) {
//       // Extract public_id from Cloudinary URL
//       const urlParts = profilePictureUrl.split("/");
//       const fileName = urlParts[urlParts.length - 1];
//       const publicId = fileName.split(".")[0];
//       const folder = "employee_profiles";
//       const fullPublicId = `${folder}/${publicId}`;

//       // Delete from Cloudinary
//       await new Promise((resolve, reject) => {
//         cloudinary.uploader.destroy(fullPublicId, (error, result) => {
//           if (error) reject(error);
//           else resolve(result);
//         });
//       });
//     }

//     // Remove from database
//     await connection.query(
//       `UPDATE employee_onboarding SET profile_picture = NULL WHERE id = ?`,
//       [id],
//     );

//     connection.release();

//     res.json({
//       success: true,
//       message: "Profile picture deleted successfully",
//     });
//   } catch (error) {
//     console.error("Error deleting profile picture:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to delete profile picture",
//       error: error.message,
//     });
//   }
// });

// module.exports = router;
