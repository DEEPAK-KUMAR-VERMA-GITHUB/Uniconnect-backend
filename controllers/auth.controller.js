import { generateTokensAndSetCookies } from "../middlewares/auth.middleware.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

class AuthController {
  async login(request, reply) {
    try {
      const { email, password } = request.body;

      const user = await User.findOne({ email });

      if (!user) {
        return reply.code(404).send({
          success: false,
          message: "User not found",
        });
      }

      const isPasswordMatch = await user.comparePassword(password);

      if (!isPasswordMatch) {
        return reply.code(401).send({
          success: false,
          message: "Invalid credentials",
        });
      }

      // check if user is blocked
      if (user.isBlocked) {
        return reply.code(403).send({
          success: false,
          message: "Your account has been blocked",
        });
      }

      // check if user is varified
      if (!user.isVerified) {
        return reply.code(403).send({
          success: false,
          message: "Your account has not been verified",
        });
      }

      await generateTokensAndSetCookies(user, reply);

      reply.code(200).send({
        success: true,
        message: "User logged in successfully",
        data: {
          user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        message: "Error during login",
        error: error.message,
      });
    }
  }
}

export default new AuthController();
