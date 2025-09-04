// Automated clustering endpoint was moved below so it is registered after app initialization.
// See the correctly placed handler later in this file (after `const app = express();`).


// ...existing code...
/*
Miles Car Delivery – Clustering & Assignment Logic

Overview:
The Miles Car Delivery system manages car delivery jobs by grouping them into clusters to optimize driver routes and reduce empty journeys. Jobs are entered into Google Sheets, matched based on location and timing, and reviewed by an admin before being assigned to drivers via Glide. Automation assists with suggestions and data syncing, but manual checks are critical to ensure accuracy, efficiency, and correct driver allocation.

Step-by-Step Clustering Logic:
1. Start with available jobs (Job Intake table in Google Sheets, confirmed collection/delivery dates).
2. Check locations (collection and delivery locations).
3. Find potential matches (another job that starts near the delivery location of the first job and ends near the collection location of the first job).
   Example: Job A: London → Swindon, Job B: Swindon → London → Match.
4. Create a cluster (matched jobs are tagged with the same Cluster ID, forward/return trip flag assigned).
5. Flag for review (admin manually checks dates, driver availability, and distances).
6. Assign to a driver (approved clusters assigned in Glide, driver sees jobs together as one route).

Clustering in Google Sheets:
- Extra columns: Cluster ID, Forward/Return Flag.
- Automation: Formulas/scripts suggest possible matches.
- Admin review: Manual check before approval.

Clustering in Glide:
- Admin view: Highlighted jobs, Cluster ID, pending approval.
- Driver view: Only approved clusters, displayed as one route.

How it Works – Step-by-Step:
Step 1 – Capturing Driver Availability
  - Google Sheets: Name, Home location, Availability, Restrictions, Workload targets.
  - Glide: Admin sees profiles, drivers can update availability.
Step 2 – Receiving Jobs
  - Sheets: Job ID, Collection/Delivery location, Car details, Buyer/Seller info, Requested time window.
  - Glide: Jobs appear in Admin dashboard, unassigned.
Step 3 – Confirming Collection/Delivery Dates
  - Admin contacts parties, confirms dates in Sheets.
  - Glide displays confirmed dates.
Step 4 – Clustering Jobs
  - Jobs grouped for round trips to reduce empty returns and improve efficiency.
  - System suggests pairs (Delivery ≈ Collection, dates align), Cluster ID assigned, admin reviews/approves.
Step 5 – Assigning Jobs to Drivers
  - Google Sheets matches: Job location ↔ Driver home, Availability ↔ Confirmed dates, Cluster ID.
  - Driver auto-filled, Glide notifies drivers.
Step 6 – Manual Review (Critical Checkpoints)
  - Admin must manually check: Job Intake, Collection/Delivery Dates, Clustering, Final Assignment.

Key Action Points:
1. Admin ensures driver availability in Sheets.
2. Admin inputs jobs into Sheets.
3. Admin confirms collection/delivery dates before assignment.
4. Automation suggests clusters and matches drivers.
5. Admin manually reviews clusters & assignments before finalising.
6. Glide is driver-facing: drivers see jobs only after approval.
*/

// ...existing code...

// ...existing code...
// Place this block AFTER all imports and after 'const app = express();'
import fetch from 'node-fetch';

// In-memory cache for postcode area lookups from API
const postcodeApiCache = {};
// Postcode outward code to region/lat/lon mapping
const POSTCODE_REGIONS = {
  BA: { region: 'South West', lat: 51.38, lon: -2.36 },
  BB: { region: 'North West', lat: 53.74, lon: -2.48 },
  BD: { region: 'North West', lat: 53.79, lon: -1.75 },
  BH: { region: 'South West', lat: 50.72, lon: -1.88 },
  BL: { region: 'North West', lat: 53.58, lon: -2.43 },
  BN: { region: 'South East', lat: 50.83, lon: -0.14 },
  BS: { region: 'South West', lat: 51.45, lon: -2.58 },
  CA: { region: 'North West', lat: 54.89, lon: -2.94 },
  CH: { region: 'North West', lat: 53.2, lon: -2.92 },
  CM: { region: 'East of England', lat: 51.74, lon: 0.47 },
  CT: { region: 'South East', lat: 51.28, lon: 1.08 },
  CW: { region: 'North West', lat: 53.18, lon: -2.44 },
  DA: { region: 'Greater London', lat: 51.44, lon: 0.21 },
  DE: { region: 'East Midlands', lat: 52.92, lon: -1.47 },
  DG: { region: 'Scotland', lat: 55.07, lon: -3.61 },
  DH: { region: 'North East', lat: 54.77, lon: -1.58 },
  DL: { region: 'North East', lat: 54.54, lon: -1.56 },
  DN: { region: 'East Midlands', lat: 53.52, lon: -0.88 },
  DT: { region: 'South West', lat: 50.71, lon: -2.44 },
  EX: { region: 'South West', lat: 50.73, lon: -3.53 },
  FY: { region: 'North West', lat: 53.82, lon: -3.05 },
  GL: { region: 'South West', lat: 51.86, lon: -2.25 },
  GU: { region: 'South East', lat: 51.24, lon: -0.57 },
  HD: { region: 'Yorkshire & Humber', lat: 53.65, lon: -1.79 },
  HG: { region: 'Yorkshire & Humber', lat: 54, lon: -1.54 },
  HP: { region: 'East of England', lat: 51.73, lon: -0.61 },
  HR: { region: 'West Midlands', lat: 52.05, lon: -2.72 },
  HU: { region: 'North East', lat: 53.76, lon: -0.33 },
  HX: { region: 'North West', lat: 53.72, lon: -1.85 },
  IM: { region: 'Isle of Man', lat: 54.15, lon: -4.48 },
  JE: { region: 'Channel Islands', lat: 49.21, lon: -2.13 },
  LA: { region: 'North West', lat: 54.05, lon: -2.8 },
  L: { region: 'North West', lat: 53.41, lon: -2.99 },
  LE: { region: 'East Midlands', lat: 52.64, lon: -1.13 },
  LN: { region: 'East Midlands', lat: 53.23, lon: -0.54 },
  LS: { region: 'Yorkshire & Humber', lat: 53.8, lon: -1.55 },
  LU: { region: 'East of England', lat: 51.88, lon: -0.42 },
  M: { region: 'North West', lat: 53.48, lon: -2.24 },
  ME: { region: 'South East', lat: 51.37, lon: 0.53 },
  MK: { region: 'South East', lat: 52.04, lon: -0.76 },
  NE: { region: 'North East', lat: 54.97, lon: -1.61 },
  NG: { region: 'East Midlands', lat: 52.95, lon: -1.15 },
  NN: { region: 'West Midlands', lat: 52.23, lon: -0.89 },
  NR: { region: 'East of England', lat: 52.63, lon: 1.3 },
  OL: { region: 'North West', lat: 53.54, lon: -2.12 },
  OX: { region: 'South East', lat: 51.75, lon: -1.26 },
  PL: { region: 'South West', lat: 50.37, lon: -4.14 },
  PO: { region: 'South East', lat: 50.82, lon: -1.08 },
  PR: { region: 'North West', lat: 53.76, lon: -2.7 },
  RG: { region: 'South East', lat: 51.45, lon: -1 },
  RH: { region: 'South East', lat: 51.12, lon: -0.17 },
  S: { region: 'Yorkshire & Humber', lat: 53.38, lon: -1.47 },
  SK: { region: 'North West', lat: 53.37, lon: -2.15 },
  SL: { region: 'South East', lat: 51.5, lon: -0.58 },
  SN: { region: 'South West', lat: 51.56, lon: -1.78 },
  SO: { region: 'South East', lat: 50.92, lon: -1.4 },
  SP: { region: 'South West', lat: 51.07, lon: -1.79 },
  SR: { region: 'North East', lat: 54.91, lon: -1.38 },
  SS: { region: 'East of England', lat: 51.55, lon: 0.7 },
  ST: { region: 'West Midlands', lat: 53, lon: -2.18 },
  TA: { region: 'South West', lat: 51.02, lon: -3.11 },
  TQ: { region: 'South West', lat: 50.47, lon: -3.55 },
  TR: { region: 'South West', lat: 50.27, lon: -5.05 },
  TS: { region: 'North East', lat: 54.57, lon: -1.32 },
  WA: { region: 'North West', lat: 53.39, lon: -2.59 },
  WD: { region: 'Greater London', lat: 51.65, lon: -0.4 },
  WF: { region: 'Yorkshire & Humber', lat: 53.69, lon: -1.5 },
  WN: { region: 'North West', lat: 53.54, lon: -2.64 },
  WR: { region: 'West Midlands', lat: 52.19, lon: -2.22 },
  YO: { region: 'North East', lat: 53.96, lon: -1.08 },
  ZE: { region: 'Scotland', lat: 60.16, lon: -1.15 },
};

// Helper: extract outward code from postcode string

// Extract the area (letters) from the postcode (e.g., 'EH1' -> 'EH')
function extractArea(postcode) {
  if (!postcode) return null;
  // UK postcode area: leading 1-2 letters
  const match = postcode.trim().toUpperCase().match(/^([A-Z]{1,2})/);
  return match ? match[1] : null;
}


// Async batch lookup for missing postcodes using postcodes.io
async function batchLookupRegions(postcodes) {
  // Remove duplicates and already-cached
  const unique = Array.from(new Set(postcodes.map(pc => pc.trim().toUpperCase()).filter(pc => pc && !postcodeApiCache[pc])));
  if (unique.length === 0) return;
  try {
    for (let i = 0; i < unique.length; i += 100) {
      const batch = unique.slice(i, i + 100);
      const resp = await fetch('https://api.postcodes.io/postcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postcodes: batch })
      });
      if (!resp.ok) continue;
      const data = await resp.json();
      if (data.status === 200 && Array.isArray(data.result)) {
        for (const r of data.result) {
          if (r.result) {
            // normalize region to a plain string to avoid type surprises later
            const rawRegion = r.result.region || r.result.admin_district || r.result.admin_county || "";
            const region = typeof rawRegion === 'string' ? rawRegion : String(rawRegion || '');
            const lat = r.result.latitude;
            const lon = r.result.longitude;
            postcodeApiCache[r.query.toUpperCase()] = { region, lat, lon };
          } else {
            // store a consistent shape rather than null so consumers can safely access .region
            postcodeApiCache[r.query.toUpperCase()] = { region: '', lat: null, lon: null };
          }
        }
      }
    }
  } catch (e) {
    console.warn('Batch postcode API error:', e.message || e);
  }
}

// Async lookup region: first local, then batch API cache
async function lookupRegionAsync(postcode) {
  const area = extractArea(postcode);
  if (area && POSTCODE_REGIONS[area]) {
    return POSTCODE_REGIONS[area];
  }
  const pc = postcode.trim().toUpperCase();
  if (!pc) return null;
  if (postcodeApiCache[pc]) return postcodeApiCache[pc];
  // If not in cache, return null for now (will be filled by batch)
  return null;
}

// Extract the outward code (e.g., 'EH1' from 'EH1 1BQ')
function extractOutwardCode(postcode) {
  if (!postcode) return null;
  const match = postcode.trim().toUpperCase().match(/^([A-Z]{1,2}[0-9][0-9A-Z]?)/);
  return match ? match[1] : null;
}

// Helper: lookup region info from postcode string
function lookupRegion(postcode) {
  const area = extractArea(postcode);
  if (area && POSTCODE_REGIONS[area]) {
    return POSTCODE_REGIONS[area];
  }
  return null;
}

// Normalize various region-like inputs to a plain region string (safe for comparisons)
function regionToString(v) {
  if (!v && v !== 0) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') {
    if (v.region && typeof v.region === 'string') return v.region;
    // sometimes postcodeApiCache stores { region, lat, lon }
    if (v.region == null && v.lat != null && v.lon != null) return '';
    try {
      return String(v);
    } catch (e) {
      return '';
    }
  }
  return String(v);
}

// Helper: whether a job counts as 'processed' per user definition
function isJobSheetProcessed(job) {
  if (!job) return false;
  const hasJobId = !!(job.job_id || job.jobId);
  const hasDriver = !!(job.selected_driver || job.driver);
  const hasOrder = !!(job.order_no || job.driver_order_sequence);
  const hasCluster = !!(job.cluster_id || job.clusterId);
  return hasJobId && hasDriver && hasOrder && hasCluster;
}
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';


const app = express();
// --- LOG BUFFER PATCHING (place after app = express()) ---
const LOG_BUFFER_SIZE = 500;
let processLogs = [];
let processStartTime = null;
let processEndTime = null;
let processEta = null;

function addLog(line) {
  processLogs.push({ time: new Date().toISOString(), line });
  if (processLogs.length > LOG_BUFFER_SIZE) processLogs.shift();
}

// Patch console.log and console.warn
const origLog = console.log;
const origWarn = console.warn;
console.log = (...args) => {
  addLog(args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
  origLog(...args);
};
console.warn = (...args) => {
  addLog('[WARN] ' + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
  origWarn(...args);
};

// Patch process.stdout and process.stderr
const origStdoutWrite = process.stdout.write.bind(process.stdout);
const origStderrWrite = process.stderr.write.bind(process.stderr);
process.stdout.write = (chunk, encoding, callback) => {
  addLog(chunk.toString().replace(/\n$/, ''));
  return origStdoutWrite(chunk, encoding, callback);
};
process.stderr.write = (chunk, encoding, callback) => {
  addLog('[STDERR] ' + chunk.toString().replace(/\n$/, ''));
  return origStderrWrite(chunk, encoding, callback);
};

// API endpoint to get logs
app.get('/api/process-logs', (req, res) => {
  res.json({
    logs: processLogs.map(l => `[${l.time}] ${l.line}`),
    timeSpent: processStartTime ? ((processEndTime || Date.now()) - processStartTime) / 1000 : 0,
    eta: processEta
  });
});
// Respect platform-provided PORT (e.g., Cloud Run) with fallback
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// Health check endpoint
app.get('/api/health', (req, res) => {
  const diagnostics = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.3',
    environment: process.env.NODE_ENV || 'development',
    credentials: {
      source: process.env.GOOGLE_CLIENT_EMAIL ? 'environment_variables' : 'file',
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL || 'using_file',
      privateKeyAvailable: !!process.env.GOOGLE_PRIVATE_KEY,
      privateKeyLength: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.length : 0,
      privateKeyStart: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.substring(0, 50) : 'using_file'
    },
    jwt: {
      secretAvailable: !!process.env.JWT_SECRET,
      secretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0
    },
    rateLimiting: {
      enabled: true,
      apiLimit: API_RATE_LIMIT,
      windowMs: RATE_LIMIT_WINDOW,
      cacheTtlMs: CACHE_TTL,
      currentCalls: apiCallCount,
      resetTime: new Date(apiCallResetTime).toISOString()
    }
  };
  
  res.status(200).json(diagnostics);
});

// Test Google Sheets connection endpoint
app.get('/api/test-sheets', async (req, res) => {
  try {
    console.log('🧪 Testing Google Sheets connection...');
    const testAuth = new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES,
    });
    const client = await testAuth.getClient();
    console.log('✅ Google Auth client created successfully');
    
    // Try a simple spreadsheet metadata call
    const sheets = google.sheets({ version: 'v4', auth: client });
    const meta = await sheets.spreadsheets.get({ 
      spreadsheetId: SHEET_ID,
      fields: 'properties.title'
    });
    
    res.json({
      success: true,
      message: 'Google Sheets connection successful',
      spreadsheetTitle: meta.data.properties?.title || 'Unknown',
      credentialsSource: process.env.GOOGLE_CLIENT_EMAIL ? 'environment' : 'file'
    });
  } catch (error) {
    console.error('❌ Google Sheets test failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      credentialsSource: process.env.GOOGLE_CLIENT_EMAIL ? 'environment' : 'file'
    });
  }
});

// Configure CORS: allow comma-separated origins via CORS_ORIGIN env, defaults to '*'
// Updated to ensure GitHub Pages origin is properly configured
// Fixed Google Service Account credentials format
const rawCors = process.env.CORS_ORIGIN || '*';
const allowedOrigins = rawCors.split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser or same-origin requests
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json());

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    name: 'MCD Admin Backend API',
    version: '1.0.3',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        verify: 'GET /api/auth/verify'
      },
      data: {
        motorway: 'GET /api/motorway',
        atmoves: 'GET /api/atmoves',
        privateCustomers: 'GET /api/private-customers'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Simple file-backed user store and auth endpoints (no DB)
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const USERS_PATH = path.join(__dirname, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function readUsers() {
  try {
    const raw = fs.readFileSync(USERS_PATH, 'utf8') || '[]';
    return JSON.parse(raw);
  } catch (e) { return []; }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf8');
}

// Initialize default admin user if no users exist
async function initializeAdminUser() {
  try {
    const users = readUsers();
    if (users.length === 0) {
      console.log('🔧 No users found, creating default admin user...');
      const adminPasswordHash = await bcrypt.hash('admin', 10);
      const adminUser = {
        id: generateId('USR'),
        username: 'admin',
        passwordHash: adminPasswordHash,
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      users.push(adminUser);
      writeUsers(users);
      console.log('✅ Default admin user created (username: admin, password: admin)');
    } else {
      console.log(`📊 Found ${users.length} existing user(s)`);
    }
  } catch (error) {
    console.error('❌ Error initializing admin user:', error.message);
  }
}

// Initialize admin user on startup
initializeAdminUser();

// Register user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const users = readUsers();
    if (users.find(u => u.username === username)) return res.status(409).json({ error: 'user exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = { id: generateId('USR'), username, passwordHash: hash };
    users.push(user);
    writeUsers(users);
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const users = readUsers();
    const user = users.find(u => u.username === username);
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Verify token
app.get('/api/auth/verify', authMiddleware, async (req, res) => {
  try {
    // If we reach here, token is valid (authMiddleware passed)
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(401).json({ error: 'user not found' });
    res.json({ user: { id: user.id, username: user.username } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Force create admin user (for development/testing)
app.post('/api/auth/force-admin', async (req, res) => {
  try {
    const users = readUsers();
    // Remove existing admin user if it exists
    const filteredUsers = users.filter(u => u.username !== 'admin');
    
    // Create new admin user
    const adminPasswordHash = await bcrypt.hash('admin', 10);
    const adminUser = {
      id: generateId('USR'),
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    
    filteredUsers.push(adminUser);
    writeUsers(filteredUsers);
    
    res.json({ 
      success: true, 
      message: 'Admin user created/updated',
      credentials: { username: 'admin', password: 'admin' }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// User Management API Endpoints

// Get all users (admin only)
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const users = readUsers();
    const currentUser = users.find(u => u.id === req.user.id);
    
    // Check if user has admin privileges
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Remove password hashes from response
    const safeUsers = users.map(user => {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });

    res.json({ users: safeUsers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get single user
app.get('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const users = readUsers();
    const currentUser = users.find(u => u.id === req.user.id);
    
    // Users can only access their own data unless they're admin
    if (req.params.id !== req.user.id && (!currentUser || currentUser.role !== 'admin')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = users.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create new user (admin only)
app.post('/api/users', authMiddleware, async (req, res) => {
  try {
    const users = readUsers();
    const currentUser = users.find(u => u.id === req.user.id);
    
    // Check if user has admin privileges
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { username, email, password, firstName, lastName, phone, company, role = 'user' } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if username or email already exists
    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: generateId('USR'),
      username,
      email,
      passwordHash,
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || '',
      company: company || '',
      role: role || 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json({ user: safeUser, message: 'User created successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update user (admin or self)
app.put('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const users = readUsers();
    const currentUser = users.find(u => u.id === req.user.id);
    
    // Users can only update their own data unless they're admin
    if (req.params.id !== req.user.id && (!currentUser || currentUser.role !== 'admin')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const userIndex = users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { username, email, password, firstName, lastName, phone, company, role } = req.body;
    
    // Check if new username or email conflicts with existing users
    if (username || email) {
      const conflictingUser = users.find(u => 
        u.id !== req.params.id && (u.username === username || u.email === email)
      );
      if (conflictingUser) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
    }

    // Update user data
    const updatedUser = { ...users[userIndex] };
    if (username) updatedUser.username = username;
    if (email) updatedUser.email = email;
    if (firstName !== undefined) updatedUser.firstName = firstName;
    if (lastName !== undefined) updatedUser.lastName = lastName;
    if (phone !== undefined) updatedUser.phone = phone;
    if (company !== undefined) updatedUser.company = company;
    
    // Only admins can change roles
    if (role && currentUser.role === 'admin') {
      updatedUser.role = role;
    }
    
    // Update password if provided
    if (password && password.trim() !== '') {
      updatedUser.passwordHash = await bcrypt.hash(password, 10);
    }
    
    updatedUser.updatedAt = new Date().toISOString();

    users[userIndex] = updatedUser;
    writeUsers(users);

    const { passwordHash: _, ...safeUser } = updatedUser;
    res.json({ user: safeUser, message: 'User updated successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete user (admin only)
app.delete('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const users = readUsers();
    const currentUser = users.find(u => u.id === req.user.id);
    
    // Check if user has admin privileges
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Prevent self-deletion
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const userIndex = users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users.splice(userIndex, 1);
    writeUsers(users);

    res.json({ message: 'User deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Middleware to protect routes
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
}


// Google Sheets setup
// Google credentials: prefer env vars, fallback to bundled file
const CREDENTIALS_PATH = path.join(__dirname, 'google-credentials.json');
let credentials;
if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
  console.log('✅ Using environment variable credentials');
  console.log('📧 Client email:', process.env.GOOGLE_CLIENT_EMAIL);
  console.log('🔑 Private key available:', !!process.env.GOOGLE_PRIVATE_KEY);
  console.log('🔑 Private key starts with:', process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.substring(0, 30) : 'N/A');
  
  credentials = {
    type: 'service_account',
    project_id: 'mcdplan',
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    // Support newline-escaped secrets and ensure proper formatting
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_CLIENT_EMAIL)}`
  };
} else {
  console.log('📁 Using file-based credentials');
  credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
}
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: SCOPES,
});
const sheets = google.sheets({ version: 'v4', auth });

const SHEET_ID = '1gBNqbz7zO7YNBMnGzgkLCczkJCjsTrERIbtJIJTbLGg';
const SHEETS = {
  motorway: { gid: '1820851670', name: 'Motorway' },
  atmoves: { gid: '1234570391', name: 'AT Moves' },
  privateCustomers: { gid: '334592911', name: 'Private Customers' },
  drivers: { gid: '0', name: 'Drivers' }, // Use sheet index 0 or actual sheet name
};

// In-memory cache
let cache = {
  data: null,
  timestamp: 0,
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes - increased to reduce API calls

// Rate limiting for Google Sheets API
let apiCallCount = 0;
let apiCallResetTime = Date.now();
const API_RATE_LIMIT = 90; // Max calls per minute (Google allows 100, leaving buffer)
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Rate limiting helper
function canMakeApiCall() {
  const now = Date.now();
  if (now - apiCallResetTime >= RATE_LIMIT_WINDOW) {
    apiCallCount = 0;
    apiCallResetTime = now;
  }
  return apiCallCount < API_RATE_LIMIT;
}

function incrementApiCall() {
  apiCallCount++;
}

// In-memory processed jobs store (persist to file/db for production)
let processedJobs = new Set();
const PROCESSED_STORE_PATH = path.join(__dirname, 'processed-jobs.json');

// Load processed jobs from disk if present
function loadProcessedJobsFromDisk() {
  try {
    if (fs.existsSync(PROCESSED_STORE_PATH)) {
      const raw = fs.readFileSync(PROCESSED_STORE_PATH, 'utf8');
      const arr = JSON.parse(raw || '[]');
      processedJobs = new Set(arr);
      console.log(`Loaded ${processedJobs.size} processed job ids from disk.`);
    } else {
      processedJobs = new Set();
    }
  } catch (err) {
    console.warn('Failed to load processed jobs from disk:', err.message || err);
    processedJobs = new Set();
  }
}

function persistProcessedJobsToDisk() {
  try {
    const arr = Array.from(processedJobs);
    fs.writeFileSync(PROCESSED_STORE_PATH, JSON.stringify(arr, null, 2), 'utf8');
  } catch (err) {
    console.warn('Failed to persist processed jobs to disk:', err.message || err);
  }
}

// Load persisted processed jobs now
loadProcessedJobsFromDisk();

async function batchFetchSheets() {
  // Check rate limit before making API call
  if (!canMakeApiCall()) {
    const waitTime = RATE_LIMIT_WINDOW - (Date.now() - apiCallResetTime);
    console.log(`⏳ Rate limit reached. Waiting ${Math.ceil(waitTime/1000)} seconds...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  const ranges = [
    `${SHEETS.motorway.name}!A1:AZ1000`,
    `${SHEETS.atmoves.name}!A1:AZ1000`,
    `${SHEETS.privateCustomers.name}!A1:AZ1000`,
  ];
  
  incrementApiCall();
  console.log(`📊 Making Sheets API call (${apiCallCount}/${API_RATE_LIMIT} this minute)`);
  
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: SHEET_ID,
    ranges,
  });
  console.log('Raw valueRanges from Google Sheets:', JSON.stringify(res.data.valueRanges, null, 2));
  const [motorway, atmoves, privateCustomers] = res.data.valueRanges.map(vr => {
    const rows = vr.values;
    if (!rows || rows.length < 2) return [];
    const headers = rows[0];
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ""; });
      return obj;
    });
  });
  console.log('Parsed jobs:', { motorway, atmoves, privateCustomers });
  return { motorway, atmoves, privateCustomers };
}

// Fetch Drivers sheet and look up region for each driver
async function fetchDriversSheet() {
  // Check rate limit before making API call
  if (!canMakeApiCall()) {
    const waitTime = RATE_LIMIT_WINDOW - (Date.now() - apiCallResetTime);
    console.log(`⏳ Rate limit reached for drivers sheet. Waiting ${Math.ceil(waitTime/1000)} seconds...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  const range = `${SHEETS.drivers.name}!A1:AZ5000`; // Increased from 1000 to 5000 to accommodate more drivers
  
  incrementApiCall();
  console.log(`👥 Fetching drivers sheet (${apiCallCount}/${API_RATE_LIMIT} this minute)`);
  
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  });
  const rows = res.data.values;
  if (!rows || rows.length < 2) return [];
  const headers = rows[0];
  // Find postcode column (case-insensitive)
  const postcodeCol = headers.find(h => h.toLowerCase().includes('postcode'));
  const postcodeIdx = headers.findIndex(h => h.toLowerCase().includes('postcode'));
  // Collect all postcodes for batch lookup
  const postcodes = rows.slice(1).map(row => row[postcodeIdx] || "").filter(Boolean);
  await batchLookupRegions(postcodes);
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] || ""; });
    // Add region info if postcode exists
    if (postcodeIdx !== -1 && row[postcodeIdx]) {
      const regionInfo = lookupRegion(row[postcodeIdx]) || postcodeApiCache[(row[postcodeIdx] || '').trim().toUpperCase()] || {};
      obj.region = regionInfo.region || '';
    } else {
      obj.region = '';
    }
    return obj;
  });
}
// API to get drivers
app.get('/api/drivers', async (req, res) => {
  try {
    const drivers = await fetchDriversSheet();
    res.json(drivers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

async function getCachedData() {
  const now = Date.now();
  if (!cache.data || now - cache.timestamp > CACHE_TTL) {
    console.log(`🔄 Cache expired, fetching fresh data. API calls this minute: ${apiCallCount}/${API_RATE_LIMIT}`);
    cache.data = await batchFetchSheets();
    cache.timestamp = now;
  } else {
    console.log(`📋 Using cached data (${Math.ceil((CACHE_TTL - (now - cache.timestamp)) / 1000)}s remaining)`);
  }
  return cache.data;
}

// API endpoint to check rate limiting status
app.get('/api/rate-limit-status', (req, res) => {
  const now = Date.now();
  const timeUntilReset = Math.max(0, RATE_LIMIT_WINDOW - (now - apiCallResetTime));
  
  res.json({
    apiCallCount,
    maxCalls: API_RATE_LIMIT,
    remainingCalls: Math.max(0, API_RATE_LIMIT - apiCallCount),
    timeUntilReset: Math.ceil(timeUntilReset / 1000),
    cacheAge: cache.data ? Math.floor((now - cache.timestamp) / 1000) : 0,
    cacheTTL: Math.floor(CACHE_TTL / 1000),
    cacheValid: cache.data && (now - cache.timestamp < CACHE_TTL)
  });
});

// Helper to get column letter from index (0-based)
function colLetter(idx) {
  let letter = '';
  while (idx >= 0) {
    letter = String.fromCharCode((idx % 26) + 65) + letter;
    idx = Math.floor(idx / 26) - 1;
  }
  return letter;
}

// Add a new row to a sheet
async function appendRow(sheetName, rowData) {
  try {
    console.log('Appending row to', sheetName, 'with data:', rowData);
    
    // Rate limiting for header fetch
    if (!canMakeApiCall()) {
      const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - apiCallResetTime)) / 1000);
      console.log(`⏳ Rate limit reached, waiting ${waitTime}s before fetching headers...`);
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    }
    
    // Dynamically get header row to determine column count
    console.log(`📊 Making API call for headers (${apiCallCount + 1}/${API_RATE_LIMIT})`);
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!1:1`,
    });
    incrementApiCall();
    
    const headers = headerRes.data.values[0] || [];
    const lastCol = colLetter(headers.length - 1);
    const range = `${sheetName}!A1:${lastCol}1`;
    console.log('Detected headers:', headers);
    console.log('Using range:', range);
    
    // Rate limiting for append
    if (!canMakeApiCall()) {
      const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - apiCallResetTime)) / 1000);
      console.log(`⏳ Rate limit reached, waiting ${waitTime}s before appending...`);
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    }
    
    console.log(`📊 Making API call for append (${apiCallCount + 1}/${API_RATE_LIMIT})`);
    const apiRes = await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [rowData.slice(0, headers.length)] },
    });
    incrementApiCall();
    
    console.log('Google API response:', apiRes.data);
    cache.timestamp = 0; // Invalidate cache
  } catch (err) {
    console.error('Error in appendRow:', err.response?.data || err.message || err);
    throw err;
  }
}

// Update a row in a sheet by row index (1-based, including header)
async function updateRow(sheetName, rowIndex, rowData) {
  console.log('Updating row', rowIndex, 'in', sheetName, 'with data:', rowData);
  
  // Rate limiting
  if (!canMakeApiCall()) {
    const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - apiCallResetTime)) / 1000);
    console.log(`⏳ Rate limit reached, waiting ${waitTime}s before updating...`);
    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
  }
  
  const range = `${sheetName}!A${rowIndex}:AZ${rowIndex}`;
  console.log(`📊 Making API call for update (${apiCallCount + 1}/${API_RATE_LIMIT})`);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [rowData] },
  });
  incrementApiCall();
  
  cache.timestamp = 0; // Invalidate cache
}

// Helper to load/save processed jobs (for persistence, here just in-memory)
function markJobsProcessed(jobIds) {
  jobIds.forEach(id => processedJobs.add(id));
  // Persist to disk
  persistProcessedJobsToDisk();
}

function isJobProcessed(jobId) {
  return processedJobs.has(jobId);
}

// Write processed jobs to a new sheet
async function writeProcessedJobs(jobs, clusterId) {
  const sheetName = 'Processed Jobs';
  try {
    // Check if the sheet exists; if not, create it
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const existing = (meta.data.sheets || []).find(s => s.properties && s.properties.title === sheetName);
  let headers = [];
  // Add extra useful columns: source_sheet, selected_driver, processed_at
  const required = ['cluster_id', 'order_id', 'job_id', 'source_sheet', 'selected_driver', 'processed_at'];

    if (!existing) {
      console.log(`Sheet '${sheetName}' not found. Creating it and initializing headers.`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                  gridProperties: { rowCount: 2000, columnCount: 10 }
                }
              }
            }
          ]
        }
      });
      headers = required.slice();
      // Write header row
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!A1:${colLetter(headers.length - 1)}1`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [headers] },
      });
    } else {
      // Read existing headers and ensure required columns exist
      const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!1:1`,
      });
      headers = headerRes.data.values ? headerRes.data.values[0] : [];
      // If headers are missing (empty sheet), initialize them
      if (!headers || headers.length === 0) {
        headers = required.slice();
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${sheetName}!A1:${colLetter(headers.length - 1)}1`,
          valueInputOption: 'USER_ENTERED',
          resource: { values: [headers] },
        });
      } else {
        const missing = required.filter(r => !headers.includes(r));
        if (missing.length > 0) {
          headers = headers.concat(missing);
          // Update header row to include missing columns
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${sheetName}!A1:${colLetter(headers.length - 1)}1`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [headers] },
          });
        }
      }
    }

    // Prepare rows to append
    let orderId = 1;
    const now = new Date().toISOString();
    // jobs may come as minimal { job_id } or richer objects; support both
    const rows = jobs.map(job => [
      clusterId,
      orderId++,
      job.job_id || job.jobId || '',
      job.source_sheet || job.sheet || '',
      job.selected_driver || job.driver || '',
      job.processed_at || now
    ]);

  // Ensure each row has the same length as headers (pad if necessary)
    const paddedRows = rows.map(r => {
      const copy = r.slice();
      while (copy.length < headers.length) copy.push('');
      return copy;
    });
  console.log(`About to append ${paddedRows.length} row(s) to '${sheetName}' with headers:`, headers);
  console.log('Sample row:', paddedRows[0] || null);
    // Append rows under header columns; using sheet range A1 is safer
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: paddedRows },
    }).then(r => console.log('Processed Jobs append response:', r.data)).catch(e => { throw e; });

    markJobsProcessed(jobs.map(j => j.job_id));
  } catch (err) {
    console.error('Error writing processed jobs to sheet:', err.response?.data || err.message || err);
    throw err;
  }
}

// Ensure 'Processed Jobs' sheet exists with headers; used at startup
async function ensureProcessedSheetExists() {
  const sheetName = 'Processed Jobs';
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const existing = (meta.data.sheets || []).find(s => s.properties && s.properties.title === sheetName);
    const headers = ['cluster_id', 'order_id', 'job_id', 'source_sheet', 'selected_driver', 'processed_at'];
    if (!existing) {
      console.log(`Startup: creating '${sheetName}' sheet with headers.`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        resource: { requests: [{ addSheet: { properties: { title: sheetName, gridProperties: { rowCount: 2000, columnCount: headers.length } } } }] }
      });
      await sheets.spreadsheets.values.update({ spreadsheetId: SHEET_ID, range: `${sheetName}!A1:${colLetter(headers.length-1)}1`, valueInputOption: 'USER_ENTERED', resource: { values: [headers] } });
    } else {
      // Ensure headers exist and include required columns
      const headerRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${sheetName}!1:1` });
      let existingHeaders = headerRes.data.values ? headerRes.data.values[0] : [];
      const missing = headers.filter(h => !existingHeaders.includes(h));
      if (missing.length > 0) {
        existingHeaders = existingHeaders.concat(missing);
        await sheets.spreadsheets.values.update({ spreadsheetId: SHEET_ID, range: `${sheetName}!A1:${colLetter(existingHeaders.length-1)}1`, valueInputOption: 'USER_ENTERED', resource: { values: [existingHeaders] } });
      }
    }
  } catch (err) {
    console.error('Error ensuring Processed Jobs sheet exists at startup:', err.response?.data || err.message || err);
  }
}

// Build or update a consolidated 'Combined Jobs' sheet that contains all rows from the three job sheets
async function writeCombinedJobsSheet() {
  const sheetName = 'Combined Jobs';
  try {
    // Rate limiting for metadata check
    if (!canMakeApiCall()) {
      const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - apiCallResetTime)) / 1000);
      console.log(`⏳ Rate limit reached, waiting ${waitTime}s before getting metadata...`);
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    }
    
    // Get spreadsheet metadata to check existing sheets
    console.log(`📊 Making API call for metadata (${apiCallCount + 1}/${API_RATE_LIMIT})`);
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    incrementApiCall();
    
    const existing = (meta.data.sheets || []).find(s => s.properties && s.properties.title === sheetName);

    // Source sheets to combine
    const sourceSheets = [SHEETS.motorway.name, SHEETS.atmoves.name, SHEETS.privateCustomers.name];

    // Gather headers for each source sheet
    const headersBySheet = {};
    const allHeaderSet = new Set();
    for (const src of sourceSheets) {
      try {
        // Rate limiting for header fetch
        if (!canMakeApiCall()) {
          const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - apiCallResetTime)) / 1000);
          console.log(`⏳ Rate limit reached, waiting ${waitTime}s before getting headers for ${src}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        }
        
        console.log(`📊 Making API call for ${src} headers (${apiCallCount + 1}/${API_RATE_LIMIT})`);
        const hr = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${src}!1:1` });
        incrementApiCall();
        
        const hs = (hr.data.values && hr.data.values[0]) ? hr.data.values[0] : [];
        headersBySheet[src] = hs;
        hs.forEach(h => { if (h) allHeaderSet.add(h); });
      } catch (e) {
        console.warn(`Failed to read headers for ${src}:`, e.response?.data || e.message || e);
        headersBySheet[src] = [];
      }
    }

    // Ensure we include a source column
    allHeaderSet.add('source_sheet');
    const headers = Array.from(allHeaderSet);

    // Create sheet if missing
    if (!existing) {
      console.log(`'${sheetName}' not found. Creating sheet with headers.`);
      
      // Rate limiting for batchUpdate
      if (!canMakeApiCall()) {
        const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - apiCallResetTime)) / 1000);
        console.log(`⏳ Rate limit reached, waiting ${waitTime}s before creating sheet...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      }
      
      console.log(`📊 Making API call for sheet creation (${apiCallCount + 1}/${API_RATE_LIMIT})`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        resource: { requests: [{ addSheet: { properties: { title: sheetName, gridProperties: { rowCount: 5000, columnCount: Math.max(10, headers.length) } } } }] }
      });
      incrementApiCall();
      
      // Rate limiting for header update
      if (!canMakeApiCall()) {
        const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - apiCallResetTime)) / 1000);
        console.log(`⏳ Rate limit reached, waiting ${waitTime}s before updating headers...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      }
      
      console.log(`📊 Making API call for header update (${apiCallCount + 1}/${API_RATE_LIMIT})`);
      await sheets.spreadsheets.values.update({ spreadsheetId: SHEET_ID, range: `${sheetName}!A1:${colLetter(headers.length - 1)}1`, valueInputOption: 'USER_ENTERED', resource: { values: [headers] } });
      incrementApiCall();
    } else {
      // Rate limiting for existing header check
      if (!canMakeApiCall()) {
        const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - apiCallResetTime)) / 1000);
        console.log(`⏳ Rate limit reached, waiting ${waitTime}s before checking existing headers...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      }
      
      // Ensure header row contains our union headers
      console.log(`📊 Making API call for existing headers (${apiCallCount + 1}/${API_RATE_LIMIT})`);
      const hr = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${sheetName}!1:1` });
      incrementApiCall();
      
      let existingHeaders = (hr.data.values && hr.data.values[0]) ? hr.data.values[0] : [];
      const missing = headers.filter(h => !existingHeaders.includes(h));
      if (missing.length > 0 || existingHeaders.length !== headers.length) {
        // Rate limiting for header update
        if (!canMakeApiCall()) {
          const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - apiCallResetTime)) / 1000);
          console.log(`⏳ Rate limit reached, waiting ${waitTime}s before updating headers...`);
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        }
        
        // Use the union order (headers) and write the header row
        console.log(`📊 Making API call for header update (${apiCallCount + 1}/${API_RATE_LIMIT})`);
        await sheets.spreadsheets.values.update({ spreadsheetId: SHEET_ID, range: `${sheetName}!A1:${colLetter(headers.length - 1)}1`, valueInputOption: 'USER_ENTERED', resource: { values: [headers] } });
        incrementApiCall();
      }
    }

    // Rate limiting for batch read
    if (!canMakeApiCall()) {
      const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - apiCallResetTime)) / 1000);
      console.log(`⏳ Rate limit reached, waiting ${waitTime}s before batch read...`);
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    }

    // Read rows from each source sheet (from row 2 onwards)
    const ranges = sourceSheets.map(s => `${s}!A2:AZ10000`);
    console.log(`📊 Making API call for batch read (${apiCallCount + 1}/${API_RATE_LIMIT})`);
    const batch = await sheets.spreadsheets.values.batchGet({ spreadsheetId: SHEET_ID, ranges });
    incrementApiCall();
    const valueRanges = batch.data.valueRanges || [];

    const rows = [];
    for (let i = 0; i < sourceSheets.length; i++) {
      const src = sourceSheets[i];
      const srcHeaders = headersBySheet[src] || [];
      const vr = valueRanges[i] || {};
      const vals = vr.values || [];
      for (const r of vals) {
        // Build an object mapping header -> value for this row
        const obj = {};
        for (let c = 0; c < srcHeaders.length; c++) {
          const h = srcHeaders[c];
          if (h) obj[h] = r[c] || '';
        }
        obj.source_sheet = src;
        // Build row in the union header order
        const rowArr = headers.map(h => obj[h] || '');
        rows.push(rowArr);
      }
    }

    // Rate limiting for final write
    if (!canMakeApiCall()) {
      const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - apiCallResetTime)) / 1000);
      console.log(`⏳ Rate limit reached, waiting ${waitTime}s before final write...`);
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    }

    // Write all data (replace) under the header
    const allValues = [headers].concat(rows);
    const lastRow = allValues.length;
    const lastColLetter = colLetter(headers.length - 1);
    const writeRange = `${sheetName}!A1:${lastColLetter}${Math.max(1, lastRow)}`;
    console.log(`Writing ${rows.length} combined rows to '${sheetName}' (range ${writeRange})`);
    console.log(`📊 Making API call for final write (${apiCallCount + 1}/${API_RATE_LIMIT})`);
    await sheets.spreadsheets.values.update({ spreadsheetId: SHEET_ID, range: writeRange, valueInputOption: 'USER_ENTERED', resource: { values: allValues } });
    incrementApiCall();
    
    cache.timestamp = 0;
    console.log(`Combined Jobs sheet updated with ${rows.length} rows.`);
  } catch (err) {
    console.error('Error building Combined Jobs sheet:', err.response?.data || err.message || err);
    throw err;
  }
}

app.get('/api/motorway', async (req, res) => {
  try {
    const data = await getCachedData();
    res.json(data.motorway);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/atmoves', async (req, res) => {
  try {
    const data = await getCachedData();
    res.json(data.atmoves);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/private-customers', async (req, res) => {
  try {
    const data = await getCachedData();
    res.json(data.privateCustomers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API to add a row
app.post('/api/:sheet/add', async (req, res) => {
  try {
    const { sheet } = req.params;
    const { row } = req.body;
    if (!SHEETS[sheet]) return res.status(400).json({ error: 'Invalid sheet' });
    await appendRow(SHEETS[sheet].name, row);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API to update a row (rowIndex is 1-based, including header)
app.post('/api/:sheet/update', async (req, res) => {
  try {
    const { sheet } = req.params;
    const { rowIndex, row } = req.body;
    if (!SHEETS[sheet]) return res.status(400).json({ error: 'Invalid sheet' });
    await updateRow(SHEETS[sheet].name, rowIndex, row);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Suggest clusters based on delivery/collection location and date
app.get('/api/clusters/suggest', async (req, res) => {
  try {
    const data = await getCachedData();
    // Combine all jobs from all sheets
    let jobs = [...data.motorway, ...data.atmoves, ...data.privateCustomers]
      .filter(job => (job.collection_postcode || job.delivery_postcode));

    // Collect postcodes for batch lookup to get lat/lon and region
    const pcs = [];
    for (const j of jobs) {
      if (j.collection_postcode) pcs.push(j.collection_postcode.trim().toUpperCase());
      if (j.delivery_postcode) pcs.push(j.delivery_postcode.trim().toUpperCase());
    }
    const uniquePcs = Array.from(new Set(pcs.filter(Boolean)));
    if (uniquePcs.length > 0) await batchLookupRegions(uniquePcs);

    // helper to get lat/lon for postcode
    function getLatLonForPc(pc) {
      if (!pc) return null;
      const key = pc.trim().toUpperCase();
      const cached = postcodeApiCache[key];
      if (cached && cached.lat != null && cached.lon != null) return { lat: cached.lat, lon: cached.lon };
      const outward = extractOutwardCode(pc) || extractArea(pc);
      if (outward && POSTCODE_REGIONS[outward]) return { lat: POSTCODE_REGIONS[outward].lat, lon: POSTCODE_REGIONS[outward].lon };
      return null;
    }

    // distance util
    function haversineMiles(a, b) {
      if (!a || !b) return Infinity;
      const toRad = v => (v * Math.PI) / 180;
      const R = 3958.8;
      const dLat = toRad(b.lat - a.lat);
      const dLon = toRad(b.lon - a.lon);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);
      const sinDLat = Math.sin(dLat / 2);
      const sinDLon = Math.sin(dLon / 2);
      const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon));
      return R * c;
    }

    const used = new Set();
    const suggestions = [];
    for (let i = 0; i < jobs.length; i++) {
      if (used.has(i)) continue;
      const a = jobs[i];
      const aDelPc = (a.delivery_postcode || '').toString().trim().toUpperCase();
      const aDelOut = extractOutwardCode(aDelPc) || extractArea(aDelPc);
      const aDelLatLon = getLatLonForPc(aDelPc);
      // find best matching candidate
      let best = null;
      for (let j = 0; j < jobs.length; j++) {
        if (i === j || used.has(j)) continue;
        const b = jobs[j];
        const bColPc = (b.collection_postcode || '').toString().trim().toUpperCase();
        const bColOut = extractOutwardCode(bColPc) || extractArea(bColPc);
        const bColLatLon = getLatLonForPc(bColPc);

        // date proximity (allow same day or +/- 1 day)
        let dateScore = 0;
        if (a.delivery_date && b.collection_date) {
          const da = new Date(a.delivery_date);
          const db = new Date(b.collection_date);
          const dayDiff = Math.round((db - da) / (1000 * 60 * 60 * 24));
          dateScore = Math.abs(dayDiff);
        } else {
          dateScore = 2; // penalize missing dates
        }

        // region/outward match
        const outwardMatch = aDelOut && bColOut && aDelOut === bColOut;
  const regionAraw = lookupRegion(aDelPc) || postcodeApiCache[aDelPc] || '';
  const regionBraw = lookupRegion(bColPc) || postcodeApiCache[bColPc] || '';
  const regionA = regionToString(regionAraw);
  const regionB = regionToString(regionBraw);
  const regionMatch = regionA && regionB && regionA.toLowerCase() === regionB.toLowerCase();

        // distance (if lat/lon available)
        const dist = (aDelLatLon && bColLatLon) ? haversineMiles(aDelLatLon, bColLatLon) : Infinity;

        // scoring: prefer outward match, then region, then close distance, then date proximity
        let score = 1000 + dateScore * 50 + (dist === Infinity ? 500 : Math.round(dist));
        if (outwardMatch) score -= 700;
        if (regionMatch) score -= 300;
        if (dist !== Infinity && dist <= 20) score -= 100;

        // also check reciprocal likelihood: b.delivery -> a.collection
        const bDelPc = (b.delivery_postcode || '').toString().trim().toUpperCase();
        const bDelOut = extractOutwardCode(bDelPc) || extractArea(bDelPc);
        const aColPc = (a.collection_postcode || '').toString().trim().toUpperCase();
        const reciprocal = bDelOut && aColPc && bDelOut === (extractOutwardCode(aColPc) || extractArea(aColPc));
        if (reciprocal) score -= 150;

        if (!best || score < best.score) {
          best = { idx: j, score, job: b, dist, dateScore, outwardMatch, regionMatch };
        }
      }

      if (best && best.score < 900) {
        suggestions.push({ jobs: [a, best.job], score: best.score });
        used.add(i);
        used.add(best.idx);
      }
    }

  // sort suggestions by score
  suggestions.sort((x, y) => x.score - y.score);
  // add temporary cluster ids for suggested pairs so UI can reference them
  const resp = suggestions.map((s, idx) => ({ clusterId: `SUG-${String(idx + 1).padStart(3, '0')}`, jobs: s.jobs, score: s.score }));
  res.json(resp);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Approve a cluster: assign Cluster ID and Forward/Return flag
app.post('/api/clusters/approve', async (req, res) => {
  try {
    const { jobs, clusterId } = req.body; // jobs: [{sheet, rowIndex}], clusterId: string
    // Get headers for each sheet
    let processed = [];
    for (const { sheet, rowIndex, forwardReturnFlag } of jobs) {
      const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${sheet}!1:1`,
      });
      const headers = headerRes.data.values[0] || [];
      const clusterIdx = headers.indexOf('cluster_id');
      const flagIdx = headers.indexOf('forward_return_flag');
      if (clusterIdx === -1 || flagIdx === -1) continue;
      // Get the row
      const rowRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${sheet}!${rowIndex}:${rowIndex}`,
      });
      const row = rowRes.data.values[0] || Array(headers.length).fill("");
      row[clusterIdx] = clusterId;
      row[flagIdx] = forwardReturnFlag;
      // Update the row
      const lastCol = colLetter(headers.length - 1);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheet}!A${rowIndex}:${lastCol}${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [row] },
      });
      // Get the job_id for processed jobs
      const headerRes2 = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${sheet}!1:1`,
      });
      const headers2 = headerRes2.data.values[0] || [];
      const jobIdIdx = headers2.indexOf('job_id');
      if (jobIdIdx === -1) continue;
      const rowRes2 = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${sheet}!${rowIndex}:${rowIndex}`,
      });
      const row2 = rowRes2.data.values[0] || Array(headers2.length).fill("");
      if (!isJobProcessed(row2[jobIdIdx])) {
        processed.push({ job_id: row2[jobIdIdx] });
      }
    }
    if (processed.length > 0) {
      await writeProcessedJobs(processed, clusterId);
    }
    cache.timestamp = 0;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Helper to generate unique IDs
function generateId(prefix) {
  return prefix + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Auto-assign job_id, cluster_id, order_id for all jobs in all sheets
app.post('/api/jobs/auto-assign-ids', async (req, res) => {
  try {
    processStartTime = Date.now();
    processEndTime = null;
    processEta = null;
    console.log('Starting auto-assign of job_id, cluster_id, order_id for all sheets...');
    const data = await getCachedData();
    const sheetsToProcess = [
      { name: SHEETS.motorway.name, jobs: data.motorway },
      { name: SHEETS.atmoves.name, jobs: data.atmoves },
      { name: SHEETS.privateCustomers.name, jobs: data.privateCustomers },
    ];
    for (const { name, jobs } of sheetsToProcess) {
      // Collect all postcodes that need batch lookup (not in local mapping or cache)
      const postcodesToBatch = [];
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        if (job.collection_postcode) {
          const area = extractArea(job.collection_postcode);
          const pc = job.collection_postcode.trim().toUpperCase();
          if ((!area || !POSTCODE_REGIONS[area]) && !postcodeApiCache[pc]) {
            postcodesToBatch.push(pc);
          }
        }
        if (job.delivery_postcode) {
          const area = extractArea(job.delivery_postcode);
          const pc = job.delivery_postcode.trim().toUpperCase();
          if ((!area || !POSTCODE_REGIONS[area]) && !postcodeApiCache[pc]) {
            postcodesToBatch.push(pc);
          }
        }
      }
      if (postcodesToBatch.length > 0) {
        console.log(`Batch looking up ${postcodesToBatch.length} postcodes for ${name}...`);
        await batchLookupRegions(postcodesToBatch);
      }
      console.log(`Processing sheet: ${name}, jobs: ${jobs.length}`);
      // Get headers
      const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${name}!1:1`,
      });
      const headers = headerRes.data.values[0] || [];
      const jobIdIdx = headers.indexOf('job_id');
      const clusterIdIdx = headers.indexOf('cluster_id');
      const orderIdIdx = headers.indexOf('order_id');
      if (jobIdIdx === -1 || clusterIdIdx === -1 || orderIdIdx === -1) {
        console.log(`Sheet ${name} missing required columns, skipping.`);
        continue;
      }
      // Group jobs by cluster_id
      const clusters = {};
      // Collect all updates to batch
      const updates = [];
      // First pass: assign job_id, cluster_id, and region fields if missing, and update row
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        let needsUpdate = false;
        // Assign job_id if missing
        if (!job.job_id) {
          job.job_id = generateId('JOB');
          needsUpdate = true;
        }
        // Assign cluster_id if missing
        if (!job.cluster_id) {
          job.cluster_id = generateId('CLUSTER');
          needsUpdate = true;
        }
        // Assign collection_region and delivery_region if columns exist
        const collectionRegionIdx = headers.indexOf('collection_region');
        const deliveryRegionIdx = headers.indexOf('delivery_region');
  // Use only collection_postcode and delivery_postcode for region lookup
        let collectionPostcode = job.collection_postcode || "";
        let deliveryPostcode = job.delivery_postcode || "";
        let collectionRegion = null, deliveryRegion = null;
        // Logging for collection region
        if (collectionRegionIdx !== -1) {
          const outward = extractOutwardCode(collectionPostcode);
          const area = extractArea(collectionPostcode);
          const regionInfo = await lookupRegionAsync(collectionPostcode);
          collectionRegion = regionInfo ? regionInfo.region : "";
          let flagged = false;
          if (!collectionPostcode) {
            console.warn(`[COLLECTION] Row ${i + 2} in ${name}: MISSING collection_postcode`);
          } else if (!area || !regionInfo || !collectionRegion) {
            console.warn(`[COLLECTION] Row ${i + 2} in ${name}: Unrecognized postcode area or region, flagging as UNKNOWN`);
            collectionRegion = 'UNKNOWN';
            flagged = true;
          }
          console.log(`[COLLECTION] Row ${i + 2} in ${name}: postcode='${collectionPostcode}', outward='${outward}', area='${area}', region='${collectionRegion}'`);
          if (job.collection_region !== collectionRegion) {
            job.collection_region = collectionRegion;
            needsUpdate = true;
            if (flagged) {
              console.log(`Flagged collection_region as UNKNOWN for row ${i + 2} in ${name}`);
            } else {
              console.log(`Will write collection_region for row ${i + 2} in ${name}:`, collectionRegion);
            }
          }
        }
        // Logging for delivery region
        if (deliveryRegionIdx !== -1) {
          const outward = extractOutwardCode(deliveryPostcode);
          const area = extractArea(deliveryPostcode);
          const regionInfo = await lookupRegionAsync(deliveryPostcode);
          deliveryRegion = regionInfo ? regionInfo.region : "";
          let flagged = false;
          if (!deliveryPostcode) {
            console.warn(`[DELIVERY] Row ${i + 2} in ${name}: MISSING delivery_postcode`);
          } else if (!area || !regionInfo || !deliveryRegion) {
            console.warn(`[DELIVERY] Row ${i + 2} in ${name}: Unrecognized postcode area or region, flagging as UNKNOWN`);
            deliveryRegion = 'UNKNOWN';
            flagged = true;
          }
          console.log(`[DELIVERY] Row ${i + 2} in ${name}: postcode='${deliveryPostcode}', outward='${outward}', area='${area}', region='${deliveryRegion}'`);
          if (job.delivery_region !== deliveryRegion) {
            job.delivery_region = deliveryRegion;
            needsUpdate = true;
            if (flagged) {
              console.log(`Flagged delivery_region as UNKNOWN for row ${i + 2} in ${name}`);
            } else {
              console.log(`Will write delivery_region for row ${i + 2} in ${name}:`, deliveryRegion);
            }
          }
        }
        // Group by cluster_id for order_id assignment
        if (!clusters[job.cluster_id]) clusters[job.cluster_id] = [];
        clusters[job.cluster_id].push({ job, rowIdx: i + 2 });
        // Always build row using headers
        const row = headers.map(h => job[h] || "");
        if (needsUpdate) {
          updates.push({ rowIdx: i + 2, row });
        }
      }
      // Second pass: assign order_id within each cluster and update row if needed
      for (const clusterJobs of Object.values(clusters)) {
        clusterJobs.sort((a, b) => (a.job.collection_date || '').localeCompare(b.job.collection_date || ''));
        for (let idx = 0; idx < clusterJobs.length; idx++) {
          const entry = clusterJobs[idx];
          if (entry.job.order_id !== String(idx + 1)) {
            entry.job.order_id = String(idx + 1);
            // Always build row using headers
            const row = headers.map(h => entry.job[h] || "");
            updates.push({ rowIdx: entry.rowIdx, row });
          }
        }
      }
      // Batch update all rows for this sheet
      if (updates.length > 0) {
        // Sort by rowIdx ascending for consistency
        updates.sort((a, b) => a.rowIdx - b.rowIdx);
        // Prepare ranges and data for batchUpdate
        const requests = updates.map(update => {
          const lastCol = colLetter(headers.length - 1);
          return {
            range: `${name}!A${update.rowIdx}:${lastCol}${update.rowIdx}`,
            values: [update.row]
          };
        });
        // Google Sheets API does not support true batch update for values, but we can use batchUpdate with multiple update requests
        const data = requests.map(r => ({ range: r.range, values: r.values }));
        try {
          console.log(`Batch updating ${updates.length} rows in ${name}`);
          await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: SHEET_ID,
            resource: { data, valueInputOption: 'USER_ENTERED' },
          });
        } catch (err) {
          console.error(`Failed batch update in ${name}:`, err.response?.data || err.message || err);
        }
      }
    }
  processEndTime = Date.now();
  processEta = null;
  console.log('Auto-assign process complete.');
  cache.timestamp = 0;
  res.json({ success: true });
  } catch (e) {
    processEndTime = Date.now();
    processEta = null;
    console.error('Auto-assign error:', e.response?.data || e.message || e);
    res.status(500).json({ error: e.message });
  }
});

// API to redistribute jobs to ensure all drivers have at least one job
app.post('/api/redistribute-jobs', async (req, res) => {
  try {
    console.log('\n🔄 Starting job redistribution to ensure all drivers get at least one job...');
    
    // 1. Fetch all jobs and drivers
    const data = await getCachedData();
    const allJobs = [...data.motorway, ...data.atmoves, ...data.privateCustomers];
    const drivers = await fetchDriversSheet();
    
    console.log(`📋 Total jobs: ${allJobs.length}`);
    console.log(`👥 Total drivers: ${drivers.length}`);
    
    // 2. Calculate current job distribution
    const driverJobCount = {};
    drivers.forEach(driver => {
      const driverName = driver.Name || driver.driver_name || driver.name;
      if (driverName) {
        driverJobCount[driverName] = 0;
      }
    });
    
    // Count jobs per driver
    allJobs.forEach(job => {
      if (job.selected_driver && driverJobCount.hasOwnProperty(job.selected_driver)) {
        driverJobCount[job.selected_driver]++;
      }
    });
    
    // 3. Find drivers without jobs and drivers with multiple jobs
    const driversWithoutJobs = [];
    const driversWithMultipleJobs = [];
    
    Object.entries(driverJobCount).forEach(([driver, count]) => {
      if (count === 0) {
        driversWithoutJobs.push(driver);
      } else if (count > 1) {
        driversWithMultipleJobs.push({ driver, count });
      }
    });
    
    driversWithMultipleJobs.sort((a, b) => b.count - a.count); // Sort by job count descending
    
    console.log(`❌ Drivers without jobs: ${driversWithoutJobs.length}`);
    console.log(`📋 Drivers with multiple jobs: ${driversWithMultipleJobs.length}`);
    
    if (driversWithoutJobs.length === 0) {
      return res.json({
        success: true,
        message: 'All drivers already have at least one job',
        driverJobCount,
        redistributions: []
      });
    }
    
    // 4. Redistribute jobs
    const redistributions = [];
    let redistributedCount = 0;
    
    for (const driverWithoutJob of driversWithoutJobs) {
      // Find a driver with multiple jobs to take from
      for (const overloadedDriver of driversWithMultipleJobs) {
        if (overloadedDriver.count > 1) {
          // Find a job assigned to the overloaded driver
          const jobToReassign = allJobs.find(job => job.selected_driver === overloadedDriver.driver);
          
          if (jobToReassign) {
            // Reassign the job
            jobToReassign.selected_driver = driverWithoutJob;
            
            // Update counters
            overloadedDriver.count--;
            driverJobCount[overloadedDriver.driver]--;
            driverJobCount[driverWithoutJob]++;
            
            redistributions.push({
              job_id: jobToReassign.job_id,
              from_driver: overloadedDriver.driver,
              to_driver: driverWithoutJob,
              customer_name: jobToReassign.customer_name || jobToReassign.Customer || 'Unknown'
            });
            
            redistributedCount++;
            console.log(`🔄 Redistributed Job ${jobToReassign.job_id} from ${overloadedDriver.driver} to ${driverWithoutJob}`);
            break; // Move to next driver without job
          }
        }
      }
    }
    
    // 5. Update sheets with redistributed jobs
    if (redistributedCount > 0) {
      // Update Motorway sheet
      const motorwayUpdates = [];
      data.motorway.forEach((job, index) => {
        const redistribution = redistributions.find(r => r.job_id === job.job_id);
        if (redistribution) {
          motorwayUpdates.push({
            range: `Motorway!H${index + 2}`, // Assuming column H is selected_driver
            values: [[redistribution.to_driver]]
          });
        }
      });
      
      // Update AT Moves sheet
      const atmovesUpdates = [];
      data.atmoves.forEach((job, index) => {
        const redistribution = redistributions.find(r => r.job_id === job.job_id);
        if (redistribution) {
          atmovesUpdates.push({
            range: `AT Moves!H${index + 2}`,
            values: [[redistribution.to_driver]]
          });
        }
      });
      
      // Update Private Customers sheet
      const privateUpdates = [];
      data.privateCustomers.forEach((job, index) => {
        const redistribution = redistributions.find(r => r.job_id === job.job_id);
        if (redistribution) {
          privateUpdates.push({
            range: `Private Customers!H${index + 2}`,
            values: [[redistribution.to_driver]]
          });
        }
      });
      
      // Perform batch updates
      const allUpdates = [...motorwayUpdates, ...atmovesUpdates, ...privateUpdates];
      
      if (allUpdates.length > 0) {
        console.log(`📝 Updating ${allUpdates.length} jobs in Google Sheets...`);
        
        // Batch update the sheets
        const sheets = google.sheets({ version: 'v4', auth: authClient });
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          resource: {
            valueInputOption: 'RAW',
            data: allUpdates
          }
        });
        
        console.log('✅ Google Sheets updated successfully');
        
        // Invalidate cache to ensure fresh data
        clearCacheData();
      }
    }
    
    // 6. Final statistics
    const finalDriversWithoutJobs = Object.entries(driverJobCount).filter(([driver, count]) => count === 0).length;
    
    console.log(`\n🎯 REDISTRIBUTION SUMMARY:`);
    console.log(`✅ Jobs redistributed: ${redistributedCount}`);
    console.log(`❌ Drivers still without jobs: ${finalDriversWithoutJobs}`);
    console.log(`📈 Improvement: ${driversWithoutJobs.length - finalDriversWithoutJobs} drivers now have jobs`);
    
    res.json({
      success: true,
      message: `Successfully redistributed ${redistributedCount} jobs`,
      initialDriversWithoutJobs: driversWithoutJobs.length,
      finalDriversWithoutJobs,
      redistributions,
      driverJobCount,
      improvement: driversWithoutJobs.length - finalDriversWithoutJobs
    });
    
  } catch (error) {
    console.error('Error during job redistribution:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API to assign drivers to ALL jobs in all sheets
app.post('/api/assign-drivers-to-all', async (req, res) => {
  try {
    processStartTime = Date.now();
    processEndTime = null;
    processEta = null;
    console.log('Starting driver assignment to all jobs in all sheets...');
    
    // 1. Fetch all jobs and drivers
    const data = await getCachedData();
    const allJobs = [...data.motorway, ...data.atmoves, ...data.privateCustomers]
      .filter(job => !job.selected_driver || job.selected_driver === '' || job.selected_driver === null || job.selected_driver === undefined);
    const drivers = await fetchDriversSheet();
    
    const totalJobsBeforeFilter = data.motorway.length + data.atmoves.length + data.privateCustomers.length;
    console.log(`📋 Total jobs in sheets: ${totalJobsBeforeFilter}`);
    console.log(`✅ Unassigned jobs available for assignment: ${allJobs.length}`);
    console.log(`👥 Drivers available: ${drivers.length}`);
    console.log(`Jobs breakdown: motorway=${data.motorway.length}, atmoves=${data.atmoves.length}, privateCustomers=${data.privateCustomers.length}`);
    
    // Debug: Log sample jobs from each sheet to see structure
    if (data.motorway.length > 0) {
      console.log('Sample Motorway job:', JSON.stringify(data.motorway[0], null, 2));
    }
    if (data.atmoves.length > 0) {
      console.log('Sample AT Moves job:', JSON.stringify(data.atmoves[0], null, 2));
    }
    if (data.privateCustomers.length > 0) {
      console.log('Sample Private Customers job:', JSON.stringify(data.privateCustomers[0], null, 2));
    }
    
    // Check if jobs have job_id field
    const motorwayWithJobId = data.motorway.filter(j => j.job_id);
    const atmovesWithJobId = data.atmoves.filter(j => j.job_id);
    const privateWithJobId = data.privateCustomers.filter(j => j.job_id);
    
    console.log(`Jobs with job_id: motorway=${motorwayWithJobId.length}/${data.motorway.length}, atmoves=${atmovesWithJobId.length}/${data.atmoves.length}, private=${privateWithJobId.length}/${data.privateCustomers.length}`);
    
    if (drivers.length > 0) {
      console.log('Sample driver:', JSON.stringify(drivers[0], null, 2));
    };
    
    // 2. Collect all postcodes for batch lookup
    const postcodesToBatch = [];
    for (const job of allJobs) {
      if (job.collection_postcode) postcodesToBatch.push(job.collection_postcode.trim().toUpperCase());
      if (job.delivery_postcode) postcodesToBatch.push(job.delivery_postcode.trim().toUpperCase());
    }
    
    // Add driver postcodes
    for (const driver of drivers) {
      const pcKey = Object.keys(driver).find(k => k.toLowerCase().includes('postcode'));
      if (pcKey && driver[pcKey]) {
        postcodesToBatch.push(driver[pcKey].trim().toUpperCase());
      }
    }
    
    const uniquePcs = Array.from(new Set(postcodesToBatch.filter(Boolean)));
    if (uniquePcs.length > 0) {
      console.log(`Batch-looking up ${uniquePcs.length} postcodes for driver matching...`);
      await batchLookupRegions(uniquePcs);
    }
    
    // 3. Helper functions
    function getLatLonForPostcode(postcode) {
      if (!postcode) return null;
      const pc = postcode.toString().trim().toUpperCase();
      if (!pc) return null;
      const cached = postcodeApiCache[pc];
      if (cached && cached.lat != null && cached.lon != null) return { lat: cached.lat, lon: cached.lon };
      // fallback to outward area mapping
      const outward = extractArea(pc);
      if (outward && POSTCODE_REGIONS[outward]) {
        const r = POSTCODE_REGIONS[outward];
        if (r.lat != null && r.lon != null) return { lat: r.lat, lon: r.lon };
      }
      return null;
    }

    function haversineMiles(a, b) {
      if (!a || !b) return Infinity;
      const toRad = v => (v * Math.PI) / 180;
      const R = 3958.8; // Earth radius in miles
      const dLat = toRad(b.lat - a.lat);
      const dLon = toRad(b.lon - a.lon);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);
      const sinDLat = Math.sin(dLat / 2);
      const sinDLon = Math.sin(dLon / 2);
      const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon));
      return R * c;
    }

    // 4. Prepare driver candidates with location info
    const driverCandidates = drivers.map(d => {
      const pcKey = Object.keys(d).find(k => k.toLowerCase().includes('postcode'));
      const drvPc = pcKey ? (d[pcKey] || '').toString().trim() : '';
      const drvLatLon = getLatLonForPostcode(drvPc);
      const drvRegion = (d.region || d.Region || '').toString().trim();
      const drvName = (d.name || d.Name || d.driver_name || d.Driver_Name || '').toString().trim();
      return { raw: d, name: drvName, postcode: drvPc, latlon: drvLatLon, region: drvRegion };
    });
    
    console.log(`Prepared ${driverCandidates.length} driver candidates`);
    console.log(`Total jobs to assign: ${allJobs.length}`);
    
    // Validate assignment feasibility
    if (driverCandidates.length === 0) {
      throw new Error('No driver candidates found! Check driver data in Google Sheets.');
    }
    
    if (allJobs.length === 0) {
      throw new Error('No jobs found! Check job data in Google Sheets.');
    }
    
    const jobToDriverRatio = allJobs.length / driverCandidates.length;
    console.log(`📊 Job to driver ratio: ${jobToDriverRatio.toFixed(2)} jobs per driver`);
    
    if (jobToDriverRatio < 1) {
      console.log(`⚠️  WARNING: Only ${allJobs.length} jobs for ${driverCandidates.length} drivers!`);
      console.log(`❓ ${driverCandidates.length - allJobs.length} drivers will not receive jobs.`);
    }
    
    // Log driver candidate details for debugging
    console.log('Driver candidates summary:');
    driverCandidates.forEach((dc, index) => {
      console.log(`  ${index + 1}. ${dc.name} - Postcode: ${dc.postcode || 'Missing'} - Region: ${dc.region || 'Missing'} - HasLatLon: ${dc.latlon ? 'Yes' : 'No'}`);
    });
    
    // 5. Assign driver to each job individually with proper sequencing and status management
    const assignedJobs = [];
    const driverJobCount = {}; // Track job assignments per driver for load balancing
    let assignmentStats = { 
      sameRegion: 0, 
      within10Miles: 0, 
      within50Miles: 0,
      nearestFallback: 0, 
      noDriverData: 0 
    };
    
    // Initialize driver job count
    driverCandidates.forEach(dc => {
      driverJobCount[dc.name] = 0;
    });

    // Phase 1: Ensure all drivers get at least one job
    console.log('\n=== PHASE 1: Ensuring all drivers get at least one job ===');
    const availableJobs = [...allJobs];
    const driversNeedingJobs = [...driverCandidates];
    
    // Check if we have enough jobs
    if (availableJobs.length < driversNeedingJobs.length) {
      console.log(`⚠️  WARNING: Only ${availableJobs.length} jobs available for ${driversNeedingJobs.length} drivers!`);
      console.log('Some drivers will not receive jobs due to insufficient job count.');
    }
    
    // Track drivers who couldn't be assigned in Phase 1
    const unassignedDrivers = [];
    
    for (const driver of driversNeedingJobs) {
      if (availableJobs.length === 0) {
        console.log(`⚠️  No more jobs available to assign to driver ${driver.name}`);
        unassignedDrivers.push(driver);
        continue;
      }
      
      // Find the best job for this driver
      let bestJobIndex = -1;
      let bestScore = Infinity;
      let bestReason = '';
      
      for (let i = 0; i < availableJobs.length; i++) {
        const job = availableJobs[i];
        const jobRegion = (job.collection_region || job.delivery_region || '').toString().trim();
        const jobCollectionLatLon = getLatLonForPostcode(job.collection_postcode);
        const jobDeliveryLatLon = getLatLonForPostcode(job.delivery_postcode);
        
        const distToCollection = (jobCollectionLatLon && driver.latlon) ? haversineMiles(jobCollectionLatLon, driver.latlon) : Infinity;
        const distToDelivery = (jobDeliveryLatLon && driver.latlon) ? haversineMiles(jobDeliveryLatLon, driver.latlon) : Infinity;
        const minDist = Math.min(distToCollection, distToDelivery);
  const sameRegion = (regionToString(driver.region) && regionToString(jobRegion) && regionToString(driver.region).toLowerCase() === regionToString(jobRegion).toLowerCase());
        
        // Scoring: region match is best (0), then distance, fallback to any assignment
        let score;
        let reason;
        if (sameRegion) {
          score = 0 + (minDist === Infinity ? 0 : minDist * 0.1);
          reason = 'same-region-guarantee';
        } else if (minDist !== Infinity && minDist <= 200) { // Increased radius for guarantee phase
          score = 100 + minDist;
          reason = 'distance-guarantee';
        } else {
          // Accept ANY job for guarantee - no driver should be left empty
          score = 1000 + Math.random();
          reason = 'fallback-guarantee';
        }
        
        if (score < bestScore) {
          bestScore = score;
          bestJobIndex = i;
          bestReason = reason;
        }
      }
      
      // Assign the best job to this driver (should always find one if jobs available)
      if (bestJobIndex >= 0) {
        const job = availableJobs[bestJobIndex];
        job.selected_driver = driver.name;
        driverJobCount[driver.name]++;
        
        // Set initial job properties with proper sequencing
        job.order_no = 1; // This will be the first job for the driver
        job.job_status = 'active'; // First job is active
        job.job_active = 'true';
        
        assignedJobs.push({
          job_id: job.job_id,
          assigned_driver: driver.name,
          reason: bestReason,
          distance: null,
          order_no: 1,
          status: 'active'
        });
        
        // Enhanced assignment logging
        console.log(`✅ GUARANTEED [${driversNeedingJobs.indexOf(driver) + 1}/${driversNeedingJobs.length}]: ${driver.name} <- Job ${job.job_id} "${job.customer_name}" (${bestReason}) - ORDER #1 (ACTIVE)`);
        console.log(`   📍 Route: ${job.pickup_postcode || 'Unknown'} → ${job.delivery_postcode || 'Unknown'} | Driver region: ${driver.region || 'Unknown'}`);
        
        // Remove this job from available jobs
        availableJobs.splice(bestJobIndex, 1);
      } else {
        console.log(`❌ FAILED: Could not assign any job to driver ${driver.name}`);
        unassignedDrivers.push(driver);
      }
    }
    
    console.log(`\n=== PHASE 1 COMPLETE ===`);
    console.log(`✅ Drivers with jobs: ${driversNeedingJobs.length - unassignedDrivers.length}`);
    console.log(`❌ Drivers without jobs: ${unassignedDrivers.length}`);
    console.log(`📋 Remaining jobs to assign: ${availableJobs.length}`);
    
    if (unassignedDrivers.length > 0) {
      console.log(`\n⚠️  UNASSIGNED DRIVERS:`);
      unassignedDrivers.forEach(d => console.log(`   - ${d.name} (${d.region || 'No region'}, ${d.postcode || 'No postcode'})`));
    }
    
    console.log('\nDriver job counts after Phase 1:', driverJobCount);
    
    // Phase 1.5: Try to redistribute jobs if some drivers have multiple and others have none
    if (unassignedDrivers.length > 0 && availableJobs.length === 0) {
      console.log('\n=== PHASE 1.5: Attempting job redistribution ===');
      
      // Find drivers with multiple jobs who might share
      const driversWithMultipleJobs = driverCandidates.filter(dc => driverJobCount[dc.name] > 1);
      
      if (driversWithMultipleJobs.length > 0 && unassignedDrivers.length > 0) {
        console.log(`Found ${driversWithMultipleJobs.length} drivers with multiple jobs, trying to redistribute...`);
        
        // This would require more complex logic to reassign jobs, for now just log
        console.log('Redistribution logic not implemented - ensure sufficient jobs are available');
      }
    }
    
    // Phase 2: Continue with load-balanced assignment for remaining jobs with proper sequencing
    console.log('\n=== PHASE 2: Load-balanced assignment of remaining jobs ===');
    
    for (const job of availableJobs) {
      // Determine job region and location
      const jobRegion = (job.collection_region || job.delivery_region || '').toString().trim();
      const jobCollectionLatLon = getLatLonForPostcode(job.collection_postcode);
      const jobDeliveryLatLon = getLatLonForPostcode(job.delivery_postcode);
      const jobLatLon = jobCollectionLatLon || jobDeliveryLatLon;
      
      // Find best driver match
      const candidates = driverCandidates.map(dc => {
        const distToCollection = (jobCollectionLatLon && dc.latlon) ? haversineMiles(jobCollectionLatLon, dc.latlon) : Infinity;
        const distToDelivery = (jobDeliveryLatLon && dc.latlon) ? haversineMiles(jobDeliveryLatLon, dc.latlon) : Infinity;
        const minDist = Math.min(distToCollection, distToDelivery);
  const sameRegion = (regionToString(dc.region) && regionToString(jobRegion) && regionToString(dc.region).toLowerCase() === regionToString(jobRegion).toLowerCase());
        return { dc, dist: minDist, sameRegion };
      }).filter(c => {
        // More inclusive filtering: include if same region, within 100 miles, or if no distance data is available
        return c.sameRegion || (c.dist !== Infinity && c.dist <= 100) || (c.dist === Infinity && c.dc.name);
      });
      
      let chosen = null;
      let reason = '';
      
      if (candidates.length > 0) {
        // Sort by region match first, then by current job load (ascending), then distance
        candidates.sort((a, b) => {
          if (a.sameRegion && !b.sameRegion) return -1;
          if (!a.sameRegion && b.sameRegion) return 1;
          // If same region preference, sort by job load first
          const aJobCount = driverJobCount[a.dc.name] || 0;
          const bJobCount = driverJobCount[b.dc.name] || 0;
          if (aJobCount !== bJobCount) return aJobCount - bJobCount;
          // If same job count, sort by distance
          return (a.dist || Infinity) - (b.dist || Infinity);
        });
        chosen = candidates[0];
        reason = chosen.sameRegion ? 'same-region' : 
                (chosen.dist <= 10 ? 'within-10-miles' : 
                (chosen.dist <= 50 ? 'within-50-miles' : 
                (chosen.dist <= 100 ? 'within-100-miles' : 'no-distance-data')));
        if (chosen.sameRegion) assignmentStats.sameRegion++;
        else if (chosen.dist <= 10) assignmentStats.within10Miles++;
        else if (chosen.dist <= 50) assignmentStats.within50Miles++;
        else assignmentStats.nearestFallback++;
      }
      
      // Fallback: assign nearest driver regardless of distance
      if (!chosen && driverCandidates.length > 0) {
        const allDistances = driverCandidates.map(dc => {
          const distToCollection = (jobCollectionLatLon && dc.latlon) ? haversineMiles(jobCollectionLatLon, dc.latlon) : Infinity;
          const distToDelivery = (jobDeliveryLatLon && dc.latlon) ? haversineMiles(jobDeliveryLatLon, dc.latlon) : Infinity;
          const minDist = Math.min(distToCollection, distToDelivery);
          const sameRegion = (regionToString(dc.region) && regionToString(jobRegion) && regionToString(dc.region).toLowerCase() === regionToString(jobRegion).toLowerCase());
          return { dc, dist: minDist, sameRegion };
        });
        
        allDistances.sort((a, b) => {
          if (a.sameRegion && !b.sameRegion) return -1;
          if (!a.sameRegion && b.sameRegion) return 1;
          // Sort by job load first to balance workload
          const aJobCount = driverJobCount[a.dc.name] || 0;
          const bJobCount = driverJobCount[b.dc.name] || 0;
          if (aJobCount !== bJobCount) return aJobCount - bJobCount;
          return (a.dist || Infinity) - (b.dist || Infinity);
        });
        
        chosen = allDistances[0];
        reason = 'nearest-available';
        assignmentStats.nearestFallback++;
      }
      
      if (!chosen) {
        assignmentStats.noDriverData++;
        reason = 'no-driver-data';
      }
      
      // Update job with assigned driver and proper sequencing
      const assignedDriver = chosen ? chosen.dc.name : '';
      job.selected_driver = assignedDriver;
      
      // Set job properties with proper order_no and status
      if (assignedDriver && driverJobCount.hasOwnProperty(assignedDriver)) {
        driverJobCount[assignedDriver]++;
        const orderNo = driverJobCount[assignedDriver];
        
        job.order_no = orderNo;
        // All jobs after the first are pending (first job was set to active in Phase 1)
        job.job_status = 'pending';
        job.job_active = 'false';
      } else {
        job.order_no = 1;
        job.job_status = 'pending';
        job.job_active = 'false';
      }
      
      assignedJobs.push({
        job_id: job.job_id,
        assigned_driver: assignedDriver,
        reason: reason,
        distance: chosen ? chosen.dist : null,
        order_no: job.order_no,
        status: job.job_status
      });
      
      console.log(`Job ${job.job_id}: region='${jobRegion}' -> assigned driver='${assignedDriver}' ORDER #${job.order_no} (${job.job_status.toUpperCase()}) (${reason}${chosen && chosen.dist !== Infinity ? `, dist=${chosen.dist.toFixed(1)}mi` : ''}, total jobs: ${driverJobCount[assignedDriver] || 0})`);
    }
    
    console.log('Assignment Statistics:', assignmentStats);
    console.log('\n=== FINAL DRIVER JOB DISTRIBUTION ===');
    console.log('Final job counts per driver:');
    let driversWithJobs = 0;
    let driversWithoutJobs = 0;
    let totalAssignedJobs = 0;
    
    driverCandidates.forEach(dc => {
      const jobCount = driverJobCount[dc.name] || 0;
      console.log(`  ${dc.name}: ${jobCount} jobs`);
      if (jobCount > 0) {
        driversWithJobs++;
        totalAssignedJobs += jobCount;
      } else {
        driversWithoutJobs++;
      }
    });
    
    console.log(`\n=== ASSIGNMENT SUMMARY ===`);
    console.log(`👥 Total drivers: ${driverCandidates.length}`);
    console.log(`✅ Drivers with jobs: ${driversWithJobs}`);
    console.log(`❌ Drivers without jobs: ${driversWithoutJobs}`);
    console.log(`📋 Total jobs assigned: ${totalAssignedJobs}`);
    console.log(`📊 Jobs per driver ratio: ${driverCandidates.length > 0 ? (totalAssignedJobs / driverCandidates.length).toFixed(2) : 0}`);
    
    if (driversWithoutJobs > 0) {
      console.log(`\n⚠️  WARNING: ${driversWithoutJobs} drivers have no jobs assigned!`);
      console.log('❓ Possible causes:');
      console.log('   • Insufficient total jobs available');
      console.log('   • Geographic constraints too restrictive');
      console.log('   • Driver data missing (postcode, region)');
      
      // List drivers without jobs
      const emptyDrivers = driverCandidates.filter(dc => (driverJobCount[dc.name] || 0) === 0);
      if (emptyDrivers.length > 0) {
        console.log('\n📋 Drivers without jobs:');
        emptyDrivers.forEach(d => {
          console.log(`   • ${d.name} - Region: ${d.region || 'Missing'} - Postcode: ${d.postcode || 'Missing'}`);
        });
      }
    } else {
      console.log('\n🎉 SUCCESS: All drivers have at least one job assigned!');
    }
    
    console.log('\nDetailed driver job distribution:');
    console.log(JSON.stringify(driverJobCount, null, 2));
    
    // 6. Prepare sheet updates
    const updatesToPerform = [];
    for (const job of allJobs) {
      let sheetName = null;
      let sheetData = null;
      
      // Debug: log job details
      console.log(`Processing job for updates: job_id=${job.job_id}, VRM=${job.VRM}, selected_driver=${job.selected_driver}`);
      
      if (data.motorway.some(j => j.job_id === job.job_id)) {
        sheetName = SHEETS.motorway.name;
        sheetData = data.motorway;
        console.log(`Matched job ${job.job_id} to Motorway sheet`);
      } else if (data.atmoves.some(j => j.job_id === job.job_id)) {
        sheetName = SHEETS.atmoves.name;
        sheetData = data.atmoves;
        console.log(`Matched job ${job.job_id} to AT Moves sheet`);
      } else if (data.privateCustomers.some(j => j.job_id === job.job_id)) {
        sheetName = SHEETS.privateCustomers.name;
        sheetData = data.privateCustomers;
        console.log(`Matched job ${job.job_id} to Private Customers sheet`);
      } else {
        // Fallback: try to match by VRM or other unique identifier
        console.log(`No job_id match for ${job.job_id}, trying VRM match...`);
        if (data.motorway.some(j => j.VRM === job.VRM && j.VRM)) {
          sheetName = SHEETS.motorway.name;
          sheetData = data.motorway;
          console.log(`VRM matched job ${job.VRM} to Motorway sheet`);
        } else if (data.atmoves.some(j => j.VRM === job.VRM && j.VRM)) {
          sheetName = SHEETS.atmoves.name;
          sheetData = data.atmoves;
          console.log(`VRM matched job ${job.VRM} to AT Moves sheet`);
        } else if (data.privateCustomers.some(j => j.VRM === job.VRM && j.VRM)) {
          sheetName = SHEETS.privateCustomers.name;
          sheetData = data.privateCustomers;
          console.log(`VRM matched job ${job.VRM} to Private Customers sheet`);
        }
      }
      
      if (!sheetName) {
        console.warn(`Could not match job ${job.job_id} (VRM: ${job.VRM}) to any sheet!`);
        continue;
      }
      
      const rowIdx = sheetData.findIndex(j => j.job_id === job.job_id || (j.VRM === job.VRM && j.VRM)) + 2; // +2 for 1-based indexing and header row
      if (rowIdx < 2) {
        console.warn(`Could not find row index for job ${job.job_id} in ${sheetName}`);
        continue;
      }
      
      updatesToPerform.push({ sheetName, rowIdx, job });
    }
    
    console.log(`Prepared ${updatesToPerform.length} sheet updates`);
    
    // 7. Response with assignment summary
    const responsePayload = {
      success: true,
      assigned: assignedJobs,
      stats: assignmentStats,
      totalJobs: allJobs.length,
      totalDrivers: drivers.length
    };
    
    processEndTime = Date.now();
    processEta = null;
    
    res.json(responsePayload);
    
    // 8. Perform sheet updates in background
    (async () => {
      try {
        console.log(`Background: performing ${updatesToPerform.length} driver assignment updates...`);
        
        const updatesBySheet = {};
        for (const upd of updatesToPerform) {
          try {
            if (!updatesBySheet[upd.sheetName]) {
              const headerRes = await sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: `${upd.sheetName}!1:1`,
              });
              const headers = headerRes.data.values[0] || [];
              updatesBySheet[upd.sheetName] = { headers, rows: [] };
            }
            
            const headers = updatesBySheet[upd.sheetName].headers;
            const rowData = headers.map(h => upd.job[h] || '');
            updatesBySheet[upd.sheetName].rows.push({ rowIdx: upd.rowIdx, rowData });
          } catch (e) {
            console.error('Background prepare update error for', upd.sheetName, upd.rowIdx, e.response?.data || e.message || e);
          }
        }
        
        // Perform batch updates per sheet
        for (const sheetName of Object.keys(updatesBySheet)) {
          const { headers, rows } = updatesBySheet[sheetName];
          if (!rows || rows.length === 0) continue;
          
          const lastCol = colLetter(Math.max(headers.length - 1, 0));
          const data = rows.map(r => ({ 
            range: `${sheetName}!A${r.rowIdx}:${lastCol}${r.rowIdx}`, 
            values: [r.rowData] 
          }));
          
          try {
            console.log(`Background: batch updating ${rows.length} rows in ${sheetName}...`);
            await sheets.spreadsheets.values.batchUpdate({
              spreadsheetId: SHEET_ID,
              resource: { data, valueInputOption: 'USER_ENTERED' },
            });
          } catch (e) {
            console.error(`Background batchUpdate failed for ${sheetName}:`, e.response?.data || e.message || e);
            
            // Fallback to individual updates
            for (const r of rows) {
              try {
                await sheets.spreadsheets.values.update({
                  spreadsheetId: SHEET_ID,
                  range: `${sheetName}!A${r.rowIdx}:AZ${r.rowIdx}`,
                  valueInputOption: 'USER_ENTERED',
                  resource: { values: [r.rowData] },
                });
              } catch (err) {
                console.error('Background fallback update error:', err.response?.data || err.message || err);
              }
            }
          }
        }
        
        cache.timestamp = 0; // Invalidate cache
        console.log('Background: all driver assignment updates complete.');
      } catch (e) {
        console.error('Background driver assignment update error:', e.response?.data || e.message || e);
      }
    })();
    
  } catch (e) {
    processEndTime = Date.now();
    processEta = null;
    console.error('assign-drivers-to-all error:', e.response?.data || e.message || e);
    res.status(500).json({ error: e.message });
  }
});

  // Automated Clustering & Assignment Endpoint
  // This endpoint automates clustering and assignment: it finds matched jobs, creates clusters,
  // attempts to match a driver by region, writes cluster and driver info back to the sheets,
  // and returns a summary. Placed here so `app` is already initialized.
  app.post('/api/auto-cluster-assign', async (req, res) => {
    try {
  // 1. Fetch all jobs (from all sheets) and drivers
  const data = await getCachedData();
      const allJobs = [...data.motorway, ...data.atmoves, ...data.privateCustomers];
      const drivers = await fetchDriversSheet();
  console.log(`Loaded jobs: motorway=${(data.motorway||[]).length}, atmoves=${(data.atmoves||[]).length}, privateCustomers=${(data.privateCustomers||[]).length}`);
  if ((data.motorway||[]).length > 0) console.log('Sample motorway job:', JSON.stringify(data.motorway[0]));
  if ((data.atmoves||[]).length > 0) console.log('Sample atmoves job:', JSON.stringify(data.atmoves[0]));
  if ((data.privateCustomers||[]).length > 0) console.log('Sample private job:', JSON.stringify(data.privateCustomers[0]));

      // 2. Filter jobs with confirmed collection & delivery dates; if none, fall back to all jobs
      const confirmedJobs = allJobs.filter(job => job.collection_date && job.delivery_date);
      const jobsToCluster = (confirmedJobs && confirmedJobs.length > 0) ? confirmedJobs : allJobs;

      // 3. Cluster jobs using outward postcode, region, date proximity and distance scoring
      const clusters = [];
      const clustered = new Set();
      let clusterIdCounter = 1;

      // Precompute postcode outward and lat/lon for jobs
      const jobMeta = jobsToCluster.map(j => {
        const colPc = (j.collection_postcode || '').toString().trim().toUpperCase();
        const delPc = (j.delivery_postcode || '').toString().trim().toUpperCase();
        return {
          job: j,
          colOut: extractOutwardCode(colPc) || extractArea(colPc),
          delOut: extractOutwardCode(delPc) || extractArea(delPc),
          colLatLon: postcodeApiCache[colPc] || null,
          delLatLon: postcodeApiCache[delPc] || null,
          colPc,
          delPc
        };
      });

      function pairScore(aMeta, bMeta) {
        // date proximity penalty (prefer same day or near days)
        let datePenalty = 0;
        if (aMeta.job.delivery_date && bMeta.job.collection_date) {
          const da = new Date(aMeta.job.delivery_date);
          const db = new Date(bMeta.job.collection_date);
          const diff = Math.abs(Math.round((db - da) / (1000 * 60 * 60 * 24)));
          datePenalty = diff; // 0 is best
        } else datePenalty = 2;

        // outward match bonus
        const outwardBonus = (aMeta.delOut && bMeta.colOut && aMeta.delOut === bMeta.colOut) ? -5 : 0;

        // region match bonus
        const regionA = (postcodeApiCache[aMeta.delPc] || {}).region || lookupRegion(aMeta.delPc);
        const regionB = (postcodeApiCache[bMeta.colPc] || {}).region || lookupRegion(bMeta.colPc);
  const regionBonus = (regionToString(regionA) && regionToString(regionB) && regionToString(regionA).toLowerCase() === regionToString(regionB).toLowerCase()) ? -3 : 0;

        // distance penalty (miles)
        let dist = Infinity;
        if (aMeta.delLatLon && bMeta.colLatLon && aMeta.delLatLon.lat && bMeta.colLatLon.lat) {
          dist = haversineMiles(aMeta.delLatLon, bMeta.colLatLon);
        }
        const distPenalty = (dist === Infinity) ? 20 : Math.min(20, Math.round(dist));

        return datePenalty + distPenalty + outwardBonus + regionBonus;
      }

      for (let i = 0; i < jobMeta.length; i++) {
        if (clustered.has(i)) continue;
        const a = jobMeta[i];
        let best = null;
        for (let j = i + 1; j < jobMeta.length; j++) {
          if (clustered.has(j)) continue;
          const b = jobMeta[j];
          const score = pairScore(a, b);
          if (!best || score < best.score) best = { idx: j, score };
        }
        if (best && best.score < 15) {
          const clusterId = `CLUSTER-${clusterIdCounter++}`;
          clusters.push({ jobs: [a.job, jobMeta[best.idx].job], clusterId });
          clustered.add(i);
          clustered.add(best.idx);
        } else {
          const clusterId = `CLUSTER-${clusterIdCounter++}`;
          clusters.push({ jobs: [a.job], clusterId });
          clustered.add(i);
        }
      }

      // If clustering logic produced no clusters (e.g., no reciprocal matches),
      // create single-job clusters for every job so each job can be assigned a driver.
      if (clusters.length === 0 && jobsToCluster.length > 0) {
        console.log('No paired clusters found — creating single-job clusters for all jobs.');
        for (let i = 0; i < jobsToCluster.length; i++) {
          const clusterId = `CLUSTER-${clusterIdCounter++}`;
          clusters.push({ jobs: [jobsToCluster[i]], clusterId });
        }
      }

      // 4. Assign clusters to available drivers
      // Strategy: ensure postcode lat/lon cached for jobs & drivers, then
      // - prefer drivers in the exact same region (case-insensitive)
      // - otherwise pick the nearest driver within a 10-mile radius
      console.log(`Attempting to assign ${clusters.length} clusters to ${drivers.length} drivers...`);

      // Collect postcodes from jobs and drivers for batch lookup
      const postcodesToBatch = [];
      for (const c of clusters) {
        for (const j of c.jobs) {
          if (j.collection_postcode) postcodesToBatch.push((j.collection_postcode || '').toString().trim().toUpperCase());
          if (j.delivery_postcode) postcodesToBatch.push((j.delivery_postcode || '').toString().trim().toUpperCase());
        }
      }
      // drivers may have a postcode column; extract any postcode-like values
      const driverPostcodes = [];
      for (const d of drivers) {
        const pcKey = Object.keys(d).find(k => k.toLowerCase().includes('postcode'));
        if (pcKey && d[pcKey]) {
          driverPostcodes.push((d[pcKey] || '').toString().trim().toUpperCase());
        }
      }
      postcodesToBatch.push(...driverPostcodes);
      // Deduplicate
      const uniquePcs = Array.from(new Set(postcodesToBatch.filter(Boolean)));
      if (uniquePcs.length > 0) {
        console.log(`Batch-looking up ${uniquePcs.length} postcodes for distance matching...`);
        await batchLookupRegions(uniquePcs);
      }

      // Helper: get lat/lon for a postcode (prefer exact API cache, fallback to outward area mapping)
      function getLatLonForPostcode(postcode) {
        if (!postcode) return null;
        const pc = postcode.toString().trim().toUpperCase();
        if (!pc) return null;
        const cached = postcodeApiCache[pc];
        if (cached && cached.lat != null && cached.lon != null) return { lat: cached.lat, lon: cached.lon };
        // fallback to outward area mapping
        const outward = extractArea(pc);
        if (outward && POSTCODE_REGIONS[outward]) {
          const r = POSTCODE_REGIONS[outward];
          if (r.lat != null && r.lon != null) return { lat: r.lat, lon: r.lon };
        }
        return null;
      }

      // Haversine formula -> miles
      function haversineMiles(a, b) {
        if (!a || !b) return Infinity;
        const toRad = v => (v * Math.PI) / 180;
        const R = 3958.8; // Earth radius in miles
        const dLat = toRad(b.lat - a.lat);
        const dLon = toRad(b.lon - a.lon);
        const lat1 = toRad(a.lat);
        const lat2 = toRad(b.lat);
        const sinDLat = Math.sin(dLat / 2);
        const sinDLon = Math.sin(dLon / 2);
        const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon));
        return R * c;
      }

      // Prepare driver candidates with location info
      const driverCandidates = drivers.map(d => {
        const pcKey = Object.keys(d).find(k => k.toLowerCase().includes('postcode'));
        const drvPc = pcKey ? (d[pcKey] || '').toString().trim() : '';
        const drvLatLon = getLatLonForPostcode(drvPc);
        const drvRegion = (d.region || d.Region || '').toString().trim();
        return { raw: d, name: (d.name || d.Name || '').toString().trim(), postcode: drvPc, latlon: drvLatLon, region: drvRegion };
      });

      for (const cluster of clusters) {
        const job = cluster.jobs[0];
        const region = (job.collection_region || job.collection_postcode || '').toString().trim();
        const jobLatLon = getLatLonForPostcode(job.collection_postcode || job.delivery_postcode || '');

        // compute candidates that satisfy region match OR within 10 miles
        const candidates = driverCandidates.map(dc => {
          const dist = (jobLatLon && dc.latlon) ? haversineMiles(jobLatLon, dc.latlon) : Infinity;
          const sameRegion = (regionToString(dc.region) && regionToString(region) && regionToString(dc.region).toLowerCase() === regionToString(region).toLowerCase());
          return { dc, dist, sameRegion };
        }).filter(c => c.sameRegion || (c.dist !== Infinity && c.dist <= 10));

        // pick nearest among candidates if any
        let chosen = null;
        let reason = '';
        if (candidates.length > 0) {
          // sort by distance (prefer sameRegion with smaller distance too)
          candidates.sort((a, b) => {
            if (a.sameRegion && !b.sameRegion) return -1;
            if (!a.sameRegion && b.sameRegion) return 1;
            return (a.dist || Infinity) - (b.dist || Infinity);
          });
          chosen = candidates[0];
          reason = chosen.sameRegion ? 'same-region' : 'within-10-miles';
        }

        // If no candidate found, fallback to nearest driver among all drivers (even if >10 miles)
        if (!chosen) {
          const allDistances = driverCandidates.map(dc => {
            const dist = (jobLatLon && dc.latlon) ? haversineMiles(jobLatLon, dc.latlon) : Infinity;
            return { dc, dist, sameRegion: (regionToString(dc.region) && regionToString(region) && regionToString(dc.region).toLowerCase() === regionToString(region).toLowerCase()) };
          });
          // sort by distance, prefer sameRegion
          allDistances.sort((a, b) => {
            if (a.sameRegion && !b.sameRegion) return -1;
            if (!a.sameRegion && b.sameRegion) return 1;
            return (a.dist || Infinity) - (b.dist || Infinity);
          });
          // pick first with finite distance, otherwise pick first driver record available
          chosen = allDistances.find(x => x.dist !== Infinity) || allDistances[0] || null;
          reason = chosen ? (chosen.sameRegion ? 'same-region-fallback' : 'nearest-fallback') : 'no-driver-data';
        }

        // final fallback: if still no chosen (no drivers at all), set empty string
        cluster.driver = chosen ? (chosen.dc.name || chosen.dc.Name || '') : '';
        console.log(`Cluster ${cluster.clusterId}: region='${region}' -> assigned driver='${cluster.driver || 'NONE'}' (reason=${reason}${chosen && chosen.dist !== Infinity ? `,dist=${chosen.dist.toFixed(2)}mi` : ''})`);
        // Attach cluster_id and selected driver
        cluster.jobs.forEach(j => { j.cluster_id = cluster.clusterId; j.selected_driver = cluster.driver; });

        // Assign forward/return flags and intra-cluster order deterministically
        if (cluster.jobs.length === 2) {
          const a = cluster.jobs[0];
          const b = cluster.jobs[1];
          // prefer earlier collection_date as Forward
          const aDate = a.collection_date ? new Date(a.collection_date) : null;
          const bDate = b.collection_date ? new Date(b.collection_date) : null;
          if (aDate && bDate) {
            if (aDate <= bDate) {
              a.forward_return_flag = 'Forward'; b.forward_return_flag = 'Return';
              a.order_id = 1; b.order_id = 2;
            } else {
              a.forward_return_flag = 'Return'; b.forward_return_flag = 'Forward';
              a.order_id = 2; b.order_id = 1;
            }
          } else {
            // fallback to outward postcode comparison
            const aOut = extractOutwardCode((a.collection_postcode || '').toString()) || extractArea(a.collection_postcode || '');
            const bOut = extractOutwardCode((b.collection_postcode || '').toString()) || extractArea(b.collection_postcode || '');
            if (aOut && bOut) {
              if (aOut <= bOut) { a.forward_return_flag = 'Forward'; b.forward_return_flag = 'Return'; a.order_id = 1; b.order_id = 2; }
              else { a.forward_return_flag = 'Return'; b.forward_return_flag = 'Forward'; a.order_id = 2; b.order_id = 1; }
            } else {
              // default: maintain current order
              cluster.jobs.forEach((jobItem, idx) => { jobItem.forward_return_flag = idx === 0 ? 'Forward' : 'Return'; jobItem.order_id = idx + 1; });
            }
          }
        } else {
          // single-job cluster -> Forward and order_id 1
          cluster.jobs.forEach((jobItem) => { jobItem.forward_return_flag = 'Forward'; jobItem.order_id = 1; });
        }
      }

      // After assigning drivers to clusters, ensure each driver has sequential order_no across their jobs
      const jobsByDriver = {};
      for (const c of clusters) {
        for (const j of c.jobs) {
          const drv = (j.selected_driver || '').toString().trim();
          if (!drv) continue;
          if (!jobsByDriver[drv]) jobsByDriver[drv] = [];
          // use intra-cluster order_id if present, otherwise fallback to collection_date
          jobsByDriver[drv].push(j);
        }
      }

      // Assign sequential order_no for each driver
      for (const [drv, jobsList] of Object.entries(jobsByDriver)) {
        // Sort by cluster order if present, then collection_date, then job_id
        jobsList.sort((a, b) => {
          const aOrder = parseInt(a.order_id || a.order_no || a.driver_order_sequence || '0');
          const bOrder = parseInt(b.order_id || b.order_no || b.driver_order_sequence || '0');
          if (aOrder !== bOrder) return aOrder - bOrder;
          const aDate = a.collection_date || a.delivery_date || '';
          const bDate = b.collection_date || b.delivery_date || '';
          if (aDate !== bDate) return (aDate || '').localeCompare(bDate || '');
          return (a.job_id || '').localeCompare(b.job_id || '');
        });
        // assign sequential numbers starting at existing count +1 if driver already had assigned jobs
        let start = 1;
        for (let idx = 0; idx < jobsList.length; idx++) {
          const job = jobsList[idx];
          job.order_no = String(start + idx);
          job.driver_order_sequence = job.order_no;
        }
      }

      // 5. Prepare sheet updates (we will perform them in background so the HTTP response returns quickly)
      const updatesToPerform = [];
      for (const cluster of clusters) {
        for (const job of cluster.jobs) {
          let sheetName = null;
          let sheetData = null;
          if (data.motorway.some(j => j.job_id === job.job_id)) {
            sheetName = SHEETS.motorway.name;
            sheetData = data.motorway;
          } else if (data.atmoves.some(j => j.job_id === job.job_id)) {
            sheetName = SHEETS.atmoves.name;
            sheetData = data.atmoves;
          } else if (data.privateCustomers.some(j => j.job_id === job.job_id)) {
            sheetName = SHEETS.privateCustomers.name;
            sheetData = data.privateCustomers;
          }
          if (!sheetName) continue;
          const rowIdx = sheetData.findIndex(j => j.job_id === job.job_id) + 2;
          updatesToPerform.push({ sheetName, rowIdx, job });
        }
      }

      // Respond now with the cluster summary
      const responsePayload = { success: true, clusters: clusters.map(c => ({ clusterId: c.clusterId, driver: c.driver, jobs: c.jobs.map(j => j.job_id) })) };
      res.json(responsePayload);

      // Perform updates in background (do not block the response)
      (async () => {
        try {
          console.log(`Background: performing ${updatesToPerform.length} row updates (batched)...`);
          // Group updates by sheet and prepare batch data
          const updatesBySheet = {};
          for (const upd of updatesToPerform) {
            try {
              // Ensure we know headers for the sheet
              if (!updatesBySheet[upd.sheetName]) {
                const headerRes = await sheets.spreadsheets.values.get({
                  spreadsheetId: SHEET_ID,
                  range: `${upd.sheetName}!1:1`,
                });
                const headers = headerRes.data.values[0] || [];
                updatesBySheet[upd.sheetName] = { headers, rows: [] };
              }
              const headers = updatesBySheet[upd.sheetName].headers;
              const rowData = headers.map(h => upd.job[h] || '');
              updatesBySheet[upd.sheetName].rows.push({ rowIdx: upd.rowIdx, rowData });
            } catch (e) {
              console.error('Background prepare update error for', upd.sheetName, upd.rowIdx, e.response?.data || e.message || e);
            }
          }

          // Build batch data and send per-sheet batchUpdate
          for (const sheetName of Object.keys(updatesBySheet)) {
            const { headers, rows } = updatesBySheet[sheetName];
            if (!rows || rows.length === 0) continue;
            const lastCol = colLetter(Math.max(headers.length - 1, 0));
            const data = rows.map(r => ({ range: `${sheetName}!A${r.rowIdx}:${lastCol}${r.rowIdx}`, values: [r.rowData] }));
            try {
              console.log(`Background: batch updating ${rows.length} rows in ${sheetName}...`);
              await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: SHEET_ID,
                resource: { data, valueInputOption: 'USER_ENTERED' },
              });
            } catch (e) {
              console.error(`Background batchUpdate failed for ${sheetName}:`, e.response?.data || e.message || e);
              // Fallback: try per-row updates for this sheet
              for (const r of rows) {
                try {
                  console.log(`Background fallback: Updating row ${r.rowIdx} in ${sheetName}`);
                  await sheets.spreadsheets.values.update({
                    spreadsheetId: SHEET_ID,
                    range: `${sheetName}!A${r.rowIdx}:AZ${r.rowIdx}`,
                    valueInputOption: 'USER_ENTERED',
                    resource: { values: [r.rowData] },
                  });
                } catch (err) {
                  console.error('Background fallback update error:', err.response?.data || err.message || err);
                }
              }
            }
          }

          cache.timestamp = 0;
          console.log('Background: all batched updates complete.');
            } catch (e) {
              console.error('Background batch update loop error:', e.response?.data || e.message || e);
            }
          })();

        } catch (e) {
      console.error('auto-cluster-assign error:', e.response?.data || e.message || e);
      res.status(500).json({ error: e.message });
    }
  });

// Monitor Google Sheets for job status changes and auto-update driver sequences
let lastSheetCheck = {};
let lastMonitoringRun = null;
let monitoringStats = {
  totalRuns: 0,
  jobsProcessed: 0,
  lastProcessedJobs: 0,
  driversAffected: 0
};

async function monitorSheetChanges() {
  try {
    const startTime = Date.now();
    lastMonitoringRun = new Date();
    monitoringStats.totalRuns++;
    
    console.log(`[${lastMonitoringRun.toISOString()}] Monitoring sheet changes for completed jobs...`);
    
    const data = await getCachedData();
    const allJobs = [...data.motorway, ...data.atmoves, ...data.privateCustomers];
    
    // Find jobs that were just marked as completed
    const newlyCompletedJobs = [];
    const processedDrivers = new Set();
    
    for (const job of allJobs) {
      // Consider a job 'processed' when it has job_id, selected_driver, order_id and cluster_id
      if (isJobSheetProcessed(job)) {
        const jobKey = `${job.job_id}_${job.selected_driver}`;

        // Only treat as newly processed if not previously recorded and not persisted
        if (!lastSheetCheck[jobKey] || lastSheetCheck[jobKey].status !== 'processed') {
          if (!isJobProcessed(job.job_id)) {
            newlyCompletedJobs.push(job);
            processedDrivers.add(job.selected_driver);
            console.log(`Detected newly processed job: ${job.job_id} by ${job.selected_driver}`);
          }
        }

        // Update our tracking
        lastSheetCheck[jobKey] = { status: 'processed', lastCheck: Date.now() };
      } else if (job.selected_driver) {
        const jobKey = `${job.job_id}_${job.selected_driver}`;
        lastSheetCheck[jobKey] = { status: job.job_status || 'pending', lastCheck: Date.now() };
      }
    }
    
    // Process each newly completed job
    let totalUpdatedJobs = 0;
    for (const completedJob of newlyCompletedJobs) {
      const result = await processJobCompletion(completedJob.job_id, completedJob.selected_driver, false);
      if (result) {
        totalUpdatedJobs += result.updatedJobs;
      }
    }
    
    // Update stats
    monitoringStats.lastProcessedJobs = newlyCompletedJobs.length;
    monitoringStats.jobsProcessed += totalUpdatedJobs;
    monitoringStats.driversAffected = processedDrivers.size;
    
    const duration = Date.now() - startTime;
    
    if (newlyCompletedJobs.length > 0) {
      console.log(`Processed ${newlyCompletedJobs.length} newly completed jobs affecting ${processedDrivers.size} drivers (${duration}ms)`);
    } else {
      console.log(`No new completions detected (${duration}ms)`);
    }
    
  } catch (error) {
    console.error('Error monitoring sheet changes:', error);
  }
}

// Helper function to process job completion (extracted from the POST endpoint)
async function processJobCompletion(job_id, driver_name, markAsCompleted = true) {
  try {
    console.log(`Processing completion for job ${job_id} by driver ${driver_name}...`);
    
    // Fetch current data
    const data = await getCachedData();
    const allJobs = [...data.motorway, ...data.atmoves, ...data.privateCustomers];
    
    // Find all jobs assigned to this driver
    const driverJobs = allJobs.filter(job => job.selected_driver === driver_name);
    
    // Find the completed job
    const completedJob = driverJobs.find(job => job.job_id === job_id);
    if (!completedJob) {
      console.log(`Job ${job_id} not found for driver ${driver_name}`);
      return null;
    }
    
    // Mark job as completed if requested
    if (markAsCompleted) {
      completedJob.job_status = 'completed';
    }
    
    // Get all driver's jobs sorted by order_no, then by creation date/time or job_id for consistent ordering
    const sortedDriverJobs = driverJobs.sort((a, b) => {
      // First sort by order_no if available
      const aOrder = parseInt(a.order_no || a.driver_order_sequence || '0');
      const bOrder = parseInt(b.order_no || b.driver_order_sequence || '0');
      if (aOrder !== bOrder) return aOrder - bOrder;
      
      // Fallback to date_time_created or job_id
      const aTime = a.date_time_created || a.job_id || '';
      const bTime = b.date_time_created || b.job_id || '';
      return aTime.localeCompare(bTime);
    });
    
    // Reassign order_no to all jobs (1, 2, 3, etc.) and manage active status
    let updatedJobs = [];
    let sequence = 1;
    let activeJobSet = false;
    
    for (const job of sortedDriverJobs) {
      const oldOrderNo = job.order_no || job.driver_order_sequence;
      const oldJobStatus = job.job_status;
      const oldJobActive = job.job_active;
      
      if (job.job_status === 'completed') {
        // Completed jobs keep their sequence but no active status
        job.order_no = sequence++;
        job.driver_order_sequence = job.order_no; // Keep both fields in sync
        job.job_active = 'false';
      } else {
        // Pending jobs get sequential numbering
        job.order_no = sequence++;
        job.driver_order_sequence = job.order_no; // Keep both fields in sync
        
        // First non-completed job becomes active, all others are pending
        if (!activeJobSet) {
          job.job_active = 'true';
          job.job_status = 'active';
          activeJobSet = true;
          console.log(`Setting job ${job.job_id} as ACTIVE (order #${job.order_no})`);
        } else {
          job.job_active = 'false';
          job.job_status = 'pending';
          console.log(`Setting job ${job.job_id} as PENDING (order #${job.order_no})`);
        }
      }
      
      // Track if job was updated
      if (oldOrderNo !== job.order_no || 
          oldJobStatus !== job.job_status ||
          oldJobActive !== job.job_active ||
          job.job_id === job_id) {
        updatedJobs.push(job);
      }
    }
    
    // Log the sequencing results
    console.log(`Driver ${driver_name} job sequencing:`);
    sortedDriverJobs.forEach((job, index) => {
      console.log(`  ${index + 1}. Job ${job.job_id}: order_no=${job.order_no}, status=${job.job_status}, active=${job.job_active}`);
    });
    
    // Update sheets with all changed jobs
    const sheetsToUpdate = new Map();
    
    for (const job of updatedJobs) {
      let jobSheet = null;
      if (data.motorway.some(j => j.job_id === job.job_id)) {
        jobSheet = { name: SHEETS.motorway.name, data: data.motorway };
      } else if (data.atmoves.some(j => j.job_id === job.job_id)) {
        jobSheet = { name: SHEETS.atmoves.name, data: data.atmoves };
      } else if (data.privateCustomers.some(j => j.job_id === job.job_id)) {
        jobSheet = { name: SHEETS.privateCustomers.name, data: data.privateCustomers };
      }
      
      if (jobSheet) {
        const jobRowIdx = jobSheet.data.findIndex(j => j.job_id === job.job_id) + 2;
        if (!sheetsToUpdate.has(jobSheet.name)) {
          sheetsToUpdate.set(jobSheet.name, []);
        }
        sheetsToUpdate.get(jobSheet.name).push({
          job: job,
          rowIdx: jobRowIdx
        });
      }
    }
    
    // Perform batch updates to sheets
    for (const [sheetName, updates] of sheetsToUpdate.entries()) {
      try {
        // Rate limiting for header fetch
        if (!canMakeApiCall()) {
          const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - apiCallResetTime)) / 1000);
          console.log(`⏳ Rate limit reached, waiting ${waitTime}s before getting headers...`);
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        }
        
        // Get headers for this sheet
        console.log(`📊 Making API call for headers (${apiCallCount + 1}/${API_RATE_LIMIT})`);
        const headerRes = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: `${sheetName}!1:1`,
        });
        incrementApiCall();
        
        const headers = headerRes.data.values[0] || [];
        
        // Ensure we have the required columns in headers
        const requiredColumns = ['order_no', 'driver_order_sequence', 'job_active', 'job_status'];
        for (const col of requiredColumns) {
          if (!headers.includes(col)) {
            headers.push(col);
          }
        }
        
        // Rate limiting for batch update
        if (!canMakeApiCall()) {
          const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - apiCallResetTime)) / 1000);
          console.log(`⏳ Rate limit reached, waiting ${waitTime}s before batch update...`);
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        }
        
        // Prepare batch update data
        const batchData = updates.map(update => {
          const rowData = headers.map(h => update.job[h] || '');
          const lastCol = colLetter(Math.max(headers.length - 1, 0));
          return {
            range: `${sheetName}!A${update.rowIdx}:${lastCol}${update.rowIdx}`,
            values: [rowData]
          };
        });
        
        // Perform batch update
        console.log(`📊 Making API call for batch update (${apiCallCount + 1}/${API_RATE_LIMIT})`);
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: SHEET_ID,
          resource: { data: batchData, valueInputOption: 'USER_ENTERED' },
        });
        incrementApiCall();
        
        console.log(`Auto-updated ${updates.length} jobs in ${sheetName} for driver ${driver_name}`);
      } catch (error) {
        console.error(`Error updating ${sheetName}:`, error.response?.data || error.message);
        throw error;
      }
    }
    
    // Invalidate cache
    cache.timestamp = 0;

    const nextActiveJob = sortedDriverJobs.find(job => job.job_active === 'true');
    // Collect newly completed jobs that haven't been written to the Processed Jobs sheet
    try {
      // Debug: log which jobs were updated
      console.log('Updated jobs count:', updatedJobs.length, 'IDs:', updatedJobs.map(j => j.job_id));

      const completedCandidates = updatedJobs.filter(j => isJobSheetProcessed(j) && !isJobProcessed(j.job_id));
      console.log('Newly completed candidates:', completedCandidates.map(j => j.job_id));

      if (completedCandidates.length > 0) {
        // Build richer job objects with sheet, cluster and order info
        const now = new Date().toISOString();
        const jobsToWrite = completedCandidates.map(j => {
          let sourceSheetName = '';
          if (data.motorway.some(x => x.job_id === j.job_id)) sourceSheetName = SHEETS.motorway.name;
          else if (data.atmoves.some(x => x.job_id === j.job_id)) sourceSheetName = SHEETS.atmoves.name;
          else if (data.privateCustomers.some(x => x.job_id === j.job_id)) sourceSheetName = SHEETS.privateCustomers.name;
          return {
            job_id: j.job_id,
            cluster_id: j.cluster_id || '',
            order_id: j.order_no || j.driver_order_sequence || '',
            source_sheet: sourceSheetName,
            sheet: sourceSheetName,
            selected_driver: driver_name,
            processed_at: now
          };
        });

        // Use existing cluster_id if present, otherwise generate a marker id
        const clusterMarker = (completedCandidates[0] && (sortedDriverJobs.find(sj => sj.job_id === completedCandidates[0].job_id) || {}).cluster_id) || generateId('PROCESSED');
        console.log(`Writing ${jobsToWrite.length} completed job(s) to 'Processed Jobs' sheet using cluster marker ${clusterMarker}...`);
        console.log('Jobs payload sample:', jobsToWrite[0]);
        await writeProcessedJobs(jobsToWrite, clusterMarker);
      }
    } catch (err) {
      console.error('Error while writing processed jobs after completion:', err.response?.data || err.message || err);
    }

    return {
      completedJob: job_id,
      updatedJobs: updatedJobs.length,
      nextActiveJob: nextActiveJob ? {
        job_id: nextActiveJob.job_id,
        order_no: nextActiveJob.order_no || nextActiveJob.driver_order_sequence,
        sequence: nextActiveJob.driver_order_sequence,
        collection_address: nextActiveJob.collection_full_address,
        delivery_address: nextActiveJob.delivery_full_address
      } : null,
      driverName: driver_name
    };
    
  } catch (error) {
    console.error('Error processing job completion:', error);
    throw error;
  }
}

// Temporarily disabled automatic monitoring to avoid quota issues
// console.log('🔄 Starting automatic sheet monitoring every 30 seconds...');
// setInterval(monitorSheetChanges, 30000);

// Run initial check after 5 seconds to allow server to fully start
// setTimeout(() => {
//   console.log('🚀 Running initial sheet monitoring check...');
//   monitorSheetChanges();
// }, 5000);

console.log('📊 Automatic monitoring disabled - rate limiting enabled for manual operations');

// API endpoint to clear all jobs data from all sheets
app.post('/api/jobs/clear-all', authMiddleware, async (req, res) => {
  try {
    const users = readUsers();
    const currentUser = users.find(u => u.id === req.user.id);
    
    // Check if user has admin privileges
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('🗑️ Clearing all jobs data from all sheets...');
    processStartTime = Date.now();
    processEndTime = null;
    processEta = null;

    const sheetsToProcess = [
      SHEETS.motorway.name,
      SHEETS.atmoves.name, 
      SHEETS.privateCustomers.name,
      'Processed Jobs'
    ];

    let totalCleared = 0;

    for (const sheetName of sheetsToProcess) {
      try {
        console.log(`Clearing sheet: ${sheetName}`);
        
        // Rate limiting for get operation
        if (!canMakeApiCall()) {
          const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - apiCallResetTime)) / 1000);
          console.log(`⏳ Rate limit reached, waiting ${waitTime}s before getting data...`);
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        }
        
        // Get current data to count rows
        const dataRange = `${sheetName}!2:10000`; // Skip header row
        console.log(`📊 Making API call to get data (${apiCallCount + 1}/${API_RATE_LIMIT})`);
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: dataRange,
        });
        incrementApiCall();
        
        const currentData = response.data.values || [];
        const rowCount = currentData.length;
        
        if (rowCount > 0) {
          // Rate limiting for clear operation
          if (!canMakeApiCall()) {
            const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - apiCallResetTime)) / 1000);
            console.log(`⏳ Rate limit reached, waiting ${waitTime}s before clearing...`);
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
          }
          
          // Clear all data rows (keeping headers)
          console.log(`📊 Making API call to clear data (${apiCallCount + 1}/${API_RATE_LIMIT})`);
          await sheets.spreadsheets.values.clear({
            spreadsheetId: SHEET_ID,
            range: dataRange,
          });
          incrementApiCall();
          
          totalCleared += rowCount;
          console.log(`✅ Cleared ${rowCount} rows from ${sheetName}`);
        } else {
          console.log(`📝 ${sheetName} was already empty`);
        }
        
      } catch (error) {
        console.error(`❌ Error clearing ${sheetName}:`, error.message);
      }
    }

    // Clear cached data
    cache.data = null;
    cache.timestamp = 0;
    
    // Clear processed jobs tracking
    processedJobs.clear();
    
    processEndTime = Date.now();
    const timeSpent = (processEndTime - processStartTime) / 1000;
    
    console.log(`🎉 Successfully cleared ${totalCleared} total rows from all sheets in ${timeSpent.toFixed(2)} seconds`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${totalCleared} rows from all sheets`,
      sheetsCleared: sheetsToProcess.length,
      totalRowsCleared: totalCleared,
      timeSpent: timeSpent
    });
    
  } catch (error) {
    console.error('❌ Error clearing jobs data:', error);
    processEndTime = Date.now();
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to mark job as completed and activate next job for driver
app.post('/api/jobs/complete', async (req, res) => {
  try {
    const { job_id, driver_name } = req.body;
    
    if (!job_id || !driver_name) {
      return res.status(400).json({ error: 'job_id and driver_name are required' });
    }
    
    console.log(`Manual completion request for job ${job_id} by driver ${driver_name}...`);
    
    const result = await processJobCompletion(job_id, driver_name, true);
    
    if (!result) {
      return res.status(404).json({ error: 'Job not found or not assigned to this driver' });
    }
    
    res.json({
      success: true,
      ...result,
      message: `Job ${job_id} marked as completed. ${result.updatedJobs} jobs updated. ${result.nextActiveJob ? `Next active job: ${result.nextActiveJob.job_id}` : 'No more jobs in queue.'}`
    });
    
  } catch (error) {
    console.error('Error completing job:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get driver's current job queue with order
app.get('/api/drivers/:driverName/queue', async (req, res) => {
  try {
    const { driverName } = req.params;
    
    if (!driverName) {
      return res.status(400).json({ error: 'Driver name is required' });
    }
    
    console.log(`Fetching job queue for driver: ${driverName}`);
    
    // Fetch current data
    const data = await getCachedData();
    const allJobs = [...data.motorway, ...data.atmoves, ...data.privateCustomers];
    
    // Filter jobs for this driver
    const driverJobs = allJobs.filter(job => job.selected_driver === driverName);
    
    // Sort by order_no, then by driver_order_sequence, then by creation date for consistent ordering
    const sortedJobs = driverJobs.sort((a, b) => {
      // First sort by order_no if available
      const aOrder = parseInt(a.order_no || a.driver_order_sequence || '0');
      const bOrder = parseInt(b.order_no || b.driver_order_sequence || '0');
      if (aOrder !== bOrder) return aOrder - bOrder;
      
      // Fallback to creation date/time or job_id
      const aTime = a.date_time_created || a.job_id || '';
      const bTime = b.date_time_created || b.job_id || '';
      return aTime.localeCompare(bTime);
    });
    
    // Separate completed and pending jobs
    const completedJobs = sortedJobs.filter(job => job.job_status === 'completed');
    const pendingJobs = sortedJobs.filter(job => job.job_status !== 'completed');
    const activeJob = sortedJobs.find(job => job.job_active === 'true');
    
    // Format job data
    const formatJob = (job) => ({
      job_id: job.job_id,
      order_no: job.order_no || job.driver_order_sequence,
      driver_order_sequence: job.driver_order_sequence,
      collection_full_address: job.collection_full_address,
      delivery_full_address: job.delivery_full_address,
      collection_date: job.collection_date,
      delivery_date: job.delivery_date,
      job_status: job.job_status || 'pending',
      job_active: job.job_active === 'true',
      cluster_id: job.cluster_id,
      forward_return_flag: job.forward_return_flag
    });
    
    res.json({
      driver: driverName,
      totalJobs: driverJobs.length,
      completedCount: completedJobs.length,
      pendingCount: pendingJobs.length,
      activeJob: activeJob ? formatJob(activeJob) : null,
      completedJobs: completedJobs.map(formatJob),
      pendingJobs: pendingJobs.map(formatJob),
      allJobs: sortedJobs.map(formatJob)
    });
    
  } catch (error) {
    console.error('Error fetching driver queue:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get monitoring status
app.get('/api/jobs/monitoring-status', (req, res) => {
  res.json({
    isRunning: true,
    lastRun: lastMonitoringRun,
    stats: monitoringStats,
    nextRunIn: 30 - (Math.floor((Date.now() - (lastMonitoringRun?.getTime() || 0)) / 1000)),
    intervalSeconds: 30
  });
});

// API endpoint to manually trigger sheet monitoring
app.post('/api/jobs/monitor-sheet-changes', async (req, res) => {
  try {
    console.log('Manual trigger for sheet monitoring...');
    
    const data = await getCachedData();
    const allJobs = [...data.motorway, ...data.atmoves, ...data.privateCustomers];
    
    // Find jobs that are marked as completed but don't have proper sequencing
    const completedJobs = allJobs.filter(job => 
      job.job_status === 'completed' && 
      job.selected_driver
    );
    
    const processedDrivers = new Set();
    let updatedJobs = 0;
    
    for (const job of completedJobs) {
      const driverKey = `${job.selected_driver}`;
      
      // Process each driver only once
      if (!processedDrivers.has(driverKey)) {
        try {
          const result = await processJobCompletion(job.job_id, job.selected_driver, false);
          if (result) {
            updatedJobs += result.updatedJobs;
            console.log(`Processed driver ${job.selected_driver}: ${result.updatedJobs} jobs updated`);
          }
        } catch (error) {
          console.error(`Error processing driver ${job.selected_driver}:`, error.message);
        }
        processedDrivers.add(driverKey);
      }
    }
    
    res.json({
      success: true,
      completedJobsFound: completedJobs.length,
      driversProcessed: processedDrivers.size,
      jobsUpdated: updatedJobs,
      message: `Found ${completedJobs.length} completed jobs across ${processedDrivers.size} drivers. Updated ${updatedJobs} job sequences.`
    });
    
  } catch (error) {
    console.error('Error in manual sheet monitoring:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manual export endpoint removed: processed jobs are written automatically during monitoring/completion.

// API endpoint to initialize driver_order_sequence for all jobs
app.post('/api/jobs/initialize-driver-sequences', async (req, res) => {
  try {
    console.log('Initializing driver_order_sequence for all jobs...');
    
    const data = await getCachedData();
    const allJobs = [...data.motorway, ...data.atmoves, ...data.privateCustomers];
    
    // Group jobs by driver
    const jobsByDriver = {};
    for (const job of allJobs) {
      if (!job.selected_driver) continue;
      if (!jobsByDriver[job.selected_driver]) {
        jobsByDriver[job.selected_driver] = [];
      }
      jobsByDriver[job.selected_driver].push(job);
    }
    
    let totalUpdated = 0;
    const sheetsToUpdate = new Map();
    
    // Process each driver's jobs
    for (const [driverName, driverJobs] of Object.entries(jobsByDriver)) {
      // Sort jobs by creation date/time or job_id for consistent ordering
      driverJobs.sort((a, b) => {
        const aTime = a.date_time_created || a.job_id || '';
        const bTime = b.date_time_created || b.job_id || '';
        return aTime.localeCompare(bTime);
      });
      
      // Assign sequences
      let sequence = 1;
      let activeJobSet = false;
      
      for (const job of driverJobs) {
        // Only update if job doesn't already have a sequence
        if (!job.order_no && !job.driver_order_sequence) {
          job.order_no = sequence;
          job.driver_order_sequence = sequence; // Keep both fields in sync
          
          // Set job status and active flag
          if (job.job_status === 'completed') {
            job.job_active = 'false';
          } else {
            if (!activeJobSet) {
              job.job_active = 'true';
              job.job_status = 'active';
              activeJobSet = true;
              console.log(`Setting job ${job.job_id} (${driverName}) as ACTIVE (order #${job.order_no})`);
            } else {
              job.job_active = 'false';
              if (!job.job_status || job.job_status === 'active') {
                job.job_status = 'pending';
              }
              console.log(`Setting job ${job.job_id} (${driverName}) as PENDING (order #${job.order_no})`);
            }
          }
          
          // Add to update list
          let jobSheet = null;
          if (data.motorway.some(j => j.job_id === job.job_id)) {
            jobSheet = { name: SHEETS.motorway.name, data: data.motorway };
          } else if (data.atmoves.some(j => j.job_id === job.job_id)) {
            jobSheet = { name: SHEETS.atmoves.name, data: data.atmoves };
          } else if (data.privateCustomers.some(j => j.job_id === job.job_id)) {
            jobSheet = { name: SHEETS.privateCustomers.name, data: data.privateCustomers };
          }
          
          if (jobSheet) {
            const jobRowIdx = jobSheet.data.findIndex(j => j.job_id === job.job_id) + 2;
            if (!sheetsToUpdate.has(jobSheet.name)) {
              sheetsToUpdate.set(jobSheet.name, []);
            }
            sheetsToUpdate.get(jobSheet.name).push({
              job: job,
              rowIdx: jobRowIdx
            });
            totalUpdated++;
          }
        }
        sequence++;
      }
    }
    
    // Perform batch updates to sheets
    for (const [sheetName, updates] of sheetsToUpdate.entries()) {
      try {
        // Get headers for this sheet
        const headerRes = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: `${sheetName}!1:1`,
        });
        const headers = headerRes.data.values[0] || [];
        
        // Ensure we have the required columns in headers
        const requiredColumns = ['order_no', 'driver_order_sequence', 'job_active', 'job_status'];
        for (const col of requiredColumns) {
          if (!headers.includes(col)) {
            headers.push(col);
          }
        }
        
        // Prepare batch update data
        const data = updates.map(update => {
          const rowData = headers.map(h => update.job[h] || '');
          const lastCol = colLetter(Math.max(headers.length - 1, 0));
          return {
            range: `${sheetName}!A${update.rowIdx}:${lastCol}${update.rowIdx}`,
            values: [rowData]
          };
        });
        
        // Perform batch update
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: SHEET_ID,
          resource: { data, valueInputOption: 'USER_ENTERED' },
        });
        
        console.log(`Initialized ${updates.length} jobs in ${sheetName}`);
      } catch (error) {
        console.error(`Error updating ${sheetName}:`, error.response?.data || error.message);
        throw error;
      }
    }
    
    cache.timestamp = 0;
    
    res.json({
      success: true,
      totalJobsUpdated: totalUpdated,
      driversProcessed: Object.keys(jobsByDriver).length,
      message: `Initialized driver_order_sequence for ${totalUpdated} jobs across ${Object.keys(jobsByDriver).length} drivers.`
    });
    
  } catch (error) {
    console.error('Error initializing driver sequences:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint: ensure the consolidated 'Processed Jobs' sheet exists (can be called without restart)
app.post('/api/jobs/ensure-processed-sheet', async (req, res) => {
  try {
    await ensureProcessedSheetExists();
    res.json({ success: true, message: "Ensured 'Processed Jobs' sheet exists (check backend logs)." });
  } catch (err) {
    console.error('Error from ensure-processed-sheet endpoint:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to ensure sheet' });
  }
});

// Endpoint: ensure combined jobs sheet exists/updated
app.post('/api/jobs/ensure-combined-sheet', async (req, res) => {
  try {
    await writeCombinedJobsSheet();
    res.json({ success: true, message: "Ensured 'Combined Jobs' sheet exists and is up-to-date." });
  } catch (err) {
    console.error('Error from ensure-combined-sheet endpoint:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to ensure combined sheet' });
  }
});

// Return the Google Sheets spreadsheet URL used by the backend
app.get('/api/spreadsheet-url', (req, res) => {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}`;
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Return contents of the consolidated 'Processed Jobs' sheet and basic stats
app.get('/api/processed-jobs', async (req, res) => {
  try {
    const sheetName = 'Processed Jobs';
    // Read a large range to capture headers + rows
    const range = `${sheetName}!A1:Z1000`;
    const resp = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range });
    const values = resp.data.values || [];
    if (values.length === 0) {
      return res.json({ success: true, headers: [], rows: [], stats: { total: 0, lastProcessedAt: null } });
    }
    const headers = values[0];
    const rows = values.slice(1).map(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = r[i] || ''; });
      return obj;
    }).filter(r => r.job_id && r.job_id !== '');

    // Compute stats
    let lastProcessedAt = null;
    for (const r of rows) {
      const t = r.processed_at || r.processedAt || '';
      if (t) {
        const dt = new Date(t);
        if (!isNaN(dt.getTime())) {
          if (!lastProcessedAt || dt > lastProcessedAt) lastProcessedAt = dt;
        }
      }
    }

    res.json({ success: true, headers, rows, stats: { total: rows.length, lastProcessedAt: lastProcessedAt ? lastProcessedAt.toISOString() : null } });
  } catch (err) {
    console.error('Error reading Processed Jobs sheet:', err.response?.data || err.message || err);
    res.status(500).json({ success: false, error: err.message || 'Failed to read processed jobs' });
  }
});

// API to update driver job counts in the Drivers sheet
app.post('/api/update-driver-job-counts', async (req, res) => {
  try {
    console.log('Updating driver job counts...');
    
    // 1. Fetch all jobs and drivers
    const data = await getCachedData();
    const allJobs = [...data.motorway, ...data.atmoves, ...data.privateCustomers];
    const drivers = await fetchDriversSheet();
    
    console.log(`Processing ${allJobs.length} total jobs and ${drivers.length} drivers`);
    
    // 2. Count jobs per driver
    const driverJobCounts = {};
    
    // Initialize all drivers with 0 jobs
    drivers.forEach(driver => {
      const driverName = (driver.name || driver.Name || driver.driver_name || driver.Driver_Name || '').toString().trim();
      if (driverName) {
        driverJobCounts[driverName] = {
          totalJobs: 0,
          activeJobs: 0,
          completedJobs: 0,
          pendingJobs: 0
        };
      }
    });
    
    // Count jobs for each driver
    allJobs.forEach(job => {
      const assignedDriver = (job.selected_driver || '').toString().trim();
      if (assignedDriver && driverJobCounts[assignedDriver]) {
        driverJobCounts[assignedDriver].totalJobs++;
        
        // Categorize job status
        if (job.job_status === 'completed' || job.job_status === 'Completed') {
          driverJobCounts[assignedDriver].completedJobs++;
        } else if (job.job_active === 'true' || job.job_status === 'active' || job.job_status === 'Active') {
          driverJobCounts[assignedDriver].activeJobs++;
        } else {
          driverJobCounts[assignedDriver].pendingJobs++;
        }
      }
    });
    
    // 3. Get current Drivers sheet structure
    const driversRange = `${SHEETS.drivers.name}!A1:AZ1`;
    const headersRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: driversRange,
    });
    
    const headers = headersRes.data.values[0] || [];
    console.log('Current headers:', headers);
    
    // 4. Find or create job count columns
    let totalJobsCol = headers.findIndex(h => h && h.toLowerCase().includes('total') && h.toLowerCase().includes('job'));
    let activeJobsCol = headers.findIndex(h => h && h.toLowerCase().includes('active') && h.toLowerCase().includes('job'));
    let completedJobsCol = headers.findIndex(h => h && h.toLowerCase().includes('completed') && h.toLowerCase().includes('job'));
    let pendingJobsCol = headers.findIndex(h => h && h.toLowerCase().includes('pending') && h.toLowerCase().includes('job'));
    
    const newHeaders = [...headers];
    const colsToAdd = [];
    
    if (totalJobsCol === -1) {
      totalJobsCol = newHeaders.length;
      newHeaders.push('Total Jobs');
      colsToAdd.push('Total Jobs');
    }
    
    if (activeJobsCol === -1) {
      activeJobsCol = newHeaders.length;
      newHeaders.push('Active Jobs');
      colsToAdd.push('Active Jobs');
    }
    
    if (completedJobsCol === -1) {
      completedJobsCol = newHeaders.length;
      newHeaders.push('Completed Jobs');
      colsToAdd.push('Completed Jobs');
    }
    
    if (pendingJobsCol === -1) {
      pendingJobsCol = newHeaders.length;
      newHeaders.push('Pending Jobs');
      colsToAdd.push('Pending Jobs');
    }
    
    // 5. Update headers if new columns were added
    if (colsToAdd.length > 0) {
      console.log(`Adding new columns: ${colsToAdd.join(', ')}`);
      const lastCol = colLetter(newHeaders.length - 1);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEETS.drivers.name}!A1:${lastCol}1`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [newHeaders] },
      });
    }
    
    // 6. Prepare updates for each driver row
    const driverUpdates = [];
    
    for (let i = 0; i < drivers.length; i++) {
      const driver = drivers[i];
      const driverName = (driver.name || driver.Name || driver.driver_name || driver.Driver_Name || '').toString().trim();
      
      if (driverName && driverJobCounts[driverName]) {
        const rowIndex = i + 2; // +2 for 1-based indexing and header row
        const counts = driverJobCounts[driverName];
        
        // Prepare row data with job counts
        const rowData = [...newHeaders.map(() => '')]; // Initialize with empty strings
        
        // Copy existing driver data
        Object.keys(driver).forEach((key, index) => {
          if (index < headers.length) {
            rowData[index] = driver[key] || '';
          }
        });
        
        // Set job count values
        rowData[totalJobsCol] = counts.totalJobs.toString();
        rowData[activeJobsCol] = counts.activeJobs.toString();
        rowData[completedJobsCol] = counts.completedJobs.toString();
        rowData[pendingJobsCol] = counts.pendingJobs.toString();
        
        driverUpdates.push({
          range: `${SHEETS.drivers.name}!A${rowIndex}:${colLetter(newHeaders.length - 1)}${rowIndex}`,
          values: [rowData]
        });
        
        console.log(`Driver ${driverName}: Total=${counts.totalJobs}, Active=${counts.activeJobs}, Completed=${counts.completedJobs}, Pending=${counts.pendingJobs}`);
      }
    }
    
    // 7. Perform batch update of driver rows
    if (driverUpdates.length > 0) {
      console.log(`Updating ${driverUpdates.length} driver rows...`);
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        resource: {
          data: driverUpdates,
          valueInputOption: 'USER_ENTERED'
        },
      });
    }
    
    // 8. Return summary
    const summary = Object.keys(driverJobCounts).map(driverName => ({
      driverName,
      ...driverJobCounts[driverName]
    })).sort((a, b) => b.totalJobs - a.totalJobs);
    
    console.log('Driver job counts updated successfully');
    
    res.json({
      success: true,
      message: 'Driver job counts updated successfully',
      summary,
      totalDrivers: drivers.length,
      driversWithJobs: summary.filter(d => d.totalJobs > 0).length
    });
    
  } catch (error) {
    console.error('Error updating driver job counts:', error);
    res.status(500).json({ error: error.message });
  }
});

// API to get driver job counts (read-only)
app.get('/api/driver-job-counts', async (req, res) => {
  try {
    // 1. Fetch all jobs and drivers
    const data = await getCachedData();
    const allJobs = [...data.motorway, ...data.atmoves, ...data.privateCustomers];
    const drivers = await fetchDriversSheet();
    
    // 2. Count jobs per driver
    const driverJobCounts = {};
    
    // Initialize all drivers with 0 jobs
    drivers.forEach(driver => {
      const driverName = (driver.name || driver.Name || driver.driver_name || driver.Driver_Name || '').toString().trim();
      if (driverName) {
        driverJobCounts[driverName] = {
          totalJobs: 0,
          activeJobs: 0,
          completedJobs: 0,
          pendingJobs: 0
        };
      }
    });
    
    // Count jobs for each driver
    allJobs.forEach(job => {
      const assignedDriver = (job.selected_driver || '').toString().trim();
      if (assignedDriver && driverJobCounts[assignedDriver]) {
        driverJobCounts[assignedDriver].totalJobs++;
        
        // Categorize job status
        if (job.job_status === 'completed' || job.job_status === 'Completed') {
          driverJobCounts[assignedDriver].completedJobs++;
        } else if (job.job_active === 'true' || job.job_status === 'active' || job.job_status === 'Active') {
          driverJobCounts[assignedDriver].activeJobs++;
        } else {
          driverJobCounts[assignedDriver].pendingJobs++;
        }
      }
    });
    
    // 3. Return summary
    const summary = Object.keys(driverJobCounts).map(driverName => ({
      driverName,
      ...driverJobCounts[driverName]
    })).sort((a, b) => b.totalJobs - a.totalJobs);
    
    res.json({
      success: true,
      summary,
      totalDrivers: drivers.length,
      driversWithJobs: summary.filter(d => d.totalJobs > 0).length
    });
    
  } catch (error) {
    console.error('Error getting driver job counts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper: read Batch Plans sheet and return headers + rows
async function readBatchPlansSheet() {
  const sheetName = 'Batch Plans';
  try {
    const range = `${sheetName}!A1:Z10000`;
    const resp = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range });
    const values = resp.data.values || [];
    if (values.length === 0) return { headers: [], rows: [] };
    const headers = values[0];
    const rows = values.slice(1).map(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = r[i] || ''; });
      return obj;
    });
    return { headers, rows };
  } catch (err) {
    // If sheet doesn't exist, return empty
    if (err.response && err.response.status === 400) return { headers: [], rows: [] };
    throw err;
  }
}

// GET /api/batch-plans - list batches (grouped by batch_id)
app.get('/api/batch-plans', async (req, res) => {
  try {
    const { headers, rows } = await readBatchPlansSheet();
    if (!rows || rows.length === 0) return res.json({ success: true, batches: [], total: 0 });

    // Group by batch_id
    const byBatch = {};
    for (const r of rows) {
      const bid = (r.batch_id || '').toString();
      if (!byBatch[bid]) byBatch[bid] = { batch_id: bid, batch_name: r.batch_name || '', jobs: [], planned_at: r.planned_at || '' };
      byBatch[bid].jobs.push({ job_id: r.job_id || '', cluster_id: r.cluster_id || '', source_sheet: r.source_sheet || '', selected_driver: r.selected_driver || '' });
      if (!byBatch[bid].planned_at && r.planned_at) byBatch[bid].planned_at = r.planned_at;
    }

    const batches = Object.values(byBatch).map(b => ({ batch_id: b.batch_id, batch_name: b.batch_name, count: b.jobs.length, planned_at: b.planned_at }));
    // allow limit param
    const limit = parseInt(req.query.limit || '50');
    res.json({ success: true, total: batches.length, batches: batches.slice(0, limit) });
  } catch (e) {
    console.error('Error listing batch plans:', e.response?.data || e.message || e);
    res.status(500).json({ error: e.message || 'Failed to list batch plans' });
  }
});

// GET /api/batch-plans/:batchId - get jobs for a specific batch
app.get('/api/batch-plans/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    if (!batchId) return res.status(400).json({ error: 'batchId required' });
    const { headers, rows } = await readBatchPlansSheet();
    const matching = (rows || []).filter(r => (r.batch_id || '').toString() === batchId.toString());
    res.json({ success: true, batchId, count: matching.length, jobs: matching });
  } catch (e) {
    console.error('Error fetching batch plan:', e.response?.data || e.message || e);
    res.status(500).json({ error: e.message || 'Failed to fetch batch plan' });
  }
});

// Enhanced API endpoint to assign jobs to drivers with proper order_no sequencing
app.post('/api/assign-jobs-with-sequencing', async (req, res) => {
  try {
    processStartTime = Date.now();
    processEndTime = null;
    processEta = Date.now() + 120000; // Estimate 2 minutes
    
    console.log('\n🚀 Starting Enhanced Job Assignment with Proper Sequencing...');
    
    // 1. Fetch data
    const data = await getCachedData();
    const allJobs = [...data.motorway, ...data.atmoves, ...data.privateCustomers];
    const drivers = await fetchDriversSheet();
    
    console.log(`📊 Processing ${allJobs.length} jobs for ${drivers.length} drivers`);
    
    // Filter jobs that don't already have a driver assigned
    const unassignedJobs = allJobs.filter(job => !job.selected_driver);
    console.log(`📋 Found ${unassignedJobs.length} unassigned jobs`);
    
    if (unassignedJobs.length === 0) {
      return res.json({
        success: true,
        message: 'No unassigned jobs found. All jobs already have drivers assigned.',
        totalJobs: allJobs.length,
        assignedJobs: allJobs.length,
        unassignedJobs: 0
      });
    }
    
    // 2. Collect all postcodes for batch lookup
    const postcodesToBatch = [];
    for (const job of unassignedJobs) {
      if (job.collection_postcode) postcodesToBatch.push(job.collection_postcode.trim().toUpperCase());
      if (job.delivery_postcode) postcodesToBatch.push(job.delivery_postcode.trim().toUpperCase());
    }
    
    // Add driver postcodes
    for (const driver of drivers) {
      const pcKey = Object.keys(driver).find(k => k.toLowerCase().includes('postcode'));
      if (pcKey && driver[pcKey]) {
        postcodesToBatch.push(driver[pcKey].trim().toUpperCase());
      }
    }
    
    const uniquePcs = Array.from(new Set(postcodesToBatch.filter(Boolean)));
    if (uniquePcs.length > 0) {
      console.log(`🔍 Batch-looking up ${uniquePcs.length} postcodes for optimal assignment...`);
      await batchLookupRegions(uniquePcs);
    }
    
    // 3. Helper functions
    function getLatLonForPostcode(postcode) {
      if (!postcode) return null;
      const pc = postcode.toString().trim().toUpperCase();
      if (!pc) return null;
      const cached = postcodeApiCache[pc];
      if (cached && cached.lat != null && cached.lon != null) return { lat: cached.lat, lon: cached.lon };
      const outward = extractArea(pc);
      if (outward && POSTCODE_REGIONS[outward]) {
        const r = POSTCODE_REGIONS[outward];
        if (r.lat != null && r.lon != null) return { lat: r.lat, lon: r.lon };
      }
      return null;
    }

    function haversineMiles(a, b) {
      if (!a || !b) return Infinity;
      const toRad = v => (v * Math.PI) / 180;
      const R = 3958.8; // Earth radius in miles
      const dLat = toRad(b.lat - a.lat);
      const dLon = toRad(b.lon - a.lon);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);
      const sinDLat = Math.sin(dLat / 2);
      const sinDLon = Math.sin(dLon / 2);
      const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon));
      return R * c;
    }

    // 4. Prepare driver candidates with location info
    const driverCandidates = drivers.map(d => {
      const pcKey = Object.keys(d).find(k => k.toLowerCase().includes('postcode'));
      const drvPc = pcKey ? (d[pcKey] || '').toString().trim() : '';
      const drvLatLon = getLatLonForPostcode(drvPc);
      const drvRegion = (d.region || d.Region || '').toString().trim();
      const drvName = (d.name || d.Name || d.driver_name || d.Driver_Name || '').toString().trim();
      return { raw: d, name: drvName, postcode: drvPc, latlon: drvLatLon, region: drvRegion };
    });
    
    // 5. Get current job counts per driver
    const currentDriverJobCounts = {};
    driverCandidates.forEach(dc => {
      const currentJobs = allJobs.filter(job => job.selected_driver === dc.name);
      currentDriverJobCounts[dc.name] = currentJobs.length;
    });
    
    console.log('Current driver job counts:', currentDriverJobCounts);
    
    // 6. Assign jobs using intelligent load balancing with cluster-awareness
    const assignedJobs = [];
    let assignmentStats = {
      sameRegion: 0,
      within10Miles: 0,
      within50Miles: 0,
      nearestFallback: 0,
      noDriverData: 0
    };

    // Group unassigned jobs by cluster_id (fall back to single-job keys)
    const byCluster = {};
    for (const job of unassignedJobs) {
      const cid = (job.cluster_id || job.clusterId || '').toString().trim() || `__single__${job.job_id}`;
      if (!byCluster[cid]) byCluster[cid] = [];
      byCluster[cid].push(job);
    }

    // Process clusters first (prefer pairs), then singles
    const clusterGroups = Object.values(byCluster).sort((a, b) => b.length - a.length);

    for (const group of clusterGroups) {
      if (group.length === 2) {
        // Round-trip pair: prefer assigning both jobs to same driver and sequence them forward->return
        // Choose representative job (prefer the one marked Forward)
  let forwardJob = group.find(j => (j.forward_return_flag || '').toString().toLowerCase() === 'forward') || group[0];
        let returnJob = group.find(j => j !== forwardJob) || group[1];

        const jobRegion = (forwardJob.collection_region || forwardJob.delivery_region || '').toString().trim();
        const jobLatLon = getLatLonForPostcode(forwardJob.collection_postcode || forwardJob.delivery_postcode || '');

        const candidates = driverCandidates.map(dc => {
          const dist = (jobLatLon && dc.latlon) ? haversineMiles(jobLatLon, dc.latlon) : Infinity;
          const sameRegion = (regionToString(dc.region) && regionToString(jobRegion) && regionToString(dc.region).toLowerCase() === regionToString(jobRegion).toLowerCase());
          const currentJobCount = currentDriverJobCounts[dc.name] || 0;
          return { dc, dist, sameRegion, currentJobCount };
        }).filter(c => c.sameRegion || (c.dist !== Infinity && c.dist <= 100) || (c.dist === Infinity && c.dc.name));

        // pick best candidate similarly to single-job logic
        let chosen = null;
        let reason = '';
        if (candidates.length > 0) {
          candidates.sort((a, b) => {
            if (a.sameRegion && !b.sameRegion) return -1;
            if (!a.sameRegion && b.sameRegion) return 1;
            if (a.currentJobCount !== b.currentJobCount) return a.currentJobCount - b.currentJobCount;
            return (a.dist || Infinity) - (b.dist || Infinity);
          });
          chosen = candidates[0];
          reason = chosen.sameRegion ? 'same-region' : (chosen.dist <= 10 ? 'within-10-miles' : (chosen.dist <= 50 ? 'within-50-miles' : (chosen.dist <= 100 ? 'within-100-miles' : 'no-distance-data')));
          if (chosen.sameRegion) assignmentStats.sameRegion++; else if (chosen.dist <= 10) assignmentStats.within10Miles++; else if (chosen.dist <= 50) assignmentStats.within50Miles++; else assignmentStats.nearestFallback++;
        }

        if (!chosen && driverCandidates.length > 0) {
          const sortedByLoad = driverCandidates.map(dc => ({ dc, currentJobCount: currentDriverJobCounts[dc.name] || 0 })).sort((a,b) => a.currentJobCount - b.currentJobCount);
          chosen = { dc: sortedByLoad[0].dc, dist: Infinity, sameRegion: false };
          reason = 'load-balanced-fallback';
          assignmentStats.nearestFallback++;
        }

        if (!chosen) {
          assignmentStats.noDriverData++;
          console.log(`❌ Could not assign cluster jobs ${group.map(g=>g.job_id).join(', ')} - no suitable driver`);
          continue;
        }

        const assignedDriver = chosen.dc.name;
        // starting order for this driver
        const startOrder = (currentDriverJobCounts[assignedDriver] || 0) + 1;

        // Assign forward then return
        forwardJob.selected_driver = assignedDriver;
        forwardJob.order_no = startOrder;
        forwardJob.driver_order_sequence = startOrder;
        forwardJob.job_status = startOrder === 1 ? 'active' : 'pending';
        forwardJob.job_active = startOrder === 1 ? 'true' : 'false';

        returnJob.selected_driver = assignedDriver;
        returnJob.order_no = startOrder + 1;
        returnJob.driver_order_sequence = startOrder + 1;
        returnJob.job_status = 'pending';
        returnJob.job_active = 'false';

        // update counters
        currentDriverJobCounts[assignedDriver] = (currentDriverJobCounts[assignedDriver] || 0) + 2;

        assignedJobs.push({ job_id: forwardJob.job_id, assigned_driver: assignedDriver, order_no: forwardJob.order_no, status: forwardJob.job_status, reason, distance: chosen.dist });
        assignedJobs.push({ job_id: returnJob.job_id, assigned_driver: assignedDriver, order_no: returnJob.order_no, status: returnJob.job_status, reason, distance: chosen.dist });

        console.log(`✅ Cluster ${forwardJob.cluster_id}: assigned to ${assignedDriver} as orders #${forwardJob.order_no} and #${returnJob.order_no}`);

      } else {
        // Groups of size 1 or larger-than-2: fall back to per-job assignment for each job in group
        for (const job of group) {
          const jobRegion = (job.collection_region || job.delivery_region || '').toString().trim();
          const jobCollectionLatLon = getLatLonForPostcode(job.collection_postcode);
          const jobDeliveryLatLon = getLatLonForPostcode(job.delivery_postcode);
          const jobLatLon = jobCollectionLatLon || jobDeliveryLatLon;

          const candidates = driverCandidates.map(dc => {
            const distToCollection = (jobCollectionLatLon && dc.latlon) ? haversineMiles(jobCollectionLatLon, dc.latlon) : Infinity;
            const distToDelivery = (jobDeliveryLatLon && dc.latlon) ? haversineMiles(jobDeliveryLatLon, dc.latlon) : Infinity;
            const minDist = Math.min(distToCollection, distToDelivery);
            const sameRegion = (regionToString(dc.region) && regionToString(jobRegion) && regionToString(dc.region).toLowerCase() === regionToString(jobRegion).toLowerCase());
            const currentJobCount = currentDriverJobCounts[dc.name] || 0;
            return { dc, dist: minDist, sameRegion, currentJobCount };
          }).filter(c => c.sameRegion || (c.dist !== Infinity && c.dist <= 100) || (c.dist === Infinity && c.dc.name));

          let chosen = null;
          let reason = '';
          if (candidates.length > 0) {
            candidates.sort((a, b) => {
              if (a.sameRegion && !b.sameRegion) return -1;
              if (!a.sameRegion && b.sameRegion) return 1;
              if (a.currentJobCount !== b.currentJobCount) return a.currentJobCount - b.currentJobCount;
              return (a.dist || Infinity) - (b.dist || Infinity);
            });
            chosen = candidates[0];
            reason = chosen.sameRegion ? 'same-region' : (chosen.dist <= 10 ? 'within-10-miles' : (chosen.dist <= 50 ? 'within-50-miles' : (chosen.dist <= 100 ? 'within-100-miles' : 'no-distance-data')));
            if (chosen.sameRegion) assignmentStats.sameRegion++; else if (chosen.dist <= 10) assignmentStats.within10Miles++; else if (chosen.dist <= 50) assignmentStats.within50Miles++; else assignmentStats.nearestFallback++;
          }

          if (!chosen && driverCandidates.length > 0) {
            const sortedByLoad = driverCandidates.map(dc => ({ dc, currentJobCount: currentDriverJobCounts[dc.name] || 0 })).sort((a,b) => a.currentJobCount - b.currentJobCount);
            chosen = { dc: sortedByLoad[0].dc, dist: Infinity, sameRegion: false };
            reason = 'load-balanced-fallback';
            assignmentStats.nearestFallback++;
          }

          if (!chosen) {
            assignmentStats.noDriverData++;
            console.log(`❌ Could not assign job ${job.job_id} - no suitable driver found`);
            continue;
          }

          const assignedDriver = chosen.dc.name;
          job.selected_driver = assignedDriver;
          const nextOrderNo = (currentDriverJobCounts[assignedDriver] || 0) + 1;
          job.order_no = nextOrderNo;
          job.driver_order_sequence = nextOrderNo;
          if (nextOrderNo === 1) { job.job_status = 'active'; job.job_active = 'true'; }
          else { job.job_status = 'pending'; job.job_active = 'false'; }
          currentDriverJobCounts[assignedDriver] = nextOrderNo;
          assignedJobs.push({ job_id: job.job_id, assigned_driver: assignedDriver, order_no: nextOrderNo, status: job.job_status, reason, distance: chosen.dist });
          console.log(`✅ Job ${job.job_id} -> Driver: ${assignedDriver}, Order: #${nextOrderNo} (${job.job_status.toUpperCase()}), Reason: ${reason}${chosen && chosen.dist !== Infinity ? `, Distance: ${chosen.dist.toFixed(1)}mi` : ''}`);
        }
      }
    }

    console.log('\n📊 Assignment Statistics:', assignmentStats);
    console.log('\n📊 Updated Driver Job Counts:', currentDriverJobCounts);
    
    // 7. Prepare sheet updates
    const updatesToPerform = [];
    for (const job of unassignedJobs) {
      if (!job.selected_driver) continue; // Skip unassigned jobs
      
      let sheetName = null;
      let sheetData = null;
      
      if (data.motorway.some(j => j.job_id === job.job_id)) {
        sheetName = SHEETS.motorway.name;
        sheetData = data.motorway;
      } else if (data.atmoves.some(j => j.job_id === job.job_id)) {
        sheetName = SHEETS.atmoves.name;
        sheetData = data.atmoves;
      } else if (data.privateCustomers.some(j => j.job_id === job.job_id)) {
        sheetName = SHEETS.privateCustomers.name;
        sheetData = data.privateCustomers;
      }
      
      if (sheetName && sheetData) {
        const rowIdx = sheetData.findIndex(j => j.job_id === job.job_id) + 2;
        if (rowIdx >= 2) {
          updatesToPerform.push({ sheetName, rowIdx, job });
        }
      }
    }
    
    console.log(`📝 Prepared ${updatesToPerform.length} sheet updates`);
    
    // 8. Return response immediately
    const responsePayload = {
      success: true,
      message: `Successfully assigned ${assignedJobs.length} jobs to drivers with proper sequencing`,
      assigned: assignedJobs,
      stats: assignmentStats,
      totalJobsProcessed: unassignedJobs.length,
      jobsAssigned: assignedJobs.length,
      driversAffected: Object.keys(currentDriverJobCounts).filter(d => currentDriverJobCounts[d] > 0).length
    };
    
    processEndTime = Date.now();
    processEta = null;
    
    res.json(responsePayload);
    
    // 9. Perform sheet updates in background
    if (updatesToPerform.length > 0) {
      (async () => {
        try {
          console.log(`\n🔄 Background: performing ${updatesToPerform.length} sheet updates...`);
          
          const updatesBySheet = {};
          for (const upd of updatesToPerform) {
            try {
              if (!updatesBySheet[upd.sheetName]) {
                const headerRes = await sheets.spreadsheets.values.get({
                  spreadsheetId: SHEET_ID,
                  range: `${upd.sheetName}!1:1`,
                });
                const headers = headerRes.data.values[0] || [];
                
                // Ensure we have the required columns
                const requiredColumns = ['order_no', 'driver_order_sequence', 'job_active', 'job_status', 'selected_driver'];
                for (const col of requiredColumns) {
                  if (!headers.includes(col)) {
                    headers.push(col);
                  }
                }
                
                updatesBySheet[upd.sheetName] = { headers, rows: [] };
              }
              
              const headers = updatesBySheet[upd.sheetName].headers;
              const rowData = headers.map(h => upd.job[h] || '');
              updatesBySheet[upd.sheetName].rows.push({ rowIdx: upd.rowIdx, rowData });
            } catch (e) {
              console.error('Background prepare update error:', e.message);
            }
          }
          
          // Perform batch updates per sheet
          for (const sheetName of Object.keys(updatesBySheet)) {
            const { headers, rows } = updatesBySheet[sheetName];
            if (!rows || rows.length === 0) continue;
            
            const lastCol = colLetter(Math.max(headers.length - 1, 0));
            const batchData = rows.map(r => ({ 
              range: `${sheetName}!A${r.rowIdx}:${lastCol}${r.rowIdx}`, 
              values: [r.rowData] 
            }));
            
            try {
              console.log(`📝 Background: batch updating ${rows.length} rows in ${sheetName}...`);
              await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: SHEET_ID,
                resource: { data: batchData, valueInputOption: 'USER_ENTERED' },
              });
              console.log(`✅ Successfully updated ${rows.length} rows in ${sheetName}`);
            } catch (e) {
              console.error(`❌ Background batchUpdate failed for ${sheetName}:`, e.response?.data || e.message);
              
              // Fallback to individual updates
              for (const r of rows) {
                try {
                  await sheets.spreadsheets.values.update({
                    spreadsheetId: SHEET_ID,
                    range: `${sheetName}!A${r.rowIdx}:${lastCol}${r.rowIdx}`,
                    valueInputOption: 'USER_ENTERED',
                    resource: { values: [r.rowData] },
                  });
                } catch (err) {
                  console.error('Background fallback update error:', err.message);
                }
              }
            }
          }
          
          cache.timestamp = 0; // Invalidate cache
          console.log('🎉 Background: all sheet updates complete!');
        } catch (e) {
          console.error('❌ Background update error:', e.message);
        }
      })();
    }
    
  } catch (e) {
    processEndTime = Date.now();
    processEta = null;
    console.error('❌ Enhanced assignment error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// API to get all jobs with proper driver assignments and sequencing
app.get('/api/jobs/all-assignments', async (req, res) => {
  try {
    console.log('Fetching all job assignments with sequencing...');
    
    const data = await getCachedData();
    const allJobs = [...data.motorway, ...data.atmoves, ...data.privateCustomers];
    
    // Group jobs by driver
    const jobsByDriver = {};
    const unassignedJobs = [];
    
    for (const job of allJobs) {
      if (job.selected_driver) {
        if (!jobsByDriver[job.selected_driver]) {
          jobsByDriver[job.selected_driver] = [];
        }
        jobsByDriver[job.selected_driver].push({
          job_id: job.job_id,
          order_no: job.order_no || job.driver_order_sequence,
          job_status: job.job_status || 'pending',
          job_active: job.job_active === 'true',
          collection_address: job.collection_full_address,
          delivery_address: job.delivery_full_address,
          collection_date: job.collection_date,
          delivery_date: job.delivery_date,
          cluster_id: job.cluster_id,
          forward_return_flag: job.forward_return_flag
        });
      } else {
        unassignedJobs.push({
          job_id: job.job_id,
          collection_address: job.collection_full_address,
          delivery_address: job.delivery_full_address,
          collection_date: job.collection_date,
          delivery_date: job.delivery_date
        });
      }
    }
    
    // Sort jobs within each driver by order_no
    for (const driverName in jobsByDriver) {
      jobsByDriver[driverName].sort((a, b) => {
        const aOrder = parseInt(a.order_no || '0');
        const bOrder = parseInt(b.order_no || '0');
        return aOrder - bOrder;
      });
    }
    
    // Calculate summary stats
    const driverStats = Object.keys(jobsByDriver).map(driverName => {
      const jobs = jobsByDriver[driverName];
      const completedJobs = jobs.filter(j => j.job_status === 'completed');
      const activeJobs = jobs.filter(j => j.job_active);
      const pendingJobs = jobs.filter(j => j.job_status !== 'completed' && !j.job_active);
      
      return {
        driverName,
        totalJobs: jobs.length,
        completedJobs: completedJobs.length,
        activeJobs: activeJobs.length,
        pendingJobs: pendingJobs.length,
        currentActiveJob: activeJobs.length > 0 ? activeJobs[0].job_id : null
      };
    });
    
    res.json({
      success: true,
      jobsByDriver,
      unassignedJobs,
      driverStats,
      totalDrivers: Object.keys(jobsByDriver).length,
      totalAssignedJobs: Object.values(jobsByDriver).reduce((sum, jobs) => sum + jobs.length, 0),
      totalUnassignedJobs: unassignedJobs.length
    });
    
  } catch (error) {
    console.error('Error fetching job assignments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: enforce sequencing and single active job per driver across all sheets
app.post('/api/jobs/enforce-sequencing', async (req, res) => {
  try {
    console.log('Enforcing sequencing and single active job per driver across all sheets...');
    const data = await getCachedData();
    const allJobs = [...data.motorway, ...data.atmoves, ...data.privateCustomers];

    // Group jobs by driver
    const jobsByDriver = {};
    for (const job of allJobs) {
      const drv = (job.selected_driver || '').toString().trim();
      if (!drv) continue;
      if (!jobsByDriver[drv]) jobsByDriver[drv] = [];
      jobsByDriver[drv].push(job);
    }

    const sheetsToUpdate = new Map();
    let totalUpdated = 0;

    for (const [driverName, driverJobs] of Object.entries(jobsByDriver)) {
      // Sort by existing order_no/driver_order_sequence then by creation time
      driverJobs.sort((a, b) => {
        const aOrder = parseInt(a.order_no || a.driver_order_sequence || '0');
        const bOrder = parseInt(b.order_no || b.driver_order_sequence || '0');
        if (aOrder !== bOrder) return aOrder - bOrder;
        const aTime = a.date_time_created || a.job_id || '';
        const bTime = b.date_time_created || b.job_id || '';
        return aTime.localeCompare(bTime);
      });

      // Re-sequence and set active/pending/completed
      let seq = 1;
      let activeSet = false;
      for (const job of driverJobs) {
        const oldOrder = job.order_no || job.driver_order_sequence;
        const oldStatus = job.job_status;
        const oldActive = job.job_active;

        if (job.job_status === 'completed') {
          job.order_no = String(seq++);
          job.driver_order_sequence = job.order_no;
          job.job_active = 'false';
        } else {
          job.order_no = String(seq++);
          job.driver_order_sequence = job.order_no;
          if (!activeSet) {
            job.job_active = 'true';
            job.job_status = 'active';
            activeSet = true;
          } else {
            job.job_active = 'false';
            job.job_status = 'pending';
          }
        }

        if (oldOrder !== job.order_no || oldStatus !== job.job_status || oldActive !== job.job_active) {
          // schedule update for the sheet where this job lives
          let jobSheetName = null;
          let sheetData = null;
          if (data.motorway.some(j => j.job_id === job.job_id)) {
            jobSheetName = SHEETS.motorway.name;
            sheetData = data.motorway;
          } else if (data.atmoves.some(j => j.job_id === job.job_id)) {
            jobSheetName = SHEETS.atmoves.name;
            sheetData = data.atmoves;
          } else if (data.privateCustomers.some(j => j.job_id === job.job_id)) {
            jobSheetName = SHEETS.privateCustomers.name;
            sheetData = data.privateCustomers;
          }

          if (jobSheetName && sheetData) {
            const rowIdx = sheetData.findIndex(j => j.job_id === job.job_id) + 2;
            if (!sheetsToUpdate.has(jobSheetName)) sheetsToUpdate.set(jobSheetName, []);
            sheetsToUpdate.get(jobSheetName).push({ job, rowIdx });
            totalUpdated++;
          }
        }
      }
    }

    // Perform batch updates per sheet
    for (const [sheetName, updates] of sheetsToUpdate.entries()) {
      try {
        const headerRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${sheetName}!1:1` });
        const headers = headerRes.data.values[0] || [];
        const required = ['order_no', 'driver_order_sequence', 'job_active', 'job_status'];
        for (const c of required) if (!headers.includes(c)) headers.push(c);

        const batchData = updates.map(u => {
          const rowData = headers.map(h => u.job[h] || '');
          const lastCol = colLetter(Math.max(headers.length - 1, 0));
          return { range: `${sheetName}!A${u.rowIdx}:${lastCol}${u.rowIdx}`, values: [rowData] };
        });

        if (batchData.length > 0) {
          await sheets.spreadsheets.values.batchUpdate({ spreadsheetId: SHEET_ID, resource: { data: batchData, valueInputOption: 'USER_ENTERED' } });
          console.log(`Updated ${batchData.length} rows in ${sheetName} for sequencing enforcement`);
        }
      } catch (e) {
        console.error(`Error enforcing sequencing in ${sheetName}:`, e.response?.data || e.message || e);
      }
    }

    cache.timestamp = 0;

    res.json({ success: true, message: 'Sequencing enforced', totalUpdated });
  } catch (error) {
    console.error('Error enforcing sequencing:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React build
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Handle React routing - send all non-API requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV === 'production') {
    console.log('Serving React frontend from /frontend/build');
  }
  // Temporarily disabled to avoid quota issues at startup - will be called on-demand
  // ensureProcessedSheetExists().catch(err => console.error('Startup sheet creation error:', err));
  // writeCombinedJobsSheet().catch(err => console.error('Startup combined sheet creation error:', err));
  console.log('📊 Rate limiting enabled: API quota-aware operations ready');
});

// Helper: write a Batch Plans sheet and append rows for a created batch
async function writeBatchPlans(batchId, batchName, jobs) {
  const sheetName = 'Batch Plans';
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const existing = (meta.data.sheets || []).find(s => s.properties && s.properties.title === sheetName);
    const required = ['batch_id', 'batch_name', 'cluster_id', 'job_id', 'source_sheet', 'selected_driver', 'planned_at'];

    let headers = [];
    if (!existing) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        resource: { requests: [{ addSheet: { properties: { title: sheetName, gridProperties: { rowCount: 2000, columnCount: required.length } } } }] }
      });
      headers = required.slice();
      await sheets.spreadsheets.values.update({ spreadsheetId: SHEET_ID, range: `${sheetName}!A1:${colLetter(headers.length - 1)}1`, valueInputOption: 'USER_ENTERED', resource: { values: [headers] } });
    } else {
      const headerRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${sheetName}!1:1` });
      headers = headerRes.data.values ? headerRes.data.values[0] : [];
      const missing = required.filter(r => !headers.includes(r));
      if (missing.length > 0) {
        headers = headers.concat(missing);
        await sheets.spreadsheets.values.update({ spreadsheetId: SHEET_ID, range: `${sheetName}!A1:${colLetter(headers.length - 1)}1`, valueInputOption: 'USER_ENTERED', resource: { values: [headers] } });
      }
    }

    const now = new Date().toISOString();
    const rows = jobs.map(j => [batchId, batchName || '', j.cluster_id || '', j.job_id || j.jobId || '', j.source_sheet || j.sheet || '', j.selected_driver || j.driver || '', j.planned_at || now]);
    const padded = rows.map(r => { const copy = r.slice(); while (copy.length < headers.length) copy.push(''); return copy; });
    if (padded.length > 0) {
      await sheets.spreadsheets.values.append({ spreadsheetId: SHEET_ID, range: `${sheetName}!A1`, valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS', resource: { values: padded } });
    }
    return { success: true, appended: padded.length };
  } catch (err) {
    console.error('Error writing Batch Plans sheet:', err.response?.data || err.message || err);
    throw err;
  }
}

// API: create a batch plan from cluster IDs and/or job IDs
app.post('/api/batch-plans/create', async (req, res) => {
  try {
    const { clusterIds = [], jobIds = [], batchName = '' } = req.body || {};
    if ((!Array.isArray(clusterIds) || clusterIds.length === 0) && (!Array.isArray(jobIds) || jobIds.length === 0)) {
      return res.status(400).json({ error: 'Provide clusterIds or jobIds to create a batch' });
    }

    const data = await getCachedData();
    const allJobs = [...data.motorway, ...data.atmoves, ...data.privateCustomers];

    const selectedJobs = [];
    const seen = new Set();

    if (Array.isArray(clusterIds)) {
      for (const cid of clusterIds) {
        for (const j of allJobs) {
          if (j.cluster_id && j.cluster_id.toString() === cid.toString() && !seen.has(j.job_id)) {
            selectedJobs.push(Object.assign({}, j, { source_sheet: (data.motorway.includes(j) ? SHEETS.motorway.name : (data.atmoves.includes(j) ? SHEETS.atmoves.name : (data.privateCustomers.includes(j) ? SHEETS.privateCustomers.name : '')) ) }));
            seen.add(j.job_id);
          }
        }
      }
    }

    if (Array.isArray(jobIds)) {
      for (const jid of jobIds) {
        const j = allJobs.find(x => x.job_id && x.job_id.toString() === jid.toString());
        if (j && !seen.has(j.job_id)) {
          selectedJobs.push(Object.assign({}, j, { source_sheet: (data.motorway.includes(j) ? SHEETS.motorway.name : (data.atmoves.includes(j) ? SHEETS.atmoves.name : (data.privateCustomers.includes(j) ? SHEETS.privateCustomers.name : '')) ) }));
          seen.add(j.job_id);
        }
      }
    }

    if (selectedJobs.length === 0) return res.status(404).json({ error: 'No matching jobs found for provided clusterIds/jobIds' });

    const batchId = generateId('BATCH');
    const now = new Date().toISOString();
    // attach planned_at and batch marker in-memory
    selectedJobs.forEach(j => { j.batch_id = batchId; j.batch_name = batchName || ''; j.planned_at = now; });

    // Persist to Batch Plans sheet
    await writeBatchPlans(batchId, batchName, selectedJobs);

    // Invalidate cache so UI can refresh
    cache.timestamp = 0;

    res.json({ success: true, batchId, count: selectedJobs.length, jobs: selectedJobs.map(j => ({ job_id: j.job_id, cluster_id: j.cluster_id, selected_driver: j.selected_driver, source_sheet: j.source_sheet })) });
  } catch (e) {
    console.error('Error creating batch plan:', e.response?.data || e.message || e);
    res.status(500).json({ error: e.message || 'Failed to create batch plan' });
  }
});

  // --- Exported utilities for testing (module-scope) ---
  export function generateClustersForTesting(jobs, drivers, options = {}) {
    const POSTCODE_CACHE = options.postcodeCache || postcodeApiCache || {};

    function getMeta(j) {
      const colPc = (j.collection_postcode || '').toString().trim().toUpperCase();
      const delPc = (j.delivery_postcode || '').toString().trim().toUpperCase();
      return {
        job: j,
        colOut: extractOutwardCode(colPc) || extractArea(colPc),
        delOut: extractOutwardCode(delPc) || extractArea(delPc),
        colLatLon: POSTCODE_CACHE[colPc] || null,
        delLatLon: POSTCODE_CACHE[delPc] || null,
        colPc,
        delPc
      };
    }

    function pairScore(aMeta, bMeta) {
      let datePenalty = 0;
      if (aMeta.job.delivery_date && bMeta.job.collection_date) {
        const da = new Date(aMeta.job.delivery_date);
        const db = new Date(bMeta.job.collection_date);
        const diff = Math.abs(Math.round((db - da) / (1000 * 60 * 60 * 24)));
        datePenalty = diff;
      } else datePenalty = 2;

      const outwardBonus = (aMeta.delOut && bMeta.colOut && aMeta.delOut === bMeta.colOut) ? -5 : 0;

      const regionA = (POSTCODE_CACHE[aMeta.delPc] || {}).region || lookupRegion(aMeta.delPc);
      const regionB = (POSTCODE_CACHE[bMeta.colPc] || {}).region || lookupRegion(bMeta.colPc);
      const regionBonus = (regionToString(regionA) && regionToString(regionB) && regionToString(regionA).toLowerCase() === regionToString(regionB).toLowerCase()) ? -3 : 0;

      let dist = Infinity;
      if (aMeta.delLatLon && bMeta.colLatLon && aMeta.delLatLon.lat && bMeta.colLatLon.lat) {
        dist = haversineMiles(aMeta.delLatLon, bMeta.colLatLon);
      }
      const distPenalty = (dist === Infinity) ? 20 : Math.min(20, Math.round(dist));

      return datePenalty + distPenalty + outwardBonus + regionBonus;
    }

    const jobMeta = jobs.map(getMeta);
    const clusters = [];
    const clustered = new Set();
    let clusterIdCounter = 1;

    for (let i = 0; i < jobMeta.length; i++) {
      if (clustered.has(i)) continue;
      const a = jobMeta[i];
      let best = null;
      for (let j = i + 1; j < jobMeta.length; j++) {
        if (clustered.has(j)) continue;
        const b = jobMeta[j];
        const score = pairScore(a, b);
        if (!best || score < best.score) best = { idx: j, score };
      }
      if (best && best.score < 15) {
        const clusterId = `CLUSTER-${clusterIdCounter++}`;
        clusters.push({ jobs: [a.job, jobMeta[best.idx].job], clusterId });
        clustered.add(i);
        clustered.add(best.idx);
      } else {
        const clusterId = `CLUSTER-${clusterIdCounter++}`;
        clusters.push({ jobs: [a.job], clusterId });
        clustered.add(i);
      }
    }

    return clusters;
  }

  export { extractOutwardCode, extractArea, regionToString, batchLookupRegions };
