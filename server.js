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

// ========================= ROTA CONTATO =========================
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

// ========================= ROTA LOGIN =========================
app.post('/login', async (req, res) => {
  const { cpf, senha } = req.body;

  try {
    await sql.connect(dbConfig);

    const resultado = await sql.query`
      SELECT c.idCliente, c.nome, c.email
      FROM Clientes c
      JOIN Usuarios u ON c.idCliente = u.idCliente
      WHERE c.cpf = ${cpf} AND u.senha = ${senha}
    `;

    if (resultado.recordset.length === 0) {
      return res.status(401).json({ error: 'CPF ou senha inválidos' });
    }

    const cliente = resultado.recordset[0];

    const contratos = await sql.query`
      SELECT idContrato, descricao, status, dataAtivacao
      FROM Contratos
      WHERE idCliente = ${cliente.idCliente}
    `;

    res.status(200).json({
      cliente: {
        idCliente: cliente.idCliente,
        nome: cliente.nome,
        email: cliente.email
      },
      contratos: contratos.recordset
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// ========================= ROTA ESQUECI SENHA =========================
app.post('/esqueci-senha', async (req, res) => {
  const { cpf } = req.body;

  if (!cpf) {
    return res.status(400).json({ error: 'CPF é obrigatório' });
  }

  try {
    await sql.connect(dbConfig);

    const resultado = await sql.query`
      SELECT c.idCliente, c.email
      FROM Clientes c
      WHERE c.cpf = ${cpf}
    `;

    if (resultado.recordset.length === 0) {
      return res.status(404).json({ error: 'CPF não encontrado' });
    }

    const cliente = resultado.recordset[0];
    const novaSenha = Math.random().toString(36).slice(-8);

    await sql.query`
      UPDATE Usuarios
      SET senha = ${novaSenha}
      WHERE idCliente = ${cliente.idCliente}
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: cliente.email,
      subject: 'Nova senha - Netico',
      text: `Olá!\n\nSua nova senha de acesso é: ${novaSenha}\n\nVocê pode alterá-la após o login.\n\nAtenciosamente,\nEquipe Netico`
    });

    res.status(200).json({ message: 'Nova senha enviada para seu e-mail' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro interno ao redefinir senha' });
  }
});

// ========================= ROTA CONTRATOS DO CLIENTE =========================
app.get("/contratos", async (req, res) => {
  const { idCliente } = req.query;
  try {
    await sql.connect(dbConfig);
    const result = await sql.query`
      SELECT idContrato, descricao, status, dataAtivacao
      FROM Contratos
      WHERE idCliente = ${idCliente}
    `;
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar contratos" });
  }
});

// ========================= ROTA CONTRATO + TITULAR =========================
app.get("/api/contrato/:id", async (req, res) => {
  try {
    const contratoId = req.params.id;

    await sql.connect(dbConfig);
    const result = await sql.query`
      SELECT c.idContrato, c.numeroContrato, cli.nome AS nomeTitular
      FROM Contratos c
      INNER JOIN Clientes cli ON c.idCliente = cli.idCliente
      WHERE c.idContrato = ${contratoId}
    `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ erro: "Contrato não encontrado" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar contrato" });
  }
});

// ========================= INICIAR SERVIDOR =========================
app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
