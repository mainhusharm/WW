// Load environment variables - try .env.local first (dev), then fallback to system env vars (production)
require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { Resend } = require('resend');

const app = express();
const prisma = new PrismaClient();

// Simplified and secure CORS configuration for production
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [
      'https://www.traderedgepro.com',
      'https://traderedgepro.com',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000',
    ];

// Add any onrender.com frontend URLs to the allowed origins
if (process.env.NODE_ENV === 'production') {
    allowedOrigins.push(/https:\/\/frontend-.*\.onrender\.com$/);
}

console.log('CORS Origins configured for:', allowedOrigins);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ... (rest of the file remains the same) ...
