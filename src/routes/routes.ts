import z from "zod";
import { FastifyTypedInstance } from "../types";
import { randomUUID } from "node:crypto";

type User = {
  id: string;
  name: string;
  email: string;
};

const usersList: User[] = [];

export async function users(app: FastifyTypedInstance) {
  app.get(
    "/",
    {
      schema: {
        description: "List users",
        tags: ["users"],
        response: {
          200: z.array(
            z.object({ id: z.string(), name: z.string(), email: z.string() })
          ),
        },
      },
    },
    () => {
      return usersList;
    }
  );

  app.post(
    "/",
    {
      schema: {
        description: "Create new user",
        tags: ["users"],
        body: z.object({ name: z.string(), email: z.email() }),
        response: { 201: z.null() },
      },
    },
    async (request, reply) => {
      const { name, email } = request.body;

      usersList.push({
        id: randomUUID(),
        name,
        email,
      });

      return reply.status(201).send();
    }
  );
}
