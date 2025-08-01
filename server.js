const express = require('express');
const sql = require('mssql');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());


const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


const emailCooldowns = {}; 
const COOLDOWN_TIME = 60 * 1000; 


app.post('/enviar', async (req, res) => {
  const { nome, email, telefone, mensagem } = req.body;
  const now = Date.now();

  
  if (emailCooldowns[email] && (now - emailCooldowns[email]) < COOLDOWN_TIME) {
    const segundos = Math.ceil((COOLDOWN_TIME - (now - emailCooldowns[email])) / 1000);
    return res.status(429).json({ error: `Aguarde ${segundos} segundos antes de enviar novamente.` });
  }

  try {
  
    await sql.connect(dbConfig);
    await sql.query`
      INSERT INTO Contato (nome, email, telefone, mensagem)
      VALUES (${nome}, ${email}, ${telefone}, ${mensagem})
    `;

    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Novo contato pelo site',
      text: `Nome: ${nome}\nEmail: ${email}\nTelefone: ${telefone}\nMensagem:\n${mensagem}`
    });

    
    emailCooldowns[email] = now;

    res.status(200).json({ message: 'Enviado com sucesso' });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
});


app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
