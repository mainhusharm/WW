import { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const form = formidable({ uploadDir, keepExtensions: true });

        form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Error parsing form:', err);
        return res.status(500).json({ error: 'Error uploading file.' });
      }

      const emailField = fields.email;
      const email = Array.isArray(emailField) ? emailField[0] : emailField;

      const screenshotFile = files.screenshot;
      const file = Array.isArray(screenshotFile) ? screenshotFile[0] : screenshotFile;

      if (!file || !email) {
        if (file) {
          fs.unlinkSync(file.filepath);
        }
        return res.status(400).json({ error: 'Missing file or email.' });
      }

      try {
        const sanitizedEmail = email.replace(/[@.]/g, '_');
        const newFilename = `${sanitizedEmail}${path.extname(file.originalFilename || file.newFilename)}`;
        const newPath = path.join(uploadDir, newFilename);

        // Remove old screenshot for the same user if it exists
        const filesInDir = fs.readdirSync(uploadDir);
        filesInDir.forEach(f => {
          if (f.startsWith(sanitizedEmail)) {
            fs.unlinkSync(path.join(uploadDir, f));
          }
        });

        fs.renameSync(file.filepath, newPath);

        console.log('Screenshot uploaded and renamed to:', newFilename);
        res.status(200).json({ message: 'Screenshot uploaded successfully.', path: `/uploads/${newFilename}` });
      } catch (renameErr) {
        console.error('Error processing file:', renameErr);
        fs.unlinkSync(file.filepath);
        res.status(500).json({ error: 'Error processing file.' });
      }
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
