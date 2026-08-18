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

app.use(helmet());
app.use(express.json());
app.use(express.static('public'));

// ----------------------------------------------------
// Configuration du stockage avec Multer
// ----------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public/audio');
    // Crée le dossier s'il n'existe pas encore
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Conserve un horodatage pour éviter les doublons de nom
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accepte uniquement les fichiers audio
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté. Envoie un fichier audio.'));
    }
  }
});

// ----------------------------------------------------
// Routes API (Upload, Tracks, Contact)
// ----------------------------------------------------

// Route d'upload
app.post('/api/upload', upload.single('audioTrack'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier reçu.' });
  }

  // Renvoie le chemin relatif pour le player JS
  const trackPath = `audio/${req.file.filename}`;
  res.json({
    message: 'Fichier ajouté avec succès !',
    title: req.body.title || req.file.originalname.replace(/\.[^/.]+$/, ""),
    artist: req.body.artist || 'Artiste inconnu',
    src: trackPath
  });
});

// Route pour récupérer automatiquement tous les morceaux du serveur
app.get('/api/tracks', (req, res) => {
  const audioDir = path.join(__dirname, 'public/audio');

  // Vérifie si le dossier existe
  if (!fs.existsSync(audioDir)) {
    return res.json([]);
  }

  fs.readdir(audioDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de la lecture des fichiers audio.' });
    }

    // Filtre uniquement les fichiers audio (.mp3, .wav, .ogg)
    const audioFiles = files.filter(file => /\.(mp3|wav|ogg)$/i.test(file));

    // Formate la liste pour le lecteur JS
    const tracks = audioFiles.map(file => ({
      // Retire l'horodatage initial (s'il existe) et l'extension pour le titre
      title: file.replace(/^\d+-/, '').replace(/\.[^/.]+$/, ""),
      artist: 'Musique du serveur',
      src: `audio/${file}`
    }));

    res.json(tracks);
  });
});

// Configuration Nodemailer et Rate Limiter pour la page de contact
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const contactlimiter = ratelimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { ok: false, error: "Trop de messages envoyés, réessaie plus tard." }
});

app.post("/api/contact", contactlimiter, async (req, res) => {
  const { nom, email, message } = req.body;

  if (!nom || !email || !message) {
    return res.status(400).json({ ok: false, error: "Champs manquants." });
  }

  const mailOptions = {
    from: `"${nom}" <${process.env.EMAIL_USER}>`,
    to: process.env.RECEIVER_EMAIL || process.env.EMAIL_USER,
    subject: `[Portfolio] Nouveau message de ${nom}`,
    text: `Nom: ${nom}\nEmail: ${email}\n\nMessage:\n${message}`,
    replyTo: email
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email envoyé de la part de ${nom}`);
    res.json({ ok: true });
  } catch (error) {
    console.error("Erreur lors de l'envoi du mail :", error);
    res.status(500).json({ ok: false, error: "Impossible d'envoyer l'email." });
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