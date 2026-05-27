import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface SendInvitationEmailParams {
  to: string;
  workspaceName: string;
  senderName: string;
  acceptLink: string;
  isRegistered: boolean;
}

export async function sendInvitationEmail({
  to,
  workspaceName,
  senderName,
  acceptLink,
  isRegistered,
}: SendInvitationEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || 'DevCollab <onboarding@resend.dev>';

  if (!apiKey) {
    console.warn('[Email Warning] RESEND_API_KEY is not defined. Email invitation will not be sent, but acceptance link is logged: ', acceptLink);
    return;
  }

  const subject = isRegistered
    ? `You have been added to ${workspaceName} on DevCollab`
    : `Invitation to join ${workspaceName} on DevCollab`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #070a10;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #c9d1d9;
        }
        .container {
          max-width: 580px;
          margin: 40px auto;
          padding: 32px;
          background-color: #0d1117;
          border: 1px solid #21262d;
          border-radius: 12px;
        }
        .logo {
          font-size: 20px;
          font-weight: 700;
          color: #58a6ff;
          margin-bottom: 24px;
          letter-spacing: -0.5px;
        }
        .title {
          font-size: 22px;
          font-weight: 600;
          color: #ffffff;
          margin-top: 0;
          margin-bottom: 16px;
        }
        .text {
          font-size: 15px;
          line-height: 24px;
          color: #8b949e;
          margin-bottom: 24px;
        }
        .workspace-card {
          background-color: #161b22;
          border: 1px solid #30363d;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 28px;
          text-align: center;
        }
        .workspace-name {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 6px;
        }
        .workspace-role {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          color: #58a6ff;
          letter-spacing: 1px;
        }
        .btn {
          display: inline-block;
          background-color: #238636;
          color: #ffffff !important;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          padding: 12px 24px;
          border-radius: 6px;
          transition: background-color 0.2s;
        }
        .footer {
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid #21262d;
          font-size: 12px;
          color: #484f58;
          text-align: center;
        }
        .link-text {
          color: #58a6ff;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">DevCollab</div>
        <h1 class="title">${isRegistered ? 'Welcome to the Workspace!' : 'You have been invited!'}</h1>
        <p class="text">
          Hi, <strong>${senderName}</strong> has invited you to join the workspace <strong>${workspaceName}</strong> on DevCollab, a collaborative environment for developer teams.
        </p>
        
        <div class="workspace-card">
          <div class="workspace-name">${workspaceName}</div>
          <div class="workspace-role">${isRegistered ? 'Member' : 'Pending Invite'}</div>
        </div>

        <p class="text" style="text-align: center;">
          <a href="${acceptLink}" class="btn" target="_blank">
            ${isRegistered ? 'Go to Workspace' : 'Accept Invitation'}
          </a>
        </p>

        <p class="text" style="font-size: 13px; margin-top: 24px;">
          If the button above does not work, copy and paste this URL into your browser:<br>
          <a href="${acceptLink}" class="link-text">${acceptLink}</a>
        </p>

        <div class="footer">
          This email was sent by DevCollab. If you were not expecting this invitation, you can safely ignore this email.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    });

    const data: any = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || 'Resend request failed');
    }
    console.log(`[Email Success] Email sent successfully to ${to}. Resend ID: ${data?.id}`);
  } catch (err: any) {
    console.error(`[Email Error] Failed to send invitation email to ${to}:`, err.message || err);
  }
}
