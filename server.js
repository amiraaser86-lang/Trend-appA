const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const uploadBase = path.join(__dirname, 'uploads');
const folders = ['photos', 'videos', 'pdfs', 'external'];
folders.forEach(folder => fs.ensureDirSync(path.join(uploadBase, folder)));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'photos';
        if (file.mimetype.startsWith('video/')) folder = 'videos';
        else if (file.mimetype === 'application/pdf') folder = 'pdfs';
        cb(null, path.join(uploadBase, folder));
    },
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const externalStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(uploadBase, 'external')),
    filename: (req, file, cb) => cb(null, 'ext_' + Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage: storage });
const externalUpload = multer({ storage: externalStorage });

app.post('/upload', upload.single('file'), (req, res) => res.json({ success: true }));
app.post('/api/external/upload', externalUpload.single('file'), (req, res) => res.json({ success: true, url: `/uploads/external/${req.file.filename}` }));

app.get('/files', (req, res) => {
    const allFiles = [];
    folders.forEach(folder => {
        const dirPath = path.join(uploadBase, folder);
        if (fs.existsSync(dirPath)) {
            fs.readdirSync(dirPath).forEach(file => allFiles.push({ name: file, type: folder, url: `/uploads/${folder}/${file}` }));
        }
    });
    res.json(allFiles);
});

app.get('/api/clients', (req, res) => res.json([{ name: "ويب 1" }, { name: "ويب 2" }]));

app.use('/uploads', express.static(uploadBase));
app.listen(3000, () => console.log('Server running on http://localhost:3000'));