import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail,
  };
}

interface OrderNotificationData {
  orderNo: string;
  customerName: string;
  total: string;
  itemCount: number;
  items: Array<{ title: string; qty: number; unitPrice: string; lineTotal: string }>;
}

export async function sendNewOrderNotification(
  recipientEmails: string[],
  order: OrderNotificationData
): Promise<void> {
  if (recipientEmails.length === 0) return;

  try {
    const { client, fromEmail } = await getResendClient();

    const itemRows = order.items
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.title}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.qty}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${item.unitPrice}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${item.lineTotal}</td>
          </tr>`
      )
      .join('');

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#2C3E50;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;font-size:20px;">New Order Placed</h2>
          <p style="margin:4px 0 0;opacity:0.9;font-size:14px;">Pyramid Books Distribution</p>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 16px;font-size:15px;color:#333;">
            A new order has been placed and requires your attention.
          </p>
          <table style="width:100%;margin-bottom:16px;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;color:#666;font-size:14px;">Order No:</td>
              <td style="padding:4px 0;font-weight:bold;font-size:14px;">${order.orderNo}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#666;font-size:14px;">Customer:</td>
              <td style="padding:4px 0;font-weight:bold;font-size:14px;">${order.customerName}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#666;font-size:14px;">Items:</td>
              <td style="padding:4px 0;font-weight:bold;font-size:14px;">${order.itemCount} book(s)</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#666;font-size:14px;">Total:</td>
              <td style="padding:4px 0;font-weight:bold;font-size:16px;color:#2C3E50;">${order.total}</td>
            </tr>
          </table>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <thead>
              <tr style="background:#f8f9fa;">
                <th style="padding:8px 12px;text-align:left;font-size:13px;color:#666;border-bottom:2px solid #2C3E50;">Book</th>
                <th style="padding:8px 12px;text-align:center;font-size:13px;color:#666;border-bottom:2px solid #2C3E50;">Qty</th>
                <th style="padding:8px 12px;text-align:right;font-size:13px;color:#666;border-bottom:2px solid #2C3E50;">Unit Price</th>
                <th style="padding:8px 12px;text-align:right;font-size:13px;color:#666;border-bottom:2px solid #2C3E50;">Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
          <p style="margin:16px 0 0;font-size:13px;color:#888;">
            Please log in to Pyramid Books to review and manage this order.
          </p>
        </div>
      </div>
    `;

    await client.emails.send({
      from: fromEmail || 'Pyramid Books <onboarding@resend.dev>',
      to: recipientEmails,
      subject: `New Order #${order.orderNo} from ${order.customerName}`,
      html,
    });

    console.log(`[email] Order notification sent to ${recipientEmails.join(', ')} for order ${order.orderNo}`);
  } catch (err: any) {
    console.error(`[email] Failed to send order notification: ${err.message}`);
  }
}
