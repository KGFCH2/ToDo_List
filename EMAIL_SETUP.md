# TaskFlow Pro - Email Reminder Setup Guide

## Overview
TaskFlow Pro now supports email reminders for tasks. When you set an end date for a task, the system will automatically send you a reminder 15 minutes before the due time.

## Prerequisites

1. **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
2. **npm** (comes with Node.js)
3. **Gmail Account** - For sending emails

## Installation Steps

### 1. Install Dependencies

Navigate to the project directory and install required packages:

```bash
cd d:\Vs Code\Web-Dev\To-Do
npm install
```

This installs:
- `express` - Web server
- `nodemailer` - Email sending
- `cors` - Cross-origin requests
- `body-parser` - Request parsing
- `dotenv` - Environment variables

### 2. Configure Gmail

To use Gmail for sending emails, you need to create an **App Password**:

1. Go to your [Google Account](https://myaccount.google.com/)
2. Click on **Security** in the left sidebar
3. Enable **2-Step Verification** if not already enabled
4. Scroll down and find **App passwords**
5. Select **Mail** and **Windows Computer** (or your OS)
6. Google will generate a 16-character password
7. Copy this password (you'll need it in step 3)

### 3. Create `.env` File

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Then edit `.env` with your actual values:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
APP_URL=http://localhost:3000
PORT=3000
```

**Important:** 
- Use the **App Password** (not your regular Gmail password)
- Keep `.env` secure - never commit it to version control
- The file is already added to `.gitignore`

### 4. Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## How to Use Email Reminders

### Automatic Reminders

1. **Create a Task** with an end date/time
2. **System automatically schedules** a reminder
3. **15 minutes before the due time**, an email is sent to your registered email address
4. The email contains:
   - Task description
   - Due date and time
   - A link to your TaskFlow Pro account

### Manual Reminder (If Needed)

In the future, we'll add a "Send Reminder Now" button for manual reminder sending.

### Example Task Setup

1. Go to **Tasks** page
2. Enter task: "Finish project report"
3. Set **End Date**: Today at 5:00 PM
4. Click **Add Task**
5. At 4:45 PM, you'll receive an email reminder

## Email Templates

The system sends professionally formatted HTML emails with:
- TaskFlow Pro branding
- Task details and due date
- Direct link to your tasks
- Professional styling

## Troubleshooting

### Issue: "Failed to send reminder email"

**Solution:** Check your `.env` file:
- Verify `EMAIL_USER` is correct
- Verify `EMAIL_PASSWORD` is the 16-character **App Password**, not your regular password
- Ensure 2-Step Verification is enabled on your Google Account
- Check that the server is running

### Issue: Reminders not being sent

**Solution:** 
- Ensure the server is running on the correct port
- Check browser console for errors
- Verify tasks have end dates set
- Wait for reminder time (15 minutes before due time)

### Issue: Can't connect to server

**Solution:**
- Make sure Node.js is installed: `node --version`
- Make sure you're in the correct directory
- Kill any process using port 3000: `lsof -ti:3000 | xargs kill -9` (Mac/Linux) or `netstat -ano | findstr :3000` (Windows)
- Restart the server

## Accessing the Application

### Frontend (Local Development)
- Open `todo.html` in your browser
- Or use a local server: `python -m http.server 8000`

### Backend API
- Health check: `http://localhost:3000/api/health`

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_USER` | Gmail address | your-email@gmail.com |
| `EMAIL_PASSWORD` | 16-char app password | abcd efgh ijkl mnop |
| `APP_URL` | Application URL for email links | http://localhost:3000 |
| `PORT` | Server port | 3000 |

## API Endpoints

### Schedule Reminder
```
POST /api/schedule-reminder
Content-Type: application/json

{
  "email": "user@example.com",
  "taskText": "Complete project",
  "dueDate": "2025-12-28T17:00:00",
  "userName": "John Doe"
}
```

### Send Reminder Immediately
```
POST /api/send-reminder
Content-Type: application/json

{
  "email": "user@example.com",
  "taskText": "Complete project",
  "dueDate": "2025-12-28T17:00:00",
  "userName": "John Doe"
}
```

### Health Check
```
GET /api/health
```

## Security Notes

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Use App Passwords**, not regular Gmail passwords
3. **Enable 2-Step Verification** on your Gmail account
4. **Keep your `.env` credentials private**
5. **Don't share your Gmail credentials** with others

## Future Enhancements

Planned features:
- [ ] Multiple reminder times (1 hour, 30 min, 15 min before)
- [ ] Customizable email templates
- [ ] Digest emails (daily/weekly summary)
- [ ] SMS reminders
- [ ] In-app notification center
- [ ] Database integration for reminder history

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Verify all environment variables are correct
3. Check server logs for error messages
4. Ensure Node.js and npm are properly installed

## License

TaskFlow Pro - Personal Task Management Application

---

**Version:** 1.0.0  
**Last Updated:** November 2025
