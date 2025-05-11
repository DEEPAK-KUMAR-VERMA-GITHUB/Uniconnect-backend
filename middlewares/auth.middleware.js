import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import config from "../config/index.js";
import { StatusCode } from "./../utils/constants.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const generateTokensAndSetCookies = async (user, reply) => {
  // Generate tokens
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn }
  );

  const refreshToken = jwt.sign(
    { id: user._id, version: user.tokenVersion },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  // Set cookies
  reply.setCookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: config.cookie.accessCookieMaxAge, // 15 minutes
    path: "/",
  });

  reply.setCookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: config.cookie.refreshCookieMaxAge, // 7 days
    path: "/",
  });

  return { accessToken, refreshToken };
};

export const auth = async (request, reply) => {
  try {
    // get token from cookies
    const { accessToken } = request.cookies;

    if (!accessToken) {
      return reply.code(StatusCode.UNAUTHORIZED).send({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    try {
      const decoded = jwt.verify(accessToken, config.jwt.accessSecret);

      const user = await User.findById(decoded.id);

      if (!user || user.isBlocked) {
        return reply.code(StatusCode.UNAUTHORIZED).send({
          success: false,
          message: "Access denied. User not found or blocked.",
        });
      }

      request.user = user;
      return;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return await refreshTokenAndContinue(request, reply);
      }
      // For other JWT errors, return unauthorized
      return reply.code(StatusCode.UNAUTHORIZED).send({
        success: false,
        message: "Invalid token.",
        error: error.message,
      });
    }
  } catch (error) {
    return reply.code(StatusCode.INTERNAL_SERVER).send({
      success: false,
      message: "Authentication error",
      error: error.message,
    });
  }
};

/**
 * Helper function to refresh token and continue the request
 */
export const refreshTokenAndContinue = async (request, reply) => {
  try {
    const { refreshToken } = request.cookies;

    if (!refreshToken) {
      return reply.code(401).send({
        success: false,
        message: "No refresh token provided",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const user = await User.findById(decoded.id);

    // Validate user and token version
    if (!user || user.tokenVersion !== decoded.version || user.isBlocked) {
      throw new Error("Invalid refresh token");
    }

    // Generate new tokens and set cookies
    await generateTokensAndSetCookies(user, reply);

    request.user = user;
    return;
  } catch (error) {
    // Clear cookies on error
    reply.clearCookie("accessToken");
    reply.clearCookie("refreshToken");

    return reply.code(401).send({
      success: false,
      message: "Invalid refresh token",
      error: error.message,
    });
  }
};

/**
 * Refresh token handler - for explicit refresh token endpoint
 */
export const handleRefreshToken = async (request, reply) => {
  try {
    const { refreshToken } = request.cookies;

    if (!refreshToken) {
      return reply.code(401).send({
        success: false,
        message: "No refresh token provided",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const user = await User.findById(decoded.id);

    // Validate user and token version
    if (!user || user.tokenVersion !== decoded.version || user.isBlocked) {
      throw new Error("Invalid refresh token");
    }

    // Generate new tokens and set cookies
    const tokens = await generateTokensAndSetCookies(user, reply);

    return reply.code(200).send({
      success: true,
      message: "Tokens refreshed successfully",
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    // Clear cookies on error
    reply.clearCookie("accessToken");
    reply.clearCookie("refreshToken");

    return reply.code(401).send({
      success: false,
      message: "Invalid refresh token",
      error: error.message,
    });
  }
};

/**
 * Logout handler
 */
export const handleLogout = async (request, reply) => {
  try {
    // Increment token version to invalidate all refresh tokens
    if (request.user) {
      await User.findByIdAndUpdate(request.user._id, {
        $inc: { tokenVersion: 1 },
        $set: { deviceToken: null },
      });
    }

    // Clear cookies
    reply.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    reply.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    return ApiResponse.succeed(null, "Logout Successfully");
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Error during logout",
      error: error.message,
    });
  }
};
