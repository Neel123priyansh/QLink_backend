# QLink_Backend ⚙️

QLink_Backend is the Node.js + Express server that powers the QLink system. It allows admins to upload PDF documents (like IDs, reports, certificates) for specific users identified by their RFID tags. It generates public-facing short links and stores all metadata securely in MongoDB.

> 🧠 Designed to work with [QLink](https://github.com/Neel123priyansh/QLink) frontend hardware for RFID-based QR code document access.

---

## 📦 Tech Stack

- ⚙️ Node.js + Express
- 📁 AWS S3 for PDF storage
- 🔗 Bitly API for secure short URLs
- 🧠 MongoDB with Mongoose
- 🧪 REST API with JSON response

---

## 🔧 Features

- 📤 Upload PDFs with labels, receiver name
- 📑 Generate Google Docs Viewer URLs
- 🔗 Auto-shortens URLs using Bitly API
- 🧾 Save document metadata and link in MongoDB
- 📲 Query by RFID to get latest file info
- 🖼️ Generates QR Code from the Bitly link

---

## 📁 API Endpoints

### `POST /upload-files`
Upload a PDF file for a specific user.

**Form-Data Fields:**
- `file` – PDF file
- `receiver` – Name of the receiver
- `label` – Label for the document

> ✅ Automatically generates short URL and stores everything in MongoDB.

---

### `GET /get-user-by-rfid/:rfid`
Returns the most recent uploaded document (with QR code link) for the given RFID.

**Returns:**
```json
{
  "name": "Priyansh Neel",
  "rfid": "3518510840",
  "label": "Driving License",
  "fileName": "license.pdf",
  "pdf": {
    "fileUrl": "https://docs.google.com/viewer?url=...",
    "shortUrlpls": "https://bit.ly/..."
  }
}
