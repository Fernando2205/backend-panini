const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const register = async (req, res, next) => {
  try {
    const { nombre, email, password, pais } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y password son requeridos' });
    }

    const existingUser = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'El email ya esta registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, pais) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, pais, created_at',
      [nombre, email, passwordHash, pais || null]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, nombre: user.nombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      user: { id: user.id, nombre: user.nombre, email: user.email, pais: user.pais },
      token,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son requeridos' });
    }

    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, nombre: user.nombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      user: { id: user.id, nombre: user.nombre, email: user.email, pais: user.pais, foto_perfil: user.foto_perfil },
      token,
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, pais, foto_perfil, created_at FROM usuarios WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { nombre, foto_perfil, pais } = req.body;
    const result = await pool.query(
      'UPDATE usuarios SET nombre = COALESCE($1, nombre), foto_perfil = COALESCE($2, foto_perfil), pais = COALESCE($3, pais) WHERE id = $4 RETURNING id, nombre, email, pais, foto_perfil',
      [nombre, foto_perfil, pais, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile, updateProfile };
