require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const ratelimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration Helmet assouplie
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ----------------------------------------------------
// Configuration du stockage avec Multer (Fichiers Audio)
// ----------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public/audio');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté. Envoie un fichier audio.'));
    }
  }
});

// ----------------------------------------------------
// Routes API (Upload & Tracks)
// ----------------------------------------------------

app.post('/api/upload', upload.single('audioTrack'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier reçu.' });
  }

  const trackPath = `audio/${req.file.filename}`;
  res.json({
    message: 'Fichier ajouté avec succès !',
    title: req.body.title || req.file.originalname.replace(/\.[^/.]+$/, ""),
    artist: req.body.artist || 'Artiste inconnu',
    src: trackPath
  });
});

app.get('/api/tracks', (req, res) => {
  const audioDir = path.join(__dirname, 'public/audio');

  if (!fs.existsSync(audioDir)) {
    return res.json([]);
  }

  fs.readdir(audioDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de la lecture des fichiers audio.' });
    }

    const audioFiles = files.filter(file => /\.(mp3|wav|ogg)$/i.test(file));

    const tracks = audioFiles.map(file => ({
      title: file.replace(/^\d+-/, '').replace(/\.[^/.]+$/, ""),
      artist: 'Musique du serveur',
      src: `audio/${file}`
    }));

    res.json(tracks);
  });
});

// ----------------------------------------------------
// Configuration Nodemailer & Route Contact
// ----------------------------------------------------
// Transporter optimisé pour Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Limiteur de requêtes (désactivé ou augmenté pendant tes tests)
const contactlimiter = ratelimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Augmenté à 20 pour éviter de te bloquer durant les tests
  message: { ok: false, error: "Trop de messages envoyés, réessaie plus tard." }
});

app.post("/api/contact", contactlimiter, async (req, res) => {
  const { nom, email, message, sujet } = req.body;

  if (!nom || !email || !message) {
    return res.status(400).json({ ok: false, error: "Tous les champs obligatoires doivent être remplis." });
  }

  const mailOptions = {
    from: `"${nom}" <${process.env.EMAIL_USER}>`,
    to: process.env.RECEIVER_EMAIL || process.env.EMAIL_USER,
    subject: `[Portfolio] ${sujet || 'Nouveau message'} de ${nom}`,
    text: `Sujet: ${sujet || 'Non précisé'}\nNom: ${nom}\nEmail: ${email}\n\nMessage:\n${message}`,
    replyTo: email
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé avec succès de la part de ${nom} (${email})`);
    res.json({ ok: true });
  } catch (error) {
    console.error("❌ Erreur serveur Nodemailer :", error);
    res.status(500).json({ ok: false, error: "Erreur lors de l'envoi du mail." });
  }
});

// ----------------------------------------------------
// Gestion 404 et Lancement du serveur
// ----------------------------------------------------
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public/404.html"));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});