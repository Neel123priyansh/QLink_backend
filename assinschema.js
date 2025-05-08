import mongoose from 'mongoose';

const PDFschema = new mongoose.Schema({
    name: {type: String, required: true},
    rfid: {type: Number, required: true},
    label: {type: String, required: true},
    fileName: { type: String, required: true },
    pdf: {
        fileUrl: {type: String, required: true},
        shortUrlpls: {type: String, require: true}, 
        uploadDate: { type: Date, default: Date.now },
    }
})

const assinmodel = mongoose.model("assinPDF", PDFschema)

export default assinmodel;