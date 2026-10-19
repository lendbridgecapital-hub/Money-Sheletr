const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname)));

// Neon Database Connection Pool
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : null;

// Initialize Database Table on start if DATABASE_URL is configured
async function initDb() {
  if (!pool) {
    console.warn('⚠️ DATABASE_URL not set. Inquiries will be logged to console only.');
    return;
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS loan_inquiries (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL,
        client_phone VARCHAR(20) NOT NULL,
        client_city VARCHAR(100) NOT NULL DEFAULT 'Satara',
        branch_id VARCHAR(50) DEFAULT 'br_satara_01',
        branch_name VARCHAR(100) DEFAULT 'Satara Branch',
        loan_category VARCHAR(150) NOT NULL,
        loan_ticket VARCHAR(100) NOT NULL,
        cibil_profile VARCHAR(150),
        client_notes TEXT,
        source_domain VARCHAR(100) DEFAULT 'www.lendbridgecapital.in',
        status VARCHAR(50) DEFAULT 'NEW',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Ensure branch columns exist in case the table was created earlier
    await pool.query(`
      ALTER TABLE loan_inquiries ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50) DEFAULT 'br_satara_01';
      ALTER TABLE loan_inquiries ADD COLUMN IF NOT EXISTS branch_name VARCHAR(100) DEFAULT 'Satara Branch';
    `);
    console.log('✅ Connected to Neon PostgreSQL database and ensured table & Satara branch mapping exists.');
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
  }
}
initDb();

// Health check endpoint for Render
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'LendBridge Capital Web Service' });
});

// API endpoint to receive and store loan inquiries in Neon DB
app.post('/api/inquiries', async (req, res) => {
  const {
    clientName,
    clientPhone,
    clientCity,
    loanCategory,
    loanTicket,
    cibilProfile,
    clientNotes
  } = req.body;

  if (!clientName || !clientPhone) {
    return res.status(400).json({ success: false, message: 'Name and Phone are required.' });
  }

  // All inquiries from website strictly routed to Satara Branch (br_satara_01)
  const assignedBranchId = 'br_satara_01';
  const assignedBranchName = 'Satara Branch';
  const assignedCity = clientCity || 'Satara';

  try {
    if (pool) {
      const query = `
        INSERT INTO loan_inquiries (
          client_name, client_phone, client_city, branch_id, branch_name, loan_category, loan_ticket, cibil_profile, client_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, created_at;
      `;
      const values = [
        clientName,
        clientPhone,
        assignedCity,
        assignedBranchId,
        assignedBranchName,
        loanCategory || 'Home Loans',
        loanTicket || '₹50 Lakh – ₹2 Crore',
        cibilProfile || 'Standard',
        clientNotes || ''
      ];
      const result = await pool.query(query, values);

      // If loan_applications table exists in shared Neon DB, sync lead under Satara Branch
      try {
        const checkApps = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'loan_applications'
          );
        `);
        if (checkApps.rows[0]?.exists) {
          const appId = `app_lb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          const token = `lb_${Date.now()}`;
          await pool.query(`
            INSERT INTO loan_applications (
              id, tenant_id, token, branch_id, created_by_id, status, full_name, mobile, loan_type, loan_amount, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;
          `, [
            appId,
            'default',
            token,
            assignedBranchId,
            'lendbridge_web',
            'NEW_LEAD',
            clientName,
            clientPhone,
            loanCategory || 'Home Loans',
            0
          ]);
          console.log(`[Synced to loan_applications under Satara Branch (${assignedBranchId})]`);
        }
      } catch (syncErr) {
        // Non-blocking sync log
        console.warn('Note: loan_applications sync skipped:', syncErr.message);
      }

      console.log(`[Lead Saved - Satara Branch br_satara_01] ID: ${result.rows[0].id} for ${clientName}`);
      return res.status(201).json({
        success: true,
        message: 'Inquiry saved successfully under Satara Branch.',
        leadId: result.rows[0].id,
        branchId: assignedBranchId,
        branchName: assignedBranchName
      });
    } else {
      console.log(`[Lead Saved (No DB configured) - Satara Branch br_satara_01]:`, {
        ...req.body,
        branchId: assignedBranchId,
        branchName: assignedBranchName
      });
      return res.status(200).json({
        success: true,
        message: 'Inquiry received under Satara Branch.',
        branchId: assignedBranchId,
        branchName: assignedBranchName
      });
    }
  } catch (err) {
    console.error('Error saving inquiry:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to record inquiry.',
      error: err.message
    });
  }
});

// Fallback to index.html for SPA/direct navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 LendBridge Capital server running on port ${PORT}`);
});
