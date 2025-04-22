import express from 'express';
import mongodb from './mongodb.js';
import cors from 'cors';
import dbmschema from './schema.js';
import assinmodel from './assinschema.js';
import multer from 'multer'
import QRCode from 'qrcode';

const app = express();
const port = 5200;

// Middleware to parse JSON body
app.use(express.json());

// CORS Setup
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'],
  credentials: true,
};
app.use(cors(corsOptions));

// Static Files
app.use('/files', express.static('files'));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, './files');
  },
  filename: function (req, file, cb) {
      const uniqueSuffix = Date.now();
      cb(null, uniqueSuffix + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Login Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json('Missing username or password');
  }

  try {
    const user = await dbmschema.findOne({ username });

    if (!user) {
      return res.status(404).json('No Record Exist');
    }

    if (user.password !== password) {
      return res.status(401).json('Password Incorrect');
    }

    return res.status(200).json('Success');
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json('Server Error');
  }
});


app.post("/upload-files", upload.single("file"), async (req, res) => {
  try {
    console.log("File received:", req.file);
    console.log("Request Body:", req.body);

    const file = req.file;
    const receiver = req.body.receiver;

    if (!file || !receiver) {
      return res.status(400).json({ message: 'Missing file or receiver name' });
    }

    const fileUrl = `https://qr-send-sdn5.vercel.app/${file.filename}`; // Public URL

    const newDoc = new assinmodel({
      name: receiver, // ⬅️ Save it to the `name` field in schema
      fileName: file.originalname,
      pdf: {
        fileUrl: file.path,
        // uploadDate is automatically handled by schema's default
      }
    });

    await newDoc.save();
    const qrDataUrl = await QRCode.toDataURL(fileUrl);
    console.log(qrDataUrl);

    res.json({
      success: true,
      pdf: {
        fileUrl: file.path,
        receiver,
      },
      qrcode: qrDataUrl
    });

  } catch (error) {
    console.error("Error in file upload route:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});


app.get("/get-pdf", async (req, res) => {
  try {
      const data = await assinmodel.find({});
      res.status(200).json({ status: "ok", data });
  } catch (error) {
      console.error("Error fetching PDFs:", error);
      res.status(500).json({ status: "error", message: "Server error" });
  }
});

app.post('/verify', async (req, res) => {
  const { username, liveDescriptor } = req.body;

  try {
    const user = await dbmschema.findOne({ username });

    if (!user || !user.discriptor) {
      return res.json({ match: false, message: "❌ User or face data not found." });
    }

    const storedDescriptor = user.discriptor;

    console.log("👉 Stored Descriptor:", storedDescriptor);
    console.log("👉 Live Descriptor:", liveDescriptor);

    // Ensure both are arrays of length 128
    if (!Array.isArray(storedDescriptor) || !Array.isArray(liveDescriptor) ||
        storedDescriptor.length !== 128 || liveDescriptor.length !== 128) {
      return res.json({ match: false, message: "❌ Descriptor format invalid." });
    }

    const euclideanDistance = (a, b) =>
      Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));

    const distance = euclideanDistance(liveDescriptor, storedDescriptor);
    const isMatch = distance < 0.6;

    res.json({
      match: isMatch,
      message: isMatch ? "✅ Face matched!" : "❌ Face does not match."
    });

  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Server error during face verification." });
  }
});

// Connect DB and Start Server
mongodb().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
  });
});
