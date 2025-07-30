import multer from 'multer'
import fs from 'fs'
import path from 'path'

// Ensure the upload directory exists
const uploadDir = './public/temp'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}`)
  }
})

const upload = multer({ storage: storage })

export default upload