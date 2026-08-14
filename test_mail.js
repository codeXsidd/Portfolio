const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'siddharth291206@gmail.com',
        pass: 'trubssodakjctqkp'
    }
});

async function run() {
    try {
        console.log("Testing port 587...");
        await transporter.verify();
        console.log("✓ Port 587 works!");
    } catch(e) {
        console.error("✗ Port 587 error:", e.message);
    }
}
run();
