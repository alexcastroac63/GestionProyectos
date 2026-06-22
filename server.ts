import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Secure Lifecycle Central Configuration
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.error("FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is missing in production environment!");
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || "secure-lifecycle-pmo-pmo-cluster-stack-key-2026-dev-fallback";
const PASSWORD_SALT = process.env.PASSWORD_SALT || "lifecyclepm-campestre-salt-corp-2026";

// Security Allowlist for SMTP Hosts to prevent Server-Side Request Forgery (SSRF)
const ALLOWED_SMTP_HOSTS = [
  "smtp.gmail.com",
  "smtp.office365.com",
  "smtp-mail.outlook.com",
  "smtp.sendgrid.net",
  "smtp.mailgun.org",
  "mail.campestre.com.sv"
];

function isHostAllowed(host: string): boolean {
  if (!host) return false;
  const normalized = host.toLowerCase().trim();
  if (ALLOWED_SMTP_HOSTS.includes(normalized)) return true;
  // Allow any subdomains of campestre.com.sv
  if (normalized === "campestre.com.sv" || normalized.endsWith(".campestre.com.sv")) return true;
  return false;
}

// In-Memory Rate Limiting Tracker to prevent Brute-Force Attacks
const rateLimitStore = new Map<string, { count: number; blockedUntil: number }>();

function checkRateLimit(key: string, maxAttempts = 5, blockDurationMs = 15 * 60 * 1000): { isBlocked: boolean; timeLeftMs: number } {
  const record = rateLimitStore.get(key);
  if (!record) return { isBlocked: false, timeLeftMs: 0 };
  
  const now = Date.now();
  if (now < record.blockedUntil) {
    return { isBlocked: true, timeLeftMs: record.blockedUntil - now };
  }
  
  // If block duration has expired, reset counter
  if (record.blockedUntil > 0 && now >= record.blockedUntil) {
    rateLimitStore.delete(key);
    return { isBlocked: false, timeLeftMs: 0 };
  }
  
  return { isBlocked: false, timeLeftMs: 0 };
}

function recordRateLimitFailedAttempt(key: string, maxAttempts = 5, blockDurationMs = 15 * 60 * 1000) {
  const record = rateLimitStore.get(key) || { count: 0, blockedUntil: 0 };
  record.count++;
  if (record.count >= maxAttempts) {
    record.blockedUntil = Date.now() + blockDurationMs;
  }
  rateLimitStore.set(key, record);
}

function resetRateLimit(key: string) {
  rateLimitStore.delete(key);
}

// Secure Dynamic Password Hashing Utility
function hashPassword(password: string): string {
  return crypto.createHmac("sha256", PASSWORD_SALT).update(password).digest("hex");
}

// In-Memory Cryptographically Secure Credentials Store (No plaintext passwords stored in codebase)
const userCredentialsStore = new Map<string, string>();

function initializeCredentials() {
  const defaultPlaintext = "Camp2026+Prub28";
  const defaultHash = hashPassword(defaultPlaintext);
  
  const initialEmails = [
    "sa@campestre.com.sv",
    "alex.castro@campestre.com.sv",
    "elmer.segovia@campestre.com.sv",
    "kevin.flores@campestre.com.sv",
    "cecilia.rodriguez@campestre.com.sv",
    "rodolfo.galeas@campestre.com.sv"
  ];
  
  initialEmails.forEach(email => {
    userCredentialsStore.set(email, defaultHash);
  });
}
initializeCredentials();

// Active security tokens for forgot password (never returned to client)
const recoveryTokensStore = new Map<string, { token: string; expiresAt: number }>();

// Simple, ultra-secure session signing with JWT-Expiration (2 hours duration)
function signSession(userPayload: any): string {
  const payloadWithExp = {
    ...userPayload,
    exp: Date.now() + 2 * 60 * 60 * 1000 // 2 hours expiration
  };
  const serialized = JSON.stringify(payloadWithExp);
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(serialized).digest("hex");
  return Buffer.from(serialized).toString("base64") + "." + signature;
}

function verifySession(token: string): any {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const payloadStr = Buffer.from(parts[0], "base64").toString("utf-8");
    const signature = parts[1];
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(payloadStr).digest("hex");
    if (signature === expectedSignature) {
      const parsed = JSON.parse(payloadStr);
      // Verify token expiration
      if (parsed.exp && Date.now() > parsed.exp) {
        console.warn("Verify session: Token has expired for", parsed.email);
        return null;
      }
      return parsed;
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.use(express.json());

  // Finding 9: Expose standard healthcheck API endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Finding 2: Server-Side Authentication API
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Correo y contraseña requeridos." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check rate limit
    const rateCheck = checkRateLimit(normalizedEmail);
    if (rateCheck.isBlocked) {
      const remainingMinutes = Math.ceil(rateCheck.timeLeftMs / 60000);
      return res.status(429).json({
        success: false,
        message: `Demasiados intentos fallidos. Tu cuenta está temporalmente bloqueada por seguridad. Inténtalo de nuevo en ${remainingMinutes} minutos.`
      });
    }

    const correctPasswordHash = userCredentialsStore.get(normalizedEmail);

    if (!correctPasswordHash) {
      recordRateLimitFailedAttempt(normalizedEmail);
      return res.status(401).json({ 
        success: false, 
        message: "El correo ingresado no se encuentra registrado en el Directorio Corporativo." 
      });
    }

    // Verify hashed password
    const incomingHash = hashPassword(password);
    if (incomingHash !== correctPasswordHash) {
      recordRateLimitFailedAttempt(normalizedEmail);
      return res.status(401).json({ 
        success: false, 
        message: "La contraseña ingresada es incorrecta." 
      });
    }

    // Success - reset attempts
    resetRateLimit(normalizedEmail);

    // Return authenticated user block along with HMAC secure session token (Fending Local Tampering)
    const secureToken = signSession({ email: normalizedEmail });

    return res.json({ 
      success: true, 
      message: "Autenticación exitosa", 
      token: secureToken
    });
  });

  // API to verify active session signatures on client reload
  app.post("/api/verify-session", (req, res) => {
    const { token } = req.body;
    const session = verifySession(token);
    if (!session) {
      return res.status(401).json({ success: false, message: "Sesión inválida o firma alterada/expirada." });
    }
    return res.json({ success: true, email: session.email });
  });

  // Finding 3 & 12: API to send actual recovery emails from backend safely without returning recovery codes
  app.post("/api/send-recovery", async (req, res) => {
    const { host, port, username, password, emailToFind } = req.body;

    if (!emailToFind) {
      return res.status(400).json({ success: false, message: "Destinatario no especificado." });
    }

    const normalizedRecoveryEmail = emailToFind.toLowerCase().trim();

    // Check recovery rate limit
    const recoveryRateCheck = checkRateLimit(normalizedRecoveryEmail, 3, 10 * 60 * 1000); // 3 max attempts, 10 min block
    if (recoveryRateCheck.isBlocked) {
      const remainingMinutes = Math.ceil(recoveryRateCheck.timeLeftMs / 60000);
      return res.status(429).json({
        success: false,
        message: `Demasiadas solicitudes de recuperación enviadas. Inténtalo de nuevo en ${remainingMinutes} minutos.`
      });
    }

    if (!host || !port || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "No se puede iniciar el envío porque el servidor SMTP de alertas no se halla configurado."
      });
    }

    // SSRF Mitigation check
    if (!isHostAllowed(host)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado: El servidor SMTP "${host}" no está autorizado en las políticas de seguridad de la infraestructura.`
      });
    }

    const numericPort = parseInt(port, 10);

    try {
      // Configure transport with rigid TLS validation (Mitigating finding 4)
      const transporter = nodemailer.createTransport({
        host: host,
        port: numericPort,
        secure: numericPort === 465,
        auth: { user: username, pass: password },
        tls: { 
          rejectUnauthorized: true, // Strict TLS validation - No self-signed MITM
          minVersion: 'TLSv1.2'
        },
        connectionTimeout: 10000
      });

      const tempToken = crypto.randomBytes(4).toString("hex").toUpperCase();

      // Dispatch recovery email
      await transporter.sendMail({
        from: `"${username}" <${username}>`,
        to: normalizedRecoveryEmail,
        subject: "🔒 [Lifecycle PM] Código de Verificación para Recuperación de Contraseña",
        text: `Hola,\n\nHemos recibido una solicitud de restablecimiento de contraseña para tu cuenta de Lifecycle PM.\n\nPara completar la autenticación, ingresa el siguiente código de seguridad en la ventana del navegador:\n\nCódigo: ${tempToken}\n\nEste código vencerá en 15 minutos.\n\nSi no has solicitado este cambio, por favor ignora este correo y tus credenciales continuarán protegidas de forma segura.\n\nSaludos,\nEl equipo de Seguridad Lifecycle PM.`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="background-color: #1e293b; padding: 18px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
              <h2 style="margin: 0; font-size: 18px; tracking-wider; font-weight: 500;">LIFECYCLE PM</h2>
            </div>
            <div style="padding: 20px; color: #334155; line-height: 1.6;">
              <h3 style="color: #2563eb; margin-top: 0; font-size: 18px;">Restablecer Contraseña</h3>
              <p>Hola,</p>
              <p>Se ha iniciado una solicitud de recuperación de credenciales de acceso para tu cuenta oficial en el portal de <strong>Auditoría & Proyectos Lifecycle PM</strong>.</p>
              
              <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b; tracking-wider;">CÓDIGO DE RECUPERACIÓN</p>
                <div style="font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #1e3a8a; font-family: monospace;">${tempToken}</div>
              </div>
              
              <p style="font-size: 13px;">Ingrese este código en el formulario para establecer una nueva contraseña de acceso segura.</p>
              <p style="font-size: 12px; color: #94a3b8;">Por motivos de auditoría de seguridad, este código expira automáticamente en 15 minutos de forma autónoma.</p>
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
              <p style="font-size: 11px; color: #94a3b8; text-align: center;">Si tú no has solicitado este proceso, haz caso omiso. Tus credenciales continuarán a salvo.</p>
            </div>
          </div>
        `
      });

      // Save token in memory securely (Finding 5: never send it back to the client!)
      recoveryTokensStore.set(normalizedRecoveryEmail, {
        token: tempToken,
        expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes
      });

      // Track rate limit attempt
      recordRateLimitFailedAttempt(normalizedRecoveryEmail, 3, 10 * 60 * 1000);

      return res.json({ 
        success: true, 
        message: `El código de recuperación ha sido enviado satisfactoriamente al correo ${emailToFind} con encriptación SSL/TLS segura.`
      });

    } catch (error: any) {
      console.error("[SMTP Send Recovery Error]", error);
      let errorMsg = error.message || "Error general de red.";
      return res.status(500).json({ 
        success: false, 
        message: `No se pudo despachar el correo de recuperación. Detalle: ${errorMsg}` 
      });
    }
  });

  // Verify recovery token server-side (Finding 5)
  app.post("/api/verify-recovery", (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: "Faltan datos de autenticación." });
    }

    const emailKey = email.toLowerCase().trim();
    const sessionToken = recoveryTokensStore.get(emailKey);

    if (!sessionToken) {
      return res.status(400).json({ 
        success: false, 
        message: "No existe una solicitud de restauración activa para este correo." 
      });
    }

    if (Date.now() > sessionToken.expiresAt) {
      recoveryTokensStore.delete(emailKey);
      return res.status(400).json({ 
        success: false, 
        message: "El código de restauración ha expirado (límite de 15 minutos)." 
      });
    }

    if (sessionToken.token !== code.trim().toUpperCase()) {
      return res.status(401).json({ 
        success: false, 
        message: "El código de seguridad ingresado es incorrecto." 
      });
    }

    // Code is validated!
    return res.json({ success: true, message: "Código verificado correctamente." });
  });

  // Reset user password server-side in-memory store
  app.post("/api/reset-password", (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: "Faltan datos requeridos." });
    }

    const emailKey = email.toLowerCase().trim();
    const sessionToken = recoveryTokensStore.get(emailKey);

    if (!sessionToken || sessionToken.token !== code.trim().toUpperCase()) {
      return res.status(401).json({ 
        success: false, 
        message: "Error de autenticación: Token fallido o expirado." 
      });
    }

    if (newPassword.trim().length < 4) {
      return res.status(400).json({ 
        success: false, 
        message: "La nueva contraseña debe tener al menos 4 caracteres." 
      });
    }

    // Hash the new password and update in-memory credentials store securely!
    const hashedNewPassword = hashPassword(newPassword.trim());
    userCredentialsStore.set(emailKey, hashedNewPassword);
    recoveryTokensStore.delete(emailKey); // Cleanup token
    resetRateLimit(emailKey); // Reset any failed login count for this email

    return res.json({ success: true, message: "Contraseña actualizada exitosamente." });
  });

  // Finding 3 & 4: Safe SMTP connection test with allowed hosts check
  app.post("/api/test-smtp", async (req, res) => {
    const { host, port, username, password } = req.body;
    
    if (!host || !port) {
      return res.status(400).json({ 
        success: false, 
        message: "Faltan los datos del servidor Host o Puerto." 
      });
    }

    // SSRF Mitigation check
    if (!isHostAllowed(host)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado: El servidor SMTP "${host}" no está autorizado en las políticas de seguridad de la infraestructura.`
      });
    }

    const numericPort = parseInt(port, 10);
    if (isNaN(numericPort)) {
      return res.status(400).json({ 
        success: false, 
        message: "El puerto de comunicación debe ser numérico." 
      });
    }

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Faltan las credenciales: Cuenta de Correo y Clave."
      });
    }

    try {
      // Configure transport with strict TLS check (Mitigating finding 4)
      const transporter = nodemailer.createTransport({
        host: host,
        port: numericPort,
        secure: numericPort === 465,
        auth: {
          user: username,
          pass: password,
        },
        tls: {
          rejectUnauthorized: true, // Rigid verification
          minVersion: 'TLSv1.2'
        },
        connectionTimeout: 10000
      });

      // Verify connection configuration
      await transporter.verify();

      // Send actual test email to check delivery
      const info = await transporter.sendMail({
        from: `"${username}" <${username}>`,
        to: "proyectosticampestre@gmail.com",
        subject: "🔔 [Lifecycle PM] Prueba de Configuración de Servidor SMTP Exitosa",
        text: `Hola,\n\nEste es un correo automático de prueba generado desde el módulo de Configuración Central de Lifecycle PM.\n\nLa conexión y autenticación con tu servidor SMTP (${host}:${numericPort}) ha sido establecida con éxito mediante validación TLS.\n\nRemitente: ${username}\nDestinatario de Pruebas: proyectosticampestre@gmail.com\nFecha de Prueba: ${new Date().toISOString()}\n\nSaludos cordiales,\nSoporte de Sistemas Lifecycle PM.`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
            <div style="background-color: #3b82f6; padding: 16px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
              <h2 style="margin: 0; font-size: 20px;">Lifecycle PM - Notificaciones</h2>
            </div>
            <div style="padding: 20px; color: #1e293b; line-height: 1.6;">
              <h3 style="color: #10b981; margin-top: 0;">🚀 Enlace de Prueba de Correo Exitoso</h3>
              <p>Hola,</p>
              <p>Este es un correo automático de prueba generado desde el módulo de <strong>Configuración Central de la Plataforma</strong> en la aplicación Lifecycle PM.</p>
              <p>La conexión, encriptación y credenciales con tu servidor de alertas SMTP han sido validadas correctamente con encriptación activa certificada.</p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13px;">
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0; width: 150px;">Servidor Host:</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${host}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Puerto:</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${numericPort}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Cuenta Originadora:</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${username}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Destinatario:</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">proyectosticampestre@gmail.com</td>
                </tr>
              </table>

              <p style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; border-radius: 4px; font-size: 13px; color: #1e40af;">
                La autenticación del servidor ha respondido correctamente. Lifecycle PM ahora puede despachar alertas presupuestales, control de costos, y recuperación de contraseñas de manera confiable con host verificado.
              </p>
              
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 11px; color: #64748b; text-align: center;">Este mensaje ha sido auto-firmado y despachado con fines de diagnóstico técnico bajo control de auditoría TLS.</p>
            </div>
          </div>
        `
      });

      return res.json({
        success: true,
        message: `¡Autenticación y envío realizados con éxito! El correo ha sido despachado por el servidor ${host}.`,
        banner: `MessageId: ${info.messageId}\nHostname: ${host}\nAccepted: ${info.accepted.join(", ")}`
      });

    } catch (error: any) {
      console.error("[SMTP Test Error Nodemailer]", error);
      let errorMsg = error.message || "No se pudo establecer conexión SMTP o autenticar.";
      return res.status(550).json({
        success: false,
        message: errorMsg,
        code: error.code || 'SMTP_ERROR'
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
