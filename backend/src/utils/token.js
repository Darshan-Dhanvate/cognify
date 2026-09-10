import jwt from 'jsonwebtoken';
export default function tokenFor(id) { return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' }); }
