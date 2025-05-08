import express from 'express';
import cors from 'cors';
import dbmschema from './schema.js';
import assinmodel from './assinschema.js';
import multer from 'multer'
import QRCode from 'qrcode';
import mongoose from "mongoose";
import { json } from 'express';
import {S3Client} from "@aws-sdk/client-s3"
import multerS3 from "multer-s3"
import dotenv from 'dotenv'

dotenv.config();

const app = express();

app.use(json());

const bitlyToken = "bde93ba015dcf5b142ee80804f45378c83a6e3a6";

const s3Client = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  }
});

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`Incoming Request IP: ${ip}`);
  next();
});


const MONGO_URI = "mongodb+srv://neelpriyansh:BUHM0hbEryFmL4Aw@cluster0.mtjrnw1.mongodb.net/";
mongoose.connect(MONGO_URI || "mongodb://localhost:27017/")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Connection Error:", err));


// Static Files
app.use('/files', express.static('files'));

const awsupload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: 'myawswala',
    contentType: multerS3.AUTO_CONTENT_TYPE, 
    contentDisposition: 'inline',  
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + "_" + file.originalname);
    }
  })
})

// // Multer setup for file uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//       cb(null, './files');
//   },
//   filename: function (req, file, cb) {
//       const uniqueSuffix = Date.now();
//       cb(null, uniqueSuffix + file.originalname);
//   }
// });
// const upload = multer({ storage: storage });

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

app.get("/get-user-by-rfid/:rfid", async(req, res) => {
  try {
    const rfid = req.params.rfid;
    const user = await assinmodel.findOne({ rfid });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.json({
      success: true,
      label: user.label,
      pdfUrl: user.pdf.fileUrl 
    });

  } catch (error) {
    console.error("Error fetching user by RFID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
})

app.post("/upload-files", awsupload.single("file"), async (req, res) => {
  try {
    console.log("File received:", req.file);
    console.log("Request Body:", req.body);

    const file = req.file;
    const receiver = req.body.receiver;
    const label = req.body.label;

    if (!file || !receiver) {
      return res.status(400).json({ message: 'Missing file or receiver name' });
    }
    let rfid;
    if (receiver.toLowerCase() === 'yashpandey') {
      rfid = '3518510840'; 
    } else if(receiver.toLowerCase() === 'altamashbeg') {
      rfid = '2345246456';
    // } else if(receiver === 'Priyansh Neel'){
    //   rfid = '1234456778';
    }
    else{
      console.log("User Not Found")
    }
    const fileUrl = req.file.location; // ✅ public-facing URL
    const viewerFileUrl = "https://docs.google.com/viewer?url=" + fileUrl; // Use for viewing

    // const tinyResponse = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(viewerFileUrl)}`);
    // const shorturl = tinyResponse.data;
    const longUrl = viewerFileUrl;
    try {
      const bitlyResponse = await axios.post(
        "https://api-ssl.bitly.com/v4/shorten",
        { long_url: longUrl },
        {
          headers: {
            Authorization: `Bearer ${bitlyToken}`,
            "Content-Type": "application/json"
          }
        }
      );
      shorturl = bitlyResponse.data.link;
    } catch (err) {
      console.warn("Bitly shortening failed, using original viewer URL", err.message);
    }

    const newDoc = new assinmodel({
      name: receiver, // ⬅️ Save it to the `name` field in schema
      rfid: rfid,
      label: label,
      fileName: file.originalname,
      pdf: {
        fileUrl: viewerFileUrl,
        shortUrlpls: shorturl,
      }
    });
    await newDoc.save();

    console.log("Saving to DB:", {
      name: receiver,
      rfid,
      label,
      fileName: file.originalname,
      pdf: {
        fileUrl: viewerFileUrl,
        shortUrlpls: shorturl,
      }
    });
    

    const qrDataUrl = await QRCode.toDataURL(shorturl);

    console.log(qrDataUrl);

    res.json({
      success: true,
      fileName: file.filename, 
      label,
      rfid,      
      viewerFileUrl: viewerFileUrl,
      shortUrlpls: shorturl,
      receiver,
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

app.get('/', (req, res) => {
  res.status(200).send({
    activeStatus: true,
    error: false,
    message: "Server is working!"
  });
});

const PORT = 60000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at ${PORT}`);
  });
