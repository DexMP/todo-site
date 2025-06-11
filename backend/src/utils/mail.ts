import nodemailer from 'nodemailer';

// Configure a mock transporter for logging emails to the console
// In a real application, you'd use SMTP or a service like SendGrid, Mailgun, etc.
const transporter = nodemailer.createTransport({
  streamTransport: true, // Use a stream to capture the email
  newline: 'unix',
  buffer: true,
});

transporter.on('stream', (stream) => {
  let message = '';
  stream.on('data', (chunk) => {
    message += chunk.toString();
  });
  stream.on('end', () => {
    console.log('--- Mock Email Sent ---');
    // Output the relevant parts of the email.
    // The full message can be quite verbose.
    const simplifiedLog = message.match(/^To: .*?\nSubject: .*?\n\n([\s\S]*)/m);
    if (simplifiedLog) {
        console.log(simplifiedLog[0].split('\n\n', 2)[0]); // Headers
        console.log("\nBody (first few lines):");
        console.log(simplifiedLog[1].substring(0, 200) + (simplifiedLog[1].length > 200 ? '...' : ''));
    } else {
        console.log(message.substring(0, 500) + (message.length > 500 ? '...' : '')); // Fallback for unexpected format
    }
    console.log('--- End Mock Email ---');
  });
});

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const sendEmail = async (options: MailOptions) => {
  const mailOptionsWithFrom = {
    from: process.env.EMAIL_FROM || 'noreply@example.com', // Default sender
    ...options,
  };
  try {
    await transporter.sendMail(mailOptionsWithFrom);
    console.log(`Mock email supposedly sent to ${options.to} with subject "${options.subject}"`);
  } catch (error) {
    console.error('Error sending mock email:', error);
  }
};

// Example usage:
// sendEmail({
//   to: 'test@example.com',
//   subject: 'Test Email',
//   text: 'This is a test email.',
//   html: '<p>This is a test email.</p>'
// });
