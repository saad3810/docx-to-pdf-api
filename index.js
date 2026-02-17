const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const app = express();

app.use(cors());

// Multer: memory upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  }
});

// Home test
app.get("/", (req, res) => {
  res.send("DOCX to PDF API running...");
});

// Convert route (Direct LibreOffice)
app.post("/convert", upload.single("file"), async (req, res) => {
  try {

    if (!req.file || req.file.size === 0) {
      return res.status(400).send("Invalid file");
    }

    const tempDir = path.join(__dirname, "temp");

    // Create temp folder if missing
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Temp filenames
    const inputPath = path.join(
      tempDir,
      Date.now() + ".docx"
    );

    const outputDir = tempDir;

    const outputPdf = inputPath.replace(".docx", ".pdf");

    // Save file
    fs.writeFileSync(inputPath, req.file.buffer);

    console.log("Saved:", inputPath);

    // LibreOffice command
    const command = `"soffice" --headless --convert-to pdf "${inputPath}" --outdir "${outputDir}"`;

    exec(command, (error, stdout, stderr) => {

      if (error) {
        console.error("Libre error:", error);
        return res.status(500).send("Conversion failed");
      }

      if (!fs.existsSync(outputPdf)) {
        console.error("PDF not created");
        return res.status(500).send("PDF not generated");
      }

      // Send PDF
      res.download(outputPdf, "converted.pdf", () => {

        // Cleanup
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPdf);

      });

    });

  } catch (err) {

    console.error("Server error:", err);

    res.status(500).send("Internal error");

  }
});

// Start
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
