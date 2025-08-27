import { fastify } from "fastify";
import { fastifyCors } from "@fastify/cors";
import {
  validatorCompiler,
  serializerCompiler,
  jsonSchemaTransform,
} from "fastify-type-provider-zod";
import { fastifySwagger } from "@fastify/swagger";
import { fastifySwaggerUi } from "@fastify/swagger-ui";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { users } from "./routes/routes";
import { videos } from "./routes/video";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifyCors, { origin: "*" });
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Synapse API",
      version: "1.0.0",
    },
  },
  transform: jsonSchemaTransform,
});
app.register(fastifySwaggerUi, {
  routePrefix: "/docs",
});

app.get("/health", async () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
  service: "synapse-video-platform",
}));

app.register(users, { prefix: "/users" });
app.register(videos, { prefix: "/videos" });

app.listen({ port: 3333 }).then(() => {
  console.log("Synapse is running");
});
