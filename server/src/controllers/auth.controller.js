const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

// 로그인
async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: '아이디와 비밀번호를 입력해주세요.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM admin_users WHERE username = ? LIMIT 1',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

// 어드민 계정 생성 (최초 세팅이나 관리자가 직접 호출)
async function register(req, res) {
  const { username, password, name } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ message: '아이디, 비밀번호, 이름을 모두 입력해주세요.' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM admin_users WHERE username = ? LIMIT 1',
      [username]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: '이미 존재하는 아이디입니다.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO admin_users (username, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [username, passwordHash, name, 'admin']
    );

    res.status(201).json({ message: '계정이 생성되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

// 내 정보 확인 (토큰 검증용)
async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, register, me };
