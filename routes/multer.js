const multer = require("multer");
const { v4: uuidv4 } = require("uuid"); // Destructuring the import
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/images/uploads')); // Use path.join for cross-platform compatibility
  },
  filename: function (req, file, cb) {
    const unique = uuidv4();
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

module.exports = upload;
