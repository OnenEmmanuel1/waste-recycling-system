import './config/env.js';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config, describeConfigWarnings } from './config/env.js';
import { closePool, execute, ping, pool, select, selectOne } from './db/pool.js';
import {
  ARTICLE_CATEGORIES, CENTER_CERTIFICATION, REPORT_STATUSES, ValidationError,
  optionalRating, optionalText, requireCoordinates, requireEmail, requireEnum,
  requireInteger, requirePassword, requireText,
} from './services/validation.js';

const app = express();
class MySQLSessionStore extends session.Store {
  get(id, callback) {
    selectOne('SELECT data,expires FROM sessions WHERE session_id=?',[id]).then(async(row)=>{
      if(!row)return callback(null,null);
      if(Number(row.expires)<Math.floor(Date.now()/1000)){await execute('DELETE FROM sessions WHERE session_id=?',[id]);return callback(null,null);}
      callback(null,typeof row.data==='string'?JSON.parse(row.data):row.data);
    }).catch(callback);
  }
  set(id,data,callback) {
    const expires=data.cookie?.expires?Math.floor(new Date(data.cookie.expires).getTime()/1000):Math.floor((Date.now()+config.session.maxAgeMs)/1000);
    execute('INSERT INTO sessions(session_id,expires,data) VALUES(?,?,?) ON DUPLICATE KEY UPDATE expires=VALUES(expires),data=VALUES(data)',[id,expires,JSON.stringify(data)]).then(()=>callback?.()).catch((error)=>callback?.(error));
  }
  touch(id,data,callback) {
    const expires=data.cookie?.expires?Math.floor(new Date(data.cookie.expires).getTime()/1000):Math.floor((Date.now()+config.session.maxAgeMs)/1000);
    execute('UPDATE sessions SET expires=? WHERE session_id=?',[expires,id]).then(()=>callback?.()).catch((error)=>callback?.(error));
  }
  destroy(id,callback){execute('DELETE FROM sessions WHERE session_id=?',[id]).then(()=>callback?.()).catch((error)=>callback?.(error));}
}
const sessionStore=new MySQLSessionStore();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.uploads.maxBytes, files: 1 }, fileFilter(_req, file, cb) {
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
  else cb(new ValidationError('Upload a JPEG, PNG or WebP image.'));
} });
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const flash = (req, type, message) => { req.session.flash = { type, message }; };
const redirect = (res, pathName) => res.redirect(303, pathName);
const redirectAfterFlash = async (req, res, pathName) => {
  await new Promise((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
  redirect(res, pathName);
};
const authenticated = (req, res, next) => req.session.user ? next() : redirect(res, '/login');
const signedIn = (req, res, next) => req.session.user?.role === 'RegisteredUser' ? next() : req.session.user ? res.sendStatus(403) : redirect(res, '/login');
const adminOnly = (req, res, next) => req.session.user?.role === 'Administrator' ? next() : res.sendStatus(req.session.user ? 403 : 401);
const readCsrf = (req, res, next) => {
  const submitted = req.body?._csrf;
  if (!submitted || !req.session.csrf || String(submitted).length !== req.session.csrf.length || !crypto.timingSafeEqual(Buffer.from(String(submitted)), Buffer.from(req.session.csrf))) {
    return res.status(403).render('pages/error', { title: 'Session expired', message: 'Reload the page and submit the form again.' });
  }
  next();
};
const csrfToken = (req) => req.session.csrf ||= crypto.randomBytes(32).toString('hex');
const ensureUploadDir = async () => fs.mkdir(config.uploads.dir, { recursive: true, mode: 0o700 });
const inspectImage = (buffer) => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
};
const saveReportImage = async (file) => {
  if (!file) return null;
  const ext = inspectImage(file.buffer);
  if (!ext) throw new ValidationError('Upload a valid JPEG, PNG or WebP image.');
  await ensureUploadDir();
  const filename = `${crypto.randomBytes(20).toString('hex')}.${ext}`;
  await fs.writeFile(path.join(config.uploads.dir, filename), file.buffer, { flag: 'wx', mode: 0o600 });
  return filename;
};

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(config.rootDir, 'views'));
app.use(helmet({ contentSecurityPolicy: { directives: {
  defaultSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://unpkg.com'],
  scriptSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://unpkg.com'], imgSrc: ["'self'", 'data:', 'https://*.tile.openstreetmap.org', 'https://thisistbs.com', 'https://assets.thisistbs.com'],
  connectSrc: ["'self'"], fontSrc: ["'self'", 'https://cdn.jsdelivr.net'], objectSrc: ["'none'"], frameAncestors: ["'none'"],
} }, crossOriginEmbedderPolicy: false }));
app.use(express.urlencoded({ extended: false, limit: '32kb' }));
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(config.rootDir, 'public'), { index: false, maxAge: config.app.isProduction ? '1d' : 0 }));
app.use(session({ name: config.session.name, secret: config.session.secret, store: sessionStore,
  resave: false, saveUninitialized: false, rolling: true,
  cookie: { httpOnly: true, secure: config.session.secure, sameSite: 'lax', maxAge: config.session.maxAgeMs },
}));
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.csrf = csrfToken(req);
  const acceptsHtmlDocument = req.method === 'GET' && /(?:^|[,;\s])text\/html(?:[;,]|$)/i.test(req.get('accept') || '');
  res.locals.flash = acceptsHtmlDocument ? req.session.flash || null : null;
  if (acceptsHtmlDocument) delete req.session.flash;
  res.locals.appName = config.app.name;
  res.locals.currentPath = req.path;
  next();
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-7', legacyHeaders: false });
app.get('/', asyncRoute(async (_req, res) => {
  const stats = await selectOne('SELECT (SELECT COUNT(*) FROM recycling_centers) centers,(SELECT COUNT(*) FROM articles) articles,(SELECT COUNT(*) FROM recycling_logs) logs');
  const articles = await select('SELECT articleId,title,body,category,publishedAt FROM articles ORDER BY publishedAt DESC LIMIT 3');
  res.render('pages/home', { title: 'A better next chapter for old electronics', stats, articles });
}));
app.get('/centers', asyncRoute(async (_req, res) => {
  const centers = await select('SELECT centerId,name,address,latitude,longitude,certifiedStatus,contactInfo,description FROM recycling_centers ORDER BY name');
  res.render('pages/centers', { title: 'Find a recycling centre', centers });
}));
app.get('/articles/:category(awareness|policy)', asyncRoute(async (req, res) => {
  const category = req.params.category === 'policy' ? 'Policy' : 'Awareness';
  const articles = await select('SELECT a.*,u.fullName author FROM articles a LEFT JOIN users u ON u.userId=a.authorId WHERE category=? ORDER BY publishedAt DESC', [category]);
  res.render('pages/articles', { title: category === 'Policy' ? 'Policy and management' : 'E-waste awareness', category, articles });
}));
app.get('/api/centers', asyncRoute(async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=120');
  res.json(await select('SELECT centerId,name,address,latitude,longitude,certifiedStatus,contactInfo,description FROM recycling_centers ORDER BY name'));
}));
app.get('/api/analytics', adminOnly, asyncRoute(async (_req, res) => {
  const [reports, monthly, totals] = await Promise.all([
    select('SELECT itemType,COUNT(*) count FROM ewaste_reports GROUP BY itemType ORDER BY count DESC'),
    select("SELECT DATE_FORMAT(loggedAt,'%Y-%m') month,COUNT(*) actions FROM recycling_logs WHERE loggedAt>=DATE_SUB(CURDATE(),INTERVAL 12 MONTH) GROUP BY month ORDER BY month"),
    selectOne('SELECT (SELECT COUNT(*) FROM ewaste_reports) reports,(SELECT COUNT(*) FROM recycling_logs) logs,(SELECT COUNT(*) FROM recycling_centers) centers'),
  ]);
  res.json({ reports, monthly, totals });
}));
app.get('/health', asyncRoute(async (_req, res) => { await ping(); res.json({ status: 'ok' }); }));

app.get('/register', (_req, res) => res.render('pages/auth', { title: 'Create an account', mode: 'register' }));
app.post('/register', authLimiter, readCsrf, asyncRoute(async (req, res) => {
  const name = requireText(req.body.fullName, 'fullName', 'Full name', 100);
  const email = requireEmail(req.body.email);
  const password = requirePassword(req.body.password);
  const affiliation = optionalText(req.body.affiliation, 'affiliation', 'Affiliation', 60);
  const hash = await bcrypt.hash(password, 12);
  await execute("INSERT INTO users(fullName,email,passwordHash,role,affiliation) VALUES(?,?,?,'RegisteredUser',?)", [name, email, hash, affiliation]);
  flash(req, 'success', 'Account created. Sign in to submit reports and track recycling.');
  await redirectAfterFlash(req, res, '/login');
}));
app.get('/login', (_req, res) => res.render('pages/auth', { title: 'Sign in', mode: 'login' }));
app.post('/login', authLimiter, readCsrf, asyncRoute(async (req, res) => {
  const email = requireEmail(req.body.email);
  const account = await selectOne('SELECT userId,fullName,email,passwordHash,role,affiliation,createdAt FROM users WHERE email=?', [email]);
  if (!account || !(await bcrypt.compare(req.body.password || '', account.passwordHash))) {
    flash(req, 'error', 'Email or password is incorrect.'); return redirectAfterFlash(req, res, '/login');
  }
  await new Promise((resolve, reject) => req.session.regenerate((err) => err ? reject(err) : resolve()));
  req.session.user = { userId: account.userId, fullName: account.fullName, email: account.email, role: account.role, affiliation: account.affiliation, createdAt: account.createdAt };
  req.session.csrf = crypto.randomBytes(32).toString('hex');
  await new Promise((resolve,reject)=>req.session.save((error)=>error?reject(error):resolve()));
  redirect(res, account.role === 'Administrator' ? '/admin' : '/dashboard');
}));
app.post('/logout', readCsrf, (req, res) => req.session.destroy(() => redirect(res, '/')));

app.get('/dashboard', authenticated, asyncRoute(async (req, res) => {
  if (req.session.user.role === 'Administrator') return redirect(res, '/admin');
  const [stats, reports, logs] = await Promise.all([
    selectOne("SELECT (SELECT COUNT(*) FROM ewaste_reports WHERE userId=?) reports,(SELECT COUNT(*) FROM ewaste_reports WHERE userId=? AND status='Pending') pending,(SELECT COUNT(*) FROM recycling_logs WHERE userId=?) logs", [req.session.user.userId, req.session.user.userId, req.session.user.userId]),
    select('SELECT * FROM ewaste_reports WHERE userId=? ORDER BY reportedAt DESC LIMIT 5', [req.session.user.userId]),
    select('SELECT l.*,c.name centerName,f.rating,f.message FROM recycling_logs l LEFT JOIN recycling_centers c ON c.centerId=l.centerId LEFT JOIN feedback f ON f.logId=l.logId WHERE l.userId=? ORDER BY loggedAt DESC LIMIT 5', [req.session.user.userId]),
  ]);
  res.render('pages/dashboard', { title: 'My participation', reports, logs, stats });
}));
app.get('/dashboard/reports', authenticated, asyncRoute(async (req, res) => {
  if (req.session.user.role === 'Administrator') return redirect(res, '/admin/reports');
  const reports = await select('SELECT * FROM ewaste_reports WHERE userId=? ORDER BY reportedAt DESC', [req.session.user.userId]);
  res.render('pages/dashboard-reports', { title: 'My reports', reports });
}));
app.get('/dashboard/activity', authenticated, asyncRoute(async (req, res) => {
  if (req.session.user.role === 'Administrator') return redirect(res, '/admin');
  const [logs, centers] = await Promise.all([
    select('SELECT l.*,c.name centerName,f.rating,f.message FROM recycling_logs l LEFT JOIN recycling_centers c ON c.centerId=l.centerId LEFT JOIN feedback f ON f.logId=l.logId WHERE l.userId=? ORDER BY loggedAt DESC', [req.session.user.userId]),
    select('SELECT centerId,name FROM recycling_centers ORDER BY name'),
  ]);
  res.render('pages/dashboard-activity', { title: 'Recycling activity', logs, centers });
}));
app.post('/reports', signedIn, upload.single('photo'), readCsrf, asyncRoute(async (req, res) => {
  const itemType = requireText(req.body.itemType, 'itemType', 'Item type', 100);
  const campusLocation = requireText(req.body.campusLocation, 'campusLocation', 'Campus location', 150);
  const quantity = optionalText(req.body.estimatedQuantity, 'estimatedQuantity', 'Estimated quantity', 60);
  const photoPath = await saveReportImage(req.file);
  try { await execute('INSERT INTO ewaste_reports(userId,itemType,estimatedQuantity,campusLocation,photoPath) VALUES(?,?,?,?,?)', [req.session.user.userId,itemType,quantity,campusLocation,photoPath]); }
  catch (error) { if (photoPath) await fs.unlink(path.join(config.uploads.dir, photoPath)).catch(()=>{}); throw error; }
  flash(req, 'success', 'Your e-waste report has been sent for review.'); await redirectAfterFlash(req, res, '/dashboard/reports');
}));
app.post('/reports/:id/update', signedIn, readCsrf, asyncRoute(async (req, res) => {
  const itemType=requireText(req.body.itemType,'itemType','Item type',100),campusLocation=requireText(req.body.campusLocation,'campusLocation','Campus location',150),quantity=optionalText(req.body.estimatedQuantity,'estimatedQuantity','Estimated quantity',60);
  const [result]=await execute('UPDATE ewaste_reports SET itemType=?,estimatedQuantity=?,campusLocation=? WHERE reportId=? AND userId=?',[itemType,quantity,campusLocation,req.params.id,req.session.user.userId]);
  flash(req,result.affectedRows?'success':'error',result.affectedRows?'Report details updated.':'That report could not be updated.');await redirectAfterFlash(req,res,'/dashboard/reports');
}));
app.post('/reports/:id/delete', signedIn, readCsrf, asyncRoute(async (req, res) => {
  const report=await selectOne('SELECT photoPath FROM ewaste_reports WHERE reportId=? AND userId=?',[req.params.id,req.session.user.userId]);
  const [result] = await execute('DELETE FROM ewaste_reports WHERE reportId=? AND userId=?', [req.params.id,req.session.user.userId]);
  if (result.affectedRows) { if(report?.photoPath)await fs.unlink(path.join(config.uploads.dir,report.photoPath)).catch(()=>{});flash(req,'success','Your report was deleted.'); } else flash(req,'error','That report could not be deleted.');
  await redirectAfterFlash(req,res,'/dashboard/reports');
}));
app.post('/logs', signedIn, readCsrf, asyncRoute(async (req, res) => {
  const itemType = requireText(req.body.itemType,'itemType','Item type',100);
  const quantity = requireText(req.body.quantity,'quantity','Quantity',60);
  const centerId = req.body.centerId ? requireInteger(req.body.centerId,'centerId','Collection centre') : null;
  if (centerId && !await selectOne('SELECT centerId FROM recycling_centers WHERE centerId=?',[centerId])) throw new ValidationError('Select an existing collection centre.');
  const rating = optionalRating(req.body.rating);
  const message = optionalText(req.body.message,'message','Feedback',2000);
  const connection = await pool.getConnection();
  try { await connection.beginTransaction(); const [result]=await connection.execute('INSERT INTO recycling_logs(userId,centerId,itemType,quantity) VALUES(?,?,?,?)',[req.session.user.userId,centerId,itemType,quantity]);if(rating!==null||message)await connection.execute('INSERT INTO feedback(userId,logId,rating,message) VALUES(?,?,?,?)',[req.session.user.userId,result.insertId,rating,message]);await connection.commit(); }
  catch(error){await connection.rollback();throw error;}finally{connection.release();}
  flash(req,'success','Recycling activity saved. Thank you for taking action.');await redirectAfterFlash(req,res,'/dashboard/activity');
}));
app.post('/logs/:id/update',signedIn,readCsrf,asyncRoute(async(req,res)=>{
  const item=requireText(req.body.itemType,'itemType','Item type',100),quantity=requireText(req.body.quantity,'quantity','Quantity',60),center=req.body.centerId?requireInteger(req.body.centerId,'centerId','Collection centre'):null;
  if(center&&!await selectOne('SELECT centerId FROM recycling_centers WHERE centerId=?',[center]))throw new ValidationError('Select an existing collection centre.');
  const [result]=await execute('UPDATE recycling_logs SET itemType=?,quantity=?,centerId=? WHERE logId=? AND userId=?',[item,quantity,center,req.params.id,req.session.user.userId]);
  flash(req,result.affectedRows?'success':'error',result.affectedRows?'Recycling activity updated.':'That activity could not be updated.');await redirectAfterFlash(req,res,'/dashboard/activity');
}));
app.post('/logs/:id/delete', signedIn, readCsrf, asyncRoute(async(req,res)=>{await execute('DELETE FROM recycling_logs WHERE logId=? AND userId=?',[req.params.id,req.session.user.userId]);flash(req,'success','Recycling activity deleted.');await redirectAfterFlash(req,res,'/dashboard/activity');}));
app.get('/photos/:filename', authenticated, asyncRoute(async(req,res)=>{
  const filename=String(req.params.filename); if(!/^[a-f0-9]{40}\.(jpg|png|webp)$/.test(filename))return res.sendStatus(404);
  const report=await selectOne('SELECT userId FROM ewaste_reports WHERE photoPath=?',[filename]);
  if(!report||(report.userId!==req.session.user.userId&&req.session.user.role!=='Administrator'))return res.sendStatus(404);
  res.type(filename.split('.').pop());res.set('X-Content-Type-Options','nosniff');res.sendFile(path.join(config.uploads.dir,filename));
}));

app.get('/admin',adminOnly,asyncRoute(async(_req,res)=>{
  const totals=await selectOne("SELECT (SELECT COUNT(*) FROM ewaste_reports) reports,(SELECT COUNT(*) FROM ewaste_reports WHERE status='Pending') unreviewed,(SELECT COUNT(*) FROM recycling_logs) logs,(SELECT COUNT(*) FROM recycling_centers) centers,(SELECT COUNT(*) FROM users WHERE role='RegisteredUser') members");
  const recentReports=await select('SELECT r.reportId,r.itemType,r.status,r.reportedAt,u.fullName FROM ewaste_reports r JOIN users u ON u.userId=r.userId ORDER BY (r.status=\'Pending\') DESC,r.reportedAt DESC LIMIT 6');
  res.render('pages/admin',{title:'Administrator dashboard',totals,recentReports});
}));
app.get('/admin/reports',adminOnly,asyncRoute(async(_req,res)=>{
  const reports=await select('SELECT r.*,u.fullName,u.email FROM ewaste_reports r JOIN users u ON u.userId=r.userId ORDER BY (r.status=\'Pending\') DESC,r.reportedAt DESC');
  res.render('pages/admin-reports',{title:'Report review',reports});
}));
app.get('/admin/centers',adminOnly,asyncRoute(async(_req,res)=>{
  const centers=await select('SELECT * FROM recycling_centers ORDER BY name');
  res.render('pages/admin-centers',{title:'Collection centres',centers});
}));
app.get('/admin/content',adminOnly,asyncRoute(async(_req,res)=>{
  const articles=await select('SELECT * FROM articles ORDER BY publishedAt DESC');
  res.render('pages/admin-content',{title:'Learning resources',articles});
}));
app.get('/admin/users',adminOnly,asyncRoute(async(_req,res)=>{
  const users=await select("SELECT userId,fullName,email,role,affiliation,createdAt FROM users WHERE role='RegisteredUser' ORDER BY fullName");
  res.render('pages/admin-users',{title:'Members and access',users});
}));
app.post('/admin/reports/:id/status',adminOnly,readCsrf,asyncRoute(async(req,res)=>{
  const status=requireEnum(req.body.status,REPORT_STATUSES,'status','Report status');
  await execute("UPDATE ewaste_reports SET status=?,reviewedBy=IF(?='Pending',NULL,?),reviewedAt=IF(?='Pending',NULL,NOW()) WHERE reportId=?",[status,status,req.session.user.userId,status,req.params.id]);flash(req,'success','Report status updated.');await redirectAfterFlash(req,res,'/admin/reports');
}));
app.post('/admin/centers',adminOnly,readCsrf,asyncRoute(async(req,res)=>{
  const name=requireText(req.body.name,'name','Centre name',150),address=requireText(req.body.address,'address','Address',200);
  const {latitude,longitude}=requireCoordinates(req.body.latitude,req.body.longitude);const certifiedStatus=requireEnum(req.body.certifiedStatus,CENTER_CERTIFICATION,'certifiedStatus','Certification status');
  const contactInfo=optionalText(req.body.contactInfo,'contactInfo','Contact information',150),description=optionalText(req.body.description,'description','Description',10000);
  if(req.body.centerId)await execute('UPDATE recycling_centers SET name=?,address=?,latitude=?,longitude=?,certifiedStatus=?,contactInfo=?,description=? WHERE centerId=?',[name,address,latitude,longitude,certifiedStatus,contactInfo,description,req.body.centerId]);
  else await execute('INSERT INTO recycling_centers(name,address,latitude,longitude,certifiedStatus,contactInfo,description,addedBy) VALUES(?,?,?,?,?,?,?,?)',[name,address,latitude,longitude,certifiedStatus,contactInfo,description,req.session.user.userId]);
  flash(req,'success','Collection centre saved.');await redirectAfterFlash(req,res,'/admin/centers');
}));
app.post('/admin/centers/:id/delete',adminOnly,readCsrf,asyncRoute(async(req,res)=>{await execute('DELETE FROM recycling_centers WHERE centerId=?',[req.params.id]);flash(req,'success','Collection centre deleted.');await redirectAfterFlash(req,res,'/admin/centers');}));
app.post('/admin/articles',adminOnly,readCsrf,asyncRoute(async(req,res)=>{
  const title=requireText(req.body.title,'title','Title',150),body=requireText(req.body.body,'body','Article content',60000),category=requireEnum(req.body.category,ARTICLE_CATEGORIES,'category','Category');
  if(req.body.articleId)await execute('UPDATE articles SET title=?,body=?,category=? WHERE articleId=?',[title,body,category,req.body.articleId]);else await execute('INSERT INTO articles(title,body,category,authorId) VALUES(?,?,?,?)',[title,body,category,req.session.user.userId]);
  flash(req,'success','Article saved.');await redirectAfterFlash(req,res,'/admin/content');
}));
app.post('/admin/articles/:id/delete',adminOnly,readCsrf,asyncRoute(async(req,res)=>{await execute('DELETE FROM articles WHERE articleId=?',[req.params.id]);flash(req,'success','Article deleted.');await redirectAfterFlash(req,res,'/admin/content');}));
app.post('/admin/users',adminOnly,readCsrf,asyncRoute(async(req,res)=>{
  const fullName=requireText(req.body.fullName,'fullName','Full name',100),email=requireEmail(req.body.email),password=requirePassword(req.body.password),affiliation=optionalText(req.body.affiliation,'affiliation','Affiliation',60);
  await execute("INSERT INTO users(fullName,email,passwordHash,role,affiliation) VALUES(?,?,?,'Administrator',?)",[fullName,email,await bcrypt.hash(password,12),affiliation]);flash(req,'success','Administrator account created.');await redirectAfterFlash(req,res,'/admin/users');
}));

app.use((req,res)=>res.status(404).render('pages/error',{title:'Page not found',message:'That page is not available.'}));
app.use((error,req,res,_next)=>{
  if(error instanceof multer.MulterError){error=new ValidationError(error.code==='LIMIT_FILE_SIZE'?`Photo must be smaller than ${Math.round(config.uploads.maxBytes/1024/1024)} MB.`:'Only one image file can be uploaded.');}
  if(error?.code==='ER_DUP_ENTRY')error=new ValidationError('That email address is already registered.');
  if(config.app.debug)console.error(error);
  if(res.headersSent)return;
  const message=error instanceof ValidationError?error.message:(config.app.isProduction?'Something went wrong. Please try again.':error.message);
  if(req.path.startsWith('/api/'))return res.status(error instanceof ValidationError?400:500).json({error:error instanceof ValidationError?message:'Unable to retrieve the requested data.'});
  res.status(error instanceof ValidationError?400:500).render('pages/error',{title:'Unable to complete request',message});
});

let server;
let sessionCleanup;
const start=async()=>{
  const warnings=describeConfigWarnings();warnings.forEach((message)=>console.warn(`Config: ${message}`));
  await ping();sessionCleanup=setInterval(()=>execute('DELETE FROM sessions WHERE expires<?',[Math.floor(Date.now()/1000)]).catch((error)=>console.error('Session cleanup failed:',error.message)),15*60*1000);sessionCleanup.unref();server=app.listen(config.app.port,()=>console.log(`${config.app.name} listening on port ${config.app.port}`));
};
const shutdown=async()=>{if(sessionCleanup)clearInterval(sessionCleanup);if(server)await new Promise((resolve)=>server.close(resolve));await closePool();process.exit(0);};
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
if(process.env.NODE_ENV!=='test')start().catch((error)=>{console.error('Unable to start EWRAP:',error.message);process.exit(1);});
export { app };
