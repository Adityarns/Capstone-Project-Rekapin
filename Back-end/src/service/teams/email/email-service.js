import nodemailer from "nodemailer";

// 1. Konfigurasi Kurir (Transporter)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

class EmailService {
  // 2. Fungsi Eksekusi Pengiriman Undangan
  async sendTeamInvitation(targetEmail, inviteCode, role, businessName) {
    try {
      const mailOptions = {
        from: `"Rekapin System" <${process.env.EMAIL_USER}>`,
        to: targetEmail,
        subject: `Undangan Bergabung ke Tim ${businessName} di Rekapin`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4CAF50;">Anda Diundang!</h2>
            <p>Halo,</p>
            <p>Anda telah diundang untuk bergabung ke dalam bisnis <strong>${businessName}</strong> sebagai <strong>${role.toUpperCase()}</strong> di sistem Rekapin.</p>
            <p>Berikut adalah kode undangan Anda:</p>
            <div style="background-color: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center; margin: 20px 0;">
              ${inviteCode}
            </div>
            <p>Silakan masukkan kode tersebut di aplikasi Rekapin untuk bergabung dengan tim.</p>
            <p>Jika Anda tidak merasa menerima undangan ini, abaikan saja email ini.</p>
            <br>
            <p>Salam hangat,<br>Tim Rekapin</p>
          </div>
        `,
      };

      // 3. Tembakkan email
      const info = await transporter.sendMail(mailOptions);
      console.log(
        `[Email Service] Undangan terkirim ke ${targetEmail} (ID: ${info.messageId})`,
      );

      return true;
    } catch (error) {
      console.error("[Email Service] Gagal mengirim email:", error.message);
      throw new Error(
        "Gagal mengirim email undangan. Pastikan konfigurasi SMTP benar.",
      );
    }
  }
}

export default new EmailService();
