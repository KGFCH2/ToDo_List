const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Serve todo.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'todo.html'));
});

// Configure Nodemailer with Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Verify transporter connection
transporter.verify((error, success) => {
    if (error) {
        console.log('Email transporter error:', error);
    } else {
        console.log('Email transporter ready:', success);
    }
});

// Unified Email Template
const getHtmlEmailTemplate = (userName, taskText, dueDate, isReminder = false) => {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    // Direct link to login/entry page with return instruction to avoid double redirects
    const actionLink = `${appUrl}/todo.html?returnTo=${encodeURIComponent('#/app/tasks')}#/login`;

    return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px; border-radius: 16px;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%); padding: 32px; border-radius: 16px; color: white; text-align: center; margin-bottom: 24px; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);">
            <div style="font-size: 32px; margin-bottom: 8px;">⚡</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">TaskFlow Pro</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">${isReminder ? 'Task Reminder' : 'Upcoming Task'}</p>
        </div>
        
        <div style="background: white; padding: 32px; border-radius: 16px; border: 1px solid rgba(148, 163, 184, 0.1); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.6;">Hi <strong>${userName || 'there'}</strong>,</p>
            
            <p style="margin: 0 0 24px 0; color: #64748b; line-height: 1.6;">
                ${isReminder ? 'This is a friendly reminder about a task that is due soon:' : 'You have scheduled a new task:'}
            </p>
            
            <div style="background: #f1f5f9; border-left: 4px solid #6366f1; padding: 20px; margin: 0 0 24px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 18px; line-height: 1.4;">${taskText}</p>
                ${dueDate ? `<div style="margin-top: 12px; display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 14px;">
                    <span>📅 Due: ${new Date(dueDate).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                </div>` : ''}
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            
        </div>
    </div>
    `;
};

// Send task reminder email
app.post('/api/send-reminder', async (req, res) => {
    const { email, taskText, dueDate, userName } = req.body;

    if (!email || !taskText) {
        return res.status(400).json({ error: 'Email and task text are required' });
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Task Reminder: ${taskText}`,
        html: getHtmlEmailTemplate(userName, taskText, dueDate, true),
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent:', result.messageId);
        res.json({ success: true, message: 'Reminder email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send reminder email', details: error.message });
    }
});

// Schedule reminders (check every minute)
app.post('/api/schedule-reminder', (req, res) => {
    const { email, taskText, dueDate, userName } = req.body;

    if (!email || !dueDate) {
        return res.status(400).json({ error: 'Email and due date are required' });
    }

    const reminderTime = new Date(dueDate).getTime() - (15 * 60 * 1000); // 15 minutes before due date
    const now = new Date().getTime();

    if (reminderTime > now) {
        setTimeout(() => {
            sendReminderEmail(email, taskText, dueDate, userName);
        }, reminderTime - now);

        res.json({ success: true, message: 'Reminder scheduled successfully', scheduledFor: new Date(reminderTime) });
    } else {
        // Send immediately if due within 15 minutes
        sendReminderEmail(email, taskText, dueDate, userName);
        res.json({ success: true, message: 'Reminder sent immediately (due soon)' });
    }
});

// Helper function to send reminder email
async function sendReminderEmail(email, taskText, dueDate, userName) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Task Reminder: ${taskText}`,
        html: getHtmlEmailTemplate(userName, taskText, dueDate, true),
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Scheduled reminder email sent to:', email);
    } catch (error) {
        console.error('Error sending scheduled reminder:', error);
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
    console.log(`TaskFlow Pro server running on http://localhost:${PORT}`);
});
