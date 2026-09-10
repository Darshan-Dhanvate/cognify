import User from '../models/User.js';
import tokenFor from '../utils/token.js';

export async function register(req, res) { try { const { username, email, password } = req.body; if (!username || !email || !password) return res.status(400).json({ message: 'Username, email and password are required' }); const user = await User.create({ username, email, password }); res.status(201).json({ _id: user._id, username: user.username, email: user.email, token: tokenFor(user._id) }); } catch (e) { res.status(400).json({ message: e.code === 11000 ? 'Username or email already exists' : e.message }); } }
export async function login(req, res) { const user = await User.findOne({ email: req.body.email }); if (!user || !(await user.matchesPassword(req.body.password || ''))) return res.status(401).json({ message: 'Invalid email or password' }); res.json({ _id: user._id, username: user.username, email: user.email, token: tokenFor(user._id) }); }
