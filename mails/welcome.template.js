export const welcomeEmailTemplate = (user) => {
  return `   
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Welcome to UniConnect</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f1f4f8;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; margin:20px 0; border-radius:8px; overflow:hidden;">
          <!-- Header with Logo -->
          <tr>
            <td style="text-align:center; padding:20px; background:#00489c;">
              <img src="https://res.cloudinary.com/uniconnect/image/upload/v1748062370/uniconnect_logo_x7grei.png" alt="University App Logo" width="120" style="display:block; margin:0 auto;">
            </td>
          </tr>
          <!-- Greeting -->
          <tr>
            <td style="padding:30px 40px; font-family:Arial, sans-serif; color:#333333;">
              <h1 style="margin:0 0 10px; font-size:24px;">Welcome, ${
                user.fullName
              }!</h1>
              <p style="margin:0 0 20px; font-size:16px; line-height:1.5;">
                Thank you for joining our university community as a ${
                  user.role
                }. We are thrilled to have you on board!
              </p>
              <!-- Call to Action -->
             
                <p style="text-align:center; margin:30px 0; background:#00489c; color:#ffffff; padding:12px 24px; text-decoration:none; border-radius:4px; display:inline-block; font-size:16px;">
                  Connect with Admin for Account Activation
                </p>
             
              <p style="margin:0; font-size:14px; color:#6C757D;">
                If you did not register, please ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f1f4f8; padding:20px 40px; text-align:center; font-family:Arial, sans-serif; font-size:12px; color:#6C757D;">
              <p style="margin:0 0 10px;">Connect with us:</p>
              <a href="https://gnsu.ac.in/" style="margin:0 5px;"><img src="https://res.cloudinary.com/uniconnect/image/upload/v1748062280/world-wide-web_ye5gci.png" alt="Website" width="24"></a>
              <a href="https://www.facebook.com/GNSUniversity/" style="margin:0 5px;"><img src="https://res.cloudinary.com/uniconnect/image/upload/v1748062280/facebook_zasvpu.png" alt="Facebook" width="24"></a>
              <a href="https://www.x.com/GnsUniversity_" style="margin:0 5px;"><img src="https://res.cloudinary.com/uniconnect/image/upload/v1748062280/twitter_nwyrmg.png" alt="Twitter" width="24"></a>
              <a href="https://www.linkedin.com/in/gnsu/" style="margin:0 5px;"><img src="https://res.cloudinary.com/uniconnect/image/upload/v1748062280/linkedin_xemuzt.png" alt="LinkedIn" width="24"></a>
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
