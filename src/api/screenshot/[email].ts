import { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { email } = req.query;

  if (typeof email !== 'string') {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  try {
    const sanitizedEmail = email.replace(/[@.]/g, '_');
    const files = fs.readdirSync(uploadDir);
    const userFile = files.find(file => file.startsWith(sanitizedEmail));

    if (userFile) {
      const fileUrl = `/uploads/${userFile}`;
      res.status(200).json({ url: fileUrl });
    } else {
      res.status(404).json({ error: 'Screenshot not found.' });
    }
  } catch (error) {
    console.error('Error reading upload directory:', error);
    res.status(500).json({ error: 'Server error while fetching screenshot.' });
  }
}
