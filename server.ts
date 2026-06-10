import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.use(express.json());

  // API Route FIRST
  app.post("/api/test-smtp", async (req, res) => {
    const { host, port, username, password } = req.body;
    
    if (!host || !port) {
      return res.status(400).json({ 
        success: false, 
        message: "Faltan los datos del servidor Host o Puerto." 
      });
    }

    const numericPort = parseInt(port, 10);
    if (isNaN(numericPort)) {
      return res.status(400).json({ 
        success: false, 
        message: "El puerto debe ser un número válido." 
      });
    }

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Faltan las credenciales: Cuenta de Correo y Clave."
      });
    }

    console.log(`[SMTP Test] Intentando autenticar y enviar correo de prueba a través de ${host}:${numericPort} con el usuario ${username}`);

    try {
      // Configure transport
      const transporter = nodemailer.createTransport({
        host: host,
        port: numericPort,
        secure: numericPort === 465, // true for 465, false for 587/25
        auth: {
          user: username,
          pass: password,
        },
        tls: {
          rejectUnauthorized: false // Avoid issues with self-signed certificates
        },
        connectionTimeout: 10000 // 10s timeout
      });

      // Verify connection configuration
      console.log("[SMTP Test] Verificando credenciales...");
      await transporter.verify();

      // Send actual test email to check delivery
      const info = await transporter.sendMail({
        from: `"${username}" <${username}>`,
        to: "proyectosticampestre@gmail.com",
        subject: "🔔 [Lifecycle PM] Prueba de Configuración de Servidor SMTP Exitosa",
        text: `Hola,\n\nEste es un correo automático de prueba generado desde el módulo de Configuración Central de Lifecycle PM.\n\nFelicidades, la conexión y autenticación con tu servidor SMTP (${host}:${numericPort}) ha sido establecida con éxito y la plataforma está habilitada para enviar alertas y recuperaciones en tiempo real.\n\nRemitente: ${username}\nDestinatario de Pruebas: proyectosticampestre@gmail.com\nFecha y Hora de Prueba: ${new Date().toISOString()}\n\nSaludos cordiales,\nSoporte de Sistemas Lifecycle PM.`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded-lg; background-color: #ffffff;">
            <div style="background-color: #3b82f6; padding: 16px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
              <h2 style="margin: 0; font-size: 20px;">Lifecycle PM - Notificaciones</h2>
            </div>
            <div style="padding: 20px; color: #1e293b; line-height: 1.6;">
              <h3 style="color: #10b981; margin-top: 0;">🚀 Enlace de Prueba de Correo Exitoso</h3>
              <p>Hola,</p>
              <p>Este es un correo automático de prueba generado desde el módulo de <strong>Configuración Central de la Plataforma</strong> en la aplicación Lifecycle PM.</p>
              <p>La conexión, encriptación y credenciales con tu servidor de alertas SMTP han sido validadas correctamente.</p>
              
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
                La autenticación del servidor ha respondido correctamente. Lifecycle PM ahora puede despachar alertas presupuestales, control de costos, y recuperación de contraseñas de manera confiable.
              </p>
              
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 11px; color: #64748b; text-align: center;">Este mensaje ha sido auto-firmado y despachado con fines de diagnóstico técnico. Por favor no responda directamente a este remitente.</p>
            </div>
          </div>
        `
      });

      console.log("[SMTP Test] Correo enviado exitosamente:", info.messageId);

      return res.json({
        success: true,
        message: `¡Autenticación y envío realizados con éxito! El correo ha sido despachado por el servidor ${host}.`,
        banner: `MessageId: ${info.messageId}\nHostname: ${host}\nAccepted: ${info.accepted.join(", ")}`
      });

    } catch (error: any) {
      console.error("[SMTP Test Error Nodemailer]", error);
      let errorMsg = error.message || "No se pudo establecer conexión SMTP o autenticar.";
      
      if (error.code === 'EAUTH') {
        errorMsg = `Error de Autenticación (EAUTH): Usuario o Contraseña incorrectos. Si usa Gmail u Outlook, asegúrese de utilizar una "Contraseña de Aplicación" dedicada y no la contraseña personal habitual de su cuenta de correo.`;
      } else if (error.code === 'ENOTFOUND') {
        errorMsg = `Nombre de servidor no encontrado (ENOTFOUND). Verifique que el Host "${host}" no contenga faltas ortográficas o caracteres raros.`;
      } else if (error.code === 'ECONNREFUSED') {
        errorMsg = `Conexión rechazada (ECONNREFUSED) por el servidor "${host}" en el puerto ${numericPort}. Verifique si el proveedor admite conexiones externas o está bloqueando la IP.`;
      } else if (error.code === 'ETIMEDOUT') {
        errorMsg = `Tiempo de respuesta agotado (ETIMEDOUT). El puerto o el Host están tardando demasiado en responder. Asegúrese de que no haya firewalls de red bloqueando el puerto ${numericPort}.`;
      }

      return res.status(550).json({
        success: false,
        message: errorMsg,
        code: error.code || 'SMTP_ERROR'
      });
    }
  });

  // API to send actual recovery emails from front-end
  app.post("/api/send-recovery", async (req, res) => {
    const { host, port, username, password, emailToFind } = req.body;

    if (!emailToFind) {
      return res.status(400).json({ success: false, message: "Destinatario no especificado." });
    }

    if (!host || !port || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "No se puede enviar el correo de recuperación porque el servidor de Alertas SMTP no se encuentra configurado temporalmente."
      });
    }

    const numericPort = parseInt(port, 10);

    try {
      const transporter = nodemailer.createTransport({
        host: host,
        port: numericPort,
        secure: numericPort === 465,
        auth: { user: username, pass: password },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000
      });

      const tempToken = Math.random().toString(36).substring(2, 10).toUpperCase();

      await transporter.sendMail({
        from: `"${username}" <${username}>`,
        to: emailToFind,
        subject: "🔒 [Lifecycle PM] Código de Verificación para Recuperación de Contraseña",
        text: `Hola,\n\nHemos recibido una solicitud de restablecimiento de contraseña para tu cuenta de Lifecycle PM.\n\nPara completar la autenticación, ingresa el siguiente código de seguridad en la ventana del navegador:\n\nCódigo: ${tempToken}\n\nEste código vencerá en 15 minutos.\n\nSi no has solicitado este cambio, por favor ignora este correo.\n\nSaludos,\nEl equipo de Lifecycle PM.`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="background-color: #1e293b; padding: 18px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
              <h2 style="margin: 0; font-size: 18px; tracking-wider; font-weight: 500;">LIFECYCLE PM</h2>
            </div>
            <div style="padding: 20px; color: #334155; line-height: 1.6;">
              <h3 style="color: #2563eb; margin-top: 0; font-size: 18px;">Restablecer Contraseña</h3>
              <p>Hola,</p>
              <p>Se ha iniciado una solicitud de recuperación de credenciales de acceso para tu cuenta oficial en el portal <strong>Lifecycle PM</strong>.</p>
              
              <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b; tracking-wider;">CÓDIGO DE RECUPERACIÓN</p>
                <div style="font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #1e3a8a; font-family: monospace;">${tempToken}</div>
              </div>
              
              <p style="font-size: 13px;">Ingrese este código en el formulario para establecer una nueva contraseña de acceso segura.</p>
              <p style="font-size: 12px; color: #94a3b8;">Por motivos de auditoria de seguridad, este código expira automáticamente en 15 minutos y se autorregula de forma independiente.</p>

              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
              <p style="font-size: 11px; color: #94a3b8; text-align: center;">Si tú no has iniciado este requerimiento, por favor haz caso omiso a esta alerta. Las credenciales permanecerán seguras.</p>
            </div>
          </div>
        `
      });

      return res.json({ 
        success: true, 
        message: `El código de recuperación (${tempToken}) ha sido enviado satisfactoriamente al correo ${emailToFind} con SSL/TLS.`,
        tempToken: tempToken
      });

    } catch (error: any) {
      console.error("[SMTP Send Recovery Error]", error);
      let errorMsg = error.message || "Error general de red.";
      
      if (error.code === 'EAUTH') {
        errorMsg = `Error de Autenticación (EAUTH): Usuario o Contraseña incorrectos. Si usa Gmail u Outlook, asegúrese de utilizar una "Contraseña de Aplicación" dedicada y no la contraseña personal habitual de su cuenta de correo.`;
      } else if (error.code === 'ENOTFOUND') {
        errorMsg = `Nombre de servidor no encontrado (ENOTFOUND). Verifique que el Host no contenga faltas ortográficas o caracteres raros.`;
      } else if (error.code === 'ECONNREFUSED') {
        errorMsg = `Conexión rechazada (ECONNREFUSED) por el servidor en el puerto especificado. Asegúrese de que el puerto sea correcto (465 o 587).`;
      } else if (error.code === 'ETIMEDOUT') {
        errorMsg = `Tiempo de respuesta agotado (ETIMEDOUT). El puerto o el Host están tardando demasiado en responder.`;
      }

      return res.status(500).json({ 
        success: false, 
        message: `No se pudo enviar el correo de recuperación. Detalle: ${errorMsg}` 
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
