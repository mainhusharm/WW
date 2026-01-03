import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5176; // Changed to 5176 to avoid conflict with your Vite server

// Serve static files from public directory
app.use(express.static('public'));

// Serve the signup page at /signup-enhanced
app.get('/signup-enhanced', (req, res) => {
    const signupPath = path.join(__dirname, 'signup-enhanced-production.html');
    
    if (fs.existsSync(signupPath)) {
        res.sendFile(signupPath);
    } else {
        res.status(404).send('Signup page not found');
    }
});

// Fallback for other routes
app.get('*', (req, res) => {
    res.status(404).send(`
        <h1>404 - Page Not Found</h1>
        <p>Available routes:</p>
        <ul>
            <li><a href="/signup-enhanced">Signup Enhanced</a></li>
            <li><a href="/signup-enhanced.html">Signup Enhanced (Direct)</a></li>
        </ul>
        <p><strong>Note:</strong> Your main Vite app is running at <a href="http://localhost:5175">http://localhost:5175</a></p>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 Signup server running at http://localhost:${PORT}`);
    console.log(`📝 Signup page available at: http://localhost:${PORT}/signup-enhanced`);
    console.log(`📝 Direct access: http://localhost:${PORT}/signup-enhanced.html`);
    console.log(`🔗 Your main Vite app is still at: http://localhost:5175`);
});
