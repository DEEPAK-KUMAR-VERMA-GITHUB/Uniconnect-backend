export const unblockedEmailTemplate = (user) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Account Reactivated</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f1f4f8;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; margin:20px 0; border-radius:8px; overflow:hidden;">
          <!-- Header with Logo -->
          <tr>
            <td style="text-align:center; padding:20px; background:#28a745;">
              <img src="https://res.cloudinary.com/uniconnect/image/upload/f_auto,q_auto/v1/uniconnect/images/b38bfbf1c2aca1a1ec725f67249ac0f2" alt="University Logo" width="120" style="display:block; margin:0 auto;">
            </td>
          </tr>
          <!-- Greeting -->
          <tr>
            <td style="padding:30px 40px; font-family:Arial, sans-serif; color:#333333;">
              <h1 style="margin:0 0 10px; font-size:24px;">Welcome Back, ${user.fullName}!</h1>
              <p style="margin:0 0 20px; font-size:16px; line-height:1.5;">
                We are pleased to inform you that your account associated with the email address <strong>${user.email}</strong> has been successfully reactivated by our administration team.
              </p>
              <p style="margin:0 0 20px; font-size:16px; line-height:1.5;">
                You can now access all the features and resources available to your role within our university application.
              </p>
              <!-- Call to Action -->
              <p style="text-align:center; margin:30px 0;">
                <a href="#" style="background:#28a745; color:#ffffff; padding:12px 24px; text-decoration:none; border-radius:4px; display:inline-block; font-size:16px;">
                  Access Your Account
                </a>
              </p>
              <p style="margin:0; font-size:14px; color:#6C757D;">
                If you have any questions or need assistance, feel free to contact our support team.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f1f4f8; padding:20px 40px; text-align:center; font-family:Arial, sans-serif; font-size:12px; color:#6C757D;">
              <p style="margin:0 0 10px;">Connect with us:</p>
              <a href="https://gnsu.ac.in/" style="margin:0 5px;"><img src="https://res.cloudinary.com/uniconnect/image/upload/f_auto,q_auto/v1/uniconnect/images/eef835e665ab4c33e663fc97654bf9b8" alt="Website" width="24"></a>
              <a href="https://www.facebook.com/GNSUniversity/" style="margin:0 5px;"><img src="https://res.cloudinary.com/uniconnect/image/upload/f_auto,q_auto/v1/uniconnect/images/61a96c78b48018b48fbb6254a93b93f8" alt="Facebook" width="24"></a>
              <a href="https://www.x.com/GnsUniversity_" style="margin:0 5px;"><img src="https://res.cloudinary.com/uniconnect/image/upload/f_auto,q_auto/v1/uniconnect/images/3e8e7ee8666a9f4e2946f39ff2f806e3" alt="Twitter" width="24"></a>
              <a href="https://www.linkedin.com/in/gnsu/" style="margin:0 5px;"><img src="https://res.cloudinary.com/uniconnect/image/upload/f_auto,q_auto/v1/uniconnect/images/d492efc706db983e74258dbd348f2208" alt="LinkedIn" width="24"></a>
              <p style="margin:15px 0 0;">&copy; ${new Date().getFullYear()} Uniconnect. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};
