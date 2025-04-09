import Fastify from "fastify";
import "dotenv/config";
import initializeDB from "./config/db.config.js";

const createServer = async () => {
  const fastify = Fastify({
    logger: true,
  });

  await initializeDB();

  fastify.get("/", async (request, reply) => {
    return reply.code(200).send({
      success: "true",
      message: "Welcome to Uniconnect server",
    });
  });

  return fastify;
};

const startServer = async () => {
  try {
    const app = await createServer();
    app.listen({ port: process.env.PORT }, () => {
      console.log(
        `✅ Uniconnect server is running on port ${process.env.PORT}`
      );
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

startServer();
