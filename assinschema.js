import mongoose from "mongoose";

const PDFschema = new mongoose.Schema({
    name: {type: String, required: true},
    fileName: String,
    pdf: {
        fileUrl: {type: String, required: true},
        uploadDate: { type: Date, default: Date.now },
    }
})

const assinmodel = mongoose.model("assinPDF", PDFschema)
export default assinmodel