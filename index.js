const axios = require('axios');
const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
app.use(express.json());
require('dotenv').config()
const MAX_RETRIES = 3
const smtpTransport = nodemailer.createTransport({
    host: 'localhost', // Your SMTP server's hostname or IP
    port: 587, // Your SMTP port (25, 465, 587, etc.)
    secure: false, // Use TLS
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendEmailBackup = async(emailData) =>{
    try {

        const url = 'https://api.emailjs.com/api/v1.0/email/send';
        const payload = {
            service_id: process.env.EMAILJS_SERVICE_ID,    // Replace with your EmailJS service ID
            template_id: process.env.EMAILJS_TEMPLATE_ID,  // Replace with your EmailJS template ID
            user_id: process.env.EMAIJS_PUBLIC_KEY,          // Replace with your EmailJS user ID
            template_params: emailData
          };

        const response = await axios.post(url, payload, {
            headers: {
              'Content-Type': 'application/json',
              'origin': 'http://localhost'
            }
          });
          if(response.data !== 'OK'){
            throw Error('Failed to send ')
          }
        console.log('Email sent using backup service')
        return
    } catch (error) {
        console.log("🚀 ~ sendEmailBackup ~ error:", error)
        throw error
    }
}

const sendPrimaryEmail = async(emailData) => {
    try {

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: emailData.to,
            subject: emailData.subject,
            text: emailData.text
        };
        
        const info = await smtpTransport.sendMail(mailOptions);
        console.log('Email sent using primary SMTP service:', info);
        
        return info.response;

    } catch (error) {

        console.log('sendPrimaryEmail error',error.message)
        throw error;

    }
}

const sendEmailWithRetry = async(emailData) => {
    let attempt = 0;
    let success = false;

    while (attempt < MAX_RETRIES) {
        try {
            await sendPrimaryEmail(emailData);
            success = true;
            break;
        } catch (error) {
            attempt++;
            console.log(`Retrying... Attempt ${attempt}/${MAX_RETRIES}`);
        }
    }

    if (!success) {
        console.log('Switching to backup email service...');
        await sendEmailBackup(emailData);
    }
}

app.get('/', function (req, res) {
    res.send('Hello World')
})

app.post('/send-email', async (req, res) => {
    try {
        const emailData = req.body;
        await sendEmailWithRetry(emailData);
        res.status(200).json({ message: 'Email sent successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send email', error: error.message });
    }
});

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
