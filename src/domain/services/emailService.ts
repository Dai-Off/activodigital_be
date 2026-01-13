import { getSupabaseClient } from '../../lib/supabase';
import { Invitation, UserRole } from '../../types/user';
import { Building } from '../../types/edificio';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private getSupabase() {
    return getSupabaseClient();
  }

  private getFrontendUrl(): string {
    console.log('🔍 EmailService.getFrontendUrl() - Variables de entorno:');
    console.log('  - FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('  - NODE_ENV:', process.env.NODE_ENV);
    
    // 1. Si hay FRONTEND_URL configurado, usarlo (tanto en desarrollo como en producción)
    if (process.env.FRONTEND_URL) {
      console.log('✅ Usando FRONTEND_URL configurado:', process.env.FRONTEND_URL);
      return process.env.FRONTEND_URL;
    }

    // 2. En desarrollo, usar localhost por defecto
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev') {
      console.log('✅ Usando localhost por defecto (development)');
      return 'http://localhost:5173';
    }
    
    // 3. En producción, usar la URL de producción por defecto
    console.log('❌ Usando URL de producción por defecto');
    return 'https://edificio-digital.fly.dev';
  }

  /**
   * Envía una invitación por email usando Supabase Edge Functions
   */
  async sendInvitationEmail(invitation: Invitation, building: Building, invitedByUser: any): Promise<void> {
    const emailTemplate = this.generateInvitationEmail(invitation, building, invitedByUser);
    
    try {
    const isAssignmentNotification = invitation.token === 'assignment-notification';
    console.log(`\n📧 ENVIANDO EMAIL - Tipo: ${isAssignmentNotification ? 'ASIGNACIÓN' : 'REGISTRO'} | Destino: ${invitation.email}`);
    console.log(`🔗 Link generado: ${isAssignmentNotification ? 'AUTO-ACCEPT' : 'REGISTER'}`);
    console.log(`🔍 Token recibido: "${invitation.token}"`);
    console.log(`🔍 ¿Es assignment-notification?: ${isAssignmentNotification}`);
      
      // Usar Supabase Edge Function existente para enviar email
      const { data, error } = await this.getSupabase().functions.invoke('send-invitation-email', {
        body: {
          to: invitation.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
          invitation: {
            id: invitation.id,
            token: invitation.token,
            role: invitation.role?.name || '',
            expiresAt: invitation.expiresAt
          },
          building: {
            id: building.id,
            name: building.name,
            address: building.address
          },
          invitedBy: {
            name: invitedByUser.fullName || 'Propietario',
            email: invitedByUser.email
          }
        }
      });

      if (error) {
        console.error('❌ Error enviando email:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        throw new Error(`Error al enviar email: ${error.message}`);
      }

      console.log(`✅ EMAIL ENVIADO EXITOSAMENTE - ID: ${data?.emailId || 'N/A'}`);
    } catch (error) {
      console.error('Error en sendInvitationEmail:', error);
      throw new Error(`Error al enviar email de invitación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Genera el template de email para invitaciones
   */
  private generateInvitationEmail(invitation: Invitation, building: Building, invitedByUser: any): EmailTemplate {
    const roleName = invitation.role?.name === 'tecnico' ? 'Técnico' : 
                     invitation.role?.name === 'cfo' ? 'CFO' : 'Propietario';
    
    // Determinar si es una invitación de registro o de asignación
    const isAssignmentNotification = invitation.token === 'assignment-notification';
    const frontendUrl = this.getFrontendUrl();
    const actionUrl = isAssignmentNotification 
      ? `${frontendUrl}/auth/auto-accept?email=${encodeURIComponent(invitation.email)}&building=${building.id}`
      : `${frontendUrl}/auth/invitation/${invitation.token}`;
    
    const subject = `Invitación para ser ${roleName} en ${building.name}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitación de Trabajo</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
          }
          .title {
            color: #2c3e50;
            margin-bottom: 20px;
          }
          .building-info {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #0056b3;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            font-size: 14px;
            color: #6c757d;
          }
          .expires {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ActivoDigital</div>
          </div>
          
          <h1 class="title">¡Has sido invitado a unirte como ${roleName}!</h1>
          
          <p>Hola,</p>
          
          <p><strong>${invitedByUser.fullName || 'Un propietario'}</strong> te ha invitado a formar parte del equipo de <strong>${building.name}</strong> como ${roleName}.</p>
          
          <div class="building-info">
            <h3>🏢 Información del Edificio</h3>
            <p><strong>Nombre:</strong> ${building.name}</p>
            <p><strong>Dirección:</strong> ${building.address}</p>
            <p><strong>Tu rol:</strong> ${roleName}</p>
          </div>
          
          <p>Como ${roleName}, tendrás acceso a:</p>
          <ul>
            ${invitation.role?.name === 'tecnico' ? 
              '<li>Gestionar el libro digital del edificio</li><li>Actualizar información técnica</li><li>Documentar el estado del edificio</li>' :
              invitation.role?.name === 'cfo' ?
                '<li>Acceder a información financiera</li><li>Ver reportes económicos</li><li>Analizar la rentabilidad del edificio</li>' :
                '<li>Ver información del edificio</li><li>Acceder a reportes y estadísticas</li><li>Consultar el estado del edificio</li>'
            }
          </ul>
          
          <div class="expires">
            <strong>⏰ Importante:</strong> Esta invitación expira en 7 días.
          </div>
          
          <div style="text-align: center;">
            <a href="${actionUrl}" class="button">Aceptar Invitación</a>
          </div>
          
          <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">
            ${actionUrl}
          </p>
          
          <div class="footer">
            <p>Este email fue enviado automáticamente por el sistema ActivoDigital.</p>
            <p>Si no esperabas esta invitación, puedes ignorar este email.</p>
            <p>Para más información, contacta a: ${invitedByUser.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ¡Has sido invitado a unirte como ${roleName}!

      Hola,

      ${invitedByUser.fullName || 'Un propietario'} te ha invitado a formar parte del equipo de ${building.name} como ${roleName}.

      INFORMACIÓN DEL EDIFICIO:
      - Nombre: ${building.name}
      - Dirección: ${building.address}
      - Tu rol: ${roleName}

      Como ${roleName}, tendrás acceso a:
      ${invitation.role?.name === 'tecnico' ? 
        '- Gestionar el libro digital del edificio\n- Actualizar información técnica\n- Documentar el estado del edificio' :
        invitation.role?.name === 'cfo' ?
          '- Acceder a información financiera\n- Ver reportes económicos\n- Analizar la rentabilidad del edificio' :
          '- Ver información del edificio\n- Acceder a reportes y estadísticas\n- Consultar el estado del edificio'
      }

      ⏰ IMPORTANTE: Esta invitación expira en 7 días.

      Para ${isAssignmentNotification ? 'aceptar la asignación' : 'aceptar la invitación'}, visita: ${actionUrl}

      Este email fue enviado automáticamente por el sistema ActivoDigital.
      Si no esperabas esta invitación, puedes ignorar este email.
      Para más información, contacta con: ${invitedByUser.email}
    `;

    return { subject, html, text };
  }

  /**
   * Envía un email de notificación cuando se asigna un usuario existente a un nuevo edificio
   */
  async sendAssignmentNotificationEmail(user: any, building: Building, assignedByUser: any): Promise<void> {
    const roleName = user.role?.name === 'tecnico' ? 'Técnico' : 
                     user.role?.name === 'cfo' ? 'CFO' : 'Propietario';
    const frontendUrl = this.getFrontendUrl();
    const acceptUrl = `${frontendUrl}/auth/auto-accept?email=${encodeURIComponent(user.email)}&building=${building.id}`;
    
    const subject = `Nueva asignación como ${roleName} en ${building.name}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nueva Asignación</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
          }
          .title {
            color: #2c3e50;
            margin-bottom: 20px;
          }
          .building-info {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #0056b3;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            font-size: 14px;
            color: #6c757d;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ActivoDigital</div>
          </div>
          
          <h1 class="title">¡Nueva asignación como ${roleName}!</h1>
          
          <p>Hola ${user.fullName},</p>
          
          <p><strong>${assignedByUser.fullName || 'Un propietario'}</strong> te ha asignado como ${roleName} en un nuevo edificio.</p>
          
          <div class="building-info">
            <h3>🏢 Información del Edificio</h3>
            <p><strong>Nombre:</strong> ${building.name}</p>
            <p><strong>Dirección:</strong> ${building.address}</p>
            <p><strong>Tu rol:</strong> ${roleName}</p>
          </div>
          
          <p>Como ${roleName}, tendrás acceso a:</p>
          <ul>
            ${user.role?.name === 'tecnico' ? 
              '<li>Gestionar el libro digital del edificio</li><li>Actualizar información técnica</li><li>Documentar el estado del edificio</li>' :
              '<li>Acceder a información financiera</li><li>Ver reportes económicos</li><li>Analizar la rentabilidad del edificio</li>'
            }
          </ul>
          
          <div style="text-align: center;">
            <a href="${acceptUrl}" class="button">Aceptar Asignación</a>
          </div>
          
          <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">
            ${acceptUrl}
          </p>
          
          <div class="footer">
            <p>Este email fue enviado automáticamente por el sistema ActivoDigital.</p>
            <p>Si no esperabas esta asignación, puedes ignorar este email.</p>
            <p>Para más información, contacta a: ${assignedByUser.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ¡Nueva asignación como ${roleName}!

      Hola ${user.fullName},

      ${assignedByUser.fullName || 'Un propietario'} te ha asignado como ${roleName} en un nuevo edificio.

      INFORMACIÓN DEL EDIFICIO:
      - Nombre: ${building.name}
      - Dirección: ${building.address}
      - Tu rol: ${roleName}

      Como ${roleName}, tendrás acceso a:
      ${user.role?.name === 'tecnico' ? 
        '- Gestionar el libro digital del edificio\n- Actualizar información técnica\n- Documentar el estado del edificio' :
        '- Acceder a información financiera\n- Ver reportes económicos\n- Analizar la rentabilidad del edificio'
      }

      Para aceptar la asignación, visita: ${acceptUrl}

      Este email fue enviado automáticamente por el sistema ActivoDigital.
      Si no esperabas esta asignación, puedes ignorar este email.
      Para más información, contacta a: ${assignedByUser.email}
    `;

    try {
      const { data, error } = await this.getSupabase().functions.invoke('send-invitation-email', {
        body: {
          to: user.email,
          subject,
          html,
          text,
          invitation: {
            id: 'assignment-notification',
            token: 'assignment-notification',
            role: user.role?.name || '',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          building: {
            id: building.id,
            name: building.name,
            address: building.address
          },
          invitedBy: {
            name: assignedByUser.fullName || 'Propietario',
            email: assignedByUser.email
          }
        }
      });

      if (error) {
        console.error('Error enviando email de notificación:', error);
        throw new Error(`Error al enviar email: ${error.message}`);
      }

      console.log('Email de notificación enviado exitosamente:', data);
    } catch (error) {
      console.error('Error en sendAssignmentNotificationEmail:', error);
      throw new Error(`Error al enviar email de notificación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Envía un email de bienvenida después del registro exitoso
   */
  async sendWelcomeEmail(email: string, fullName: string, role: string, buildingName: string): Promise<void> {
    const subject = `¡Bienvenido a ActivoDigital!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
          }
          .success {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ActivoDigital</div>
          </div>
          
          <h1>¡Bienvenido a ActivoDigital!</h1>
          
          <p>Hola ${fullName},</p>
          
          <div class="success">
            <strong>¡Felicidades!</strong> Tu registro ha sido exitoso y ya tienes acceso a ${buildingName} como ${role}.
          </div>
          
          <p>Ya puedes acceder a la plataforma y comenzar a trabajar en el edificio asignado.</p>
          
          <p>¡Gracias por unirte al equipo!</p>
          
          <p>El equipo de ActivoDigital</p>
        </div>
      </body>
      </html>
    `;

    try {
      const { data, error } = await this.getSupabase().functions.invoke('send-welcome-email', {
        body: {
          to: email,
          subject,
          html,
          user: {
            name: fullName,
            role,
            building: buildingName
          }
        }
      });

      if (error) {
        console.error('Error enviando email de bienvenida:', error);
        // No lanzar error para emails de bienvenida, solo loggear
      } else {
        console.log('Email de bienvenida enviado:', data);
      }
    } catch (error) {
      console.error('Error en sendWelcomeEmail:', error);
      // No lanzar error para emails de bienvenida, solo loggear
    }
  }

  /**
   * Escapa caracteres especiales para HTML
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Envía un email de soporte a soporte@empresa.com usando Supabase Edge Functions
   */
  async sendSupportEmail(
    subject: string,
    message: string,
    category: string,
    userEmail?: string,
    context?: string
  ): Promise<{ success: boolean; emailId?: string }> {
    const supportEmail = process.env.SUPPORT_EMAIL || 'martiingadeea1996@gmail.com';
    const timestamp = new Date().toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    // Escapar valores para HTML
    const escapedCategory = this.escapeHtml(category);
    const escapedSubject = this.escapeHtml(subject);
    const escapedMessage = this.escapeHtml(message);
    const escapedUserEmail = userEmail ? this.escapeHtml(userEmail) : '';
    const escapedContext = context ? this.escapeHtml(context) : '';

    // Generar HTML del email
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 20px;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 5px 5px;
          }
          .field {
            margin-bottom: 15px;
          }
          .label {
            font-weight: bold;
            color: #555;
            display: block;
            margin-bottom: 5px;
          }
          .value {
            background-color: white;
            padding: 10px;
            border-radius: 3px;
            border: 1px solid #ddd;
          }
          .message {
            white-space: pre-wrap;
            word-wrap: break-word;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Nuevo Ticket de Soporte</h1>
        </div>
        <div class="content">
          <div class="field">
            <span class="label">Categoría:</span>
            <div class="value">${escapedCategory}</div>
          </div>
          <div class="field">
            <span class="label">Asunto:</span>
            <div class="value">${escapedSubject}</div>
          </div>
          <div class="field">
            <span class="label">Mensaje:</span>
            <div class="value message">${escapedMessage}</div>
          </div>
          ${userEmail ? `
          <div class="field">
            <span class="label">Email del usuario:</span>
            <div class="value">${escapedUserEmail}</div>
          </div>
          ` : ''}
          ${context ? `
          <div class="field">
            <span class="label">URL de origen:</span>
            <div class="value">${escapedContext}</div>
          </div>
          ` : ''}
          <div class="field">
            <span class="label">Fecha:</span>
            <div class="value">${timestamp}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Generar versión texto plano
    const text = `Nuevo Ticket de Soporte

Categoría: ${category}
Asunto: ${subject}
Mensaje: ${message}
${userEmail ? `Email del usuario: ${userEmail}\n` : ''}${context ? `URL de origen: ${context}\n` : ''}Fecha: ${timestamp}`;

    const emailSubject = `[Soporte] ${category} - ${subject}`;

    try {
      const { data, error } = await this.getSupabase().functions.invoke('send-email', {
        body: {
          to: supportEmail,
          subject: emailSubject,
          html,
          text,
          type: 'support',
          metadata: {
            support: {
              category,
              subject,
              userEmail,
              context
            }
          }
        }
      });

      if (error) {
        console.error('Error enviando email de soporte:', error);
        throw new Error(`Error al enviar email de soporte: ${error.message}`);
      }

      return {
        success: true,
        emailId: data?.emailId
      };
    } catch (error) {
      console.error('Error en sendSupportEmail:', error);
      throw new Error(`Error al enviar email de soporte: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
}
