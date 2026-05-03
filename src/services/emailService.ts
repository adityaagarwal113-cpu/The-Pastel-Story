export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    // We don't throw here to avoid breaking the checkout flow if email fails
    return { success: false, error };
  }
}

export const getOrderConfirmationHtml = (orderId: string, name: string, total: number) => `
  <div style="font-family: serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e5e7eb;">
    <h1 style="font-style: italic; color: #b45309; text-align: center;">The Pastel Story</h1>
    <div style="margin-top: 40px;">
      <p>Dear ${name},</p>
      <p>Thank you for choosing Pastel Story. Your order has been placed successfully!</p>
      <div style="background-color: #fefcfb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em;">Order ID</p>
        <p style="margin: 5px 0; font-weight: bold; font-size: 1.2rem; color: #b45309;">${orderId}</p>
        <p style="margin: 20px 0 0 0; font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em;">Total Amount</p>
        <p style="margin: 5px 0; font-weight: bold;">₹${total.toLocaleString('en-IN')}</p>
      </div>
      <p>Our curators are now reviewing your payment proof. Once verified, we will begin preparing your shipment.</p>
      <p style="margin-top: 40px; font-size: 0.9rem; color: #6b7280;">Warmly,<br>Pastel Story Team</p>
    </div>
  </div>
`;

export const getShippingConfirmationHtml = (orderId: string, name: string, trackingId: string, trackingLink: string) => `
  <div style="font-family: serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e5e7eb;">
    <h1 style="font-style: italic; color: #b45309; text-align: center;">The Pastel Story</h1>
    <div style="margin-top: 40px;">
      <p>Dear ${name},</p>
      <p>Your curated parcel is on its way!</p>
      <div style="background-color: #fefcfb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em;">Order ID</p>
        <p style="margin: 5px 0; font-weight: bold;">${orderId}</p>
        <p style="margin: 20px 0 0 0; font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em;">Tracking ID</p>
        <p style="margin: 5px 0; font-weight: bold; font-size: 1.2rem; color: #b45309;">${trackingId}</p>
        <div style="margin-top: 20px;">
          <a href="${trackingLink}" style="display: inline-block; background-color: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">Track My Parcel</a>
        </div>
      </div>
      <p>We can't wait for you to receive your pieces.</p>
      <p style="margin-top: 40px; font-size: 0.9rem; color: #6b7280;">Warmly,<br>Pastel Story Team</p>
    </div>
  </div>
`;
