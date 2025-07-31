const express = require('express');
const sql = require('mssql');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());


const dbConfig = {
  user: 'usuario_formulario',
  password: 'GrupoPrime@123',
  server: 'localhost',
  database: 'Contatos',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};



const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'henriquesantanamiguel@gmail.com',
    pass: 'jkxo wbjz xrsr ulkl' 
  }
});


app.post('/enviar', async (req, res) => {
  const { nome, email, telefone, mensagem } = req.body;

  try {

    await sql.connect(dbConfig);
    await sql.query`
      INSERT INTO Contato (nome, email, telefone, mensagem)
      VALUES (${nome}, ${email}, ${telefone}, ${mensagem})
    `;


    await transporter.sendMail({
      from: 'henriquesantanamiguel@gmail.com',
      to: 'henriquesantanamiguel@gmail.com',
      subject: 'Novo contato pelo site',
      text: `Nome: ${nome}\nEmail: ${email}\nTelefone: ${telefone}\nMensagem:\n${mensagem}`
    });

    res.status(200).json({ message: 'Enviado com sucesso' });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
