require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post("/api/contact", async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});