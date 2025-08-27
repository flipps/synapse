import z from "zod";

import { FastifyTypedInstance } from "../types";
import { randomUUID } from "node:crypto";

const VideoSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  filename: z.string(),
  url: z.url(),
  thumbnail: z.url().optional(),
  duration: z.number().positive().optional(),
  fileSize: z.number().positive(),
  mimeType: z.string(),
  uploadedAt: z.date(),
  userId: z.uuid(),
});

const CreateVideoSchema = z.object({
  title: z.string().min(1).max(100),
  userId: z.uuid(),
});

const UpdateVideoSchema = z.object({
  title: z.string().min(1).max(100).optional(),
});

type Video = z.infer<typeof VideoSchema>;

const videosList: Video[] = [];

export async function videos(app: FastifyTypedInstance) {
  app.get(
    "/",
    {
      schema: {
        description: "List all videos",
        tags: ["videos"],
        querystring: z.object({
          limit: z.coerce.number().min(1).max(100).default(10),
          offset: z.coerce.number().min(0).default(0),
          userId: z.uuid().optional(),
        }),
        response: {
          200: z.object({
            videos: z.array(VideoSchema),
            total: z.number(),
            limit: z.number(),
            offset: z.number(),
          }),
        },
      },
    },
    async (request) => {
      const { limit, offset, userId } = request.query;

      let filteredVideos = videosList;

      if (userId) {
        filteredVideos = videosList.filter((video) => video.userId === userId);
      }

      const paginatedVideos = filteredVideos.slice(offset, offset + limit);

      return {
        videos: paginatedVideos,
        total: filteredVideos.length,
        limit,
        offset,
      };
    }
  );

  app.get(
    "/:id",
    {
      schema: {
        description: "Get video by ID",
        tags: ["videos"],
        params: z.object({
          id: z.uuid(),
        }),
        response: {
          200: VideoSchema,
          404: z.object({
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const video = videosList.find((v) => v.id === id);

      if (!video) {
        return reply.status(404).send({
          error: "Not Found",
          message: `Video with id ${id} was not found`,
        });
      }

      return video;
    }
  );

  app.post(
    "/upload",
    {
      schema: {
        description: "Upload a new video",
        tags: ["videos"],
        body: CreateVideoSchema,
        response: {
          201: z.object({
            id: z.uuid(),
            message: z.string(),
            uploadUrl: z.string().optional(),
          }),
          400: z.object({
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { title, userId } = request.body;

      // TODO: This is mocked dude...
      const newVideo: Video = {
        id: randomUUID(),
        title,
        filename: `${title.toLowerCase().replace(/\s+/g, "-")}.mp4`,
        url: `https://example.com/videos/${randomUUID()}.mp4`,
        thumbnail: `https://example.com/thumbnails/${randomUUID()}.jpg`,
        duration: Math.floor(Math.random() * 3600),
        fileSize: Math.floor(Math.random() * 100000000),
        mimeType: "video/mp4",
        uploadedAt: new Date(),
        userId,
      };

      videosList.push(newVideo);

      return reply.status(201).send({
        id: newVideo.id,
        message: "Video upload initiated successfully",
        uploadUrl: `https://upload.example.com/${newVideo.id}`,
      });
    }
  );

  app.patch(
    "/:id",
    {
      schema: {
        description: "Update video metadata",
        tags: ["videos"],
        params: z.object({
          id: z.uuid(),
        }),
        body: UpdateVideoSchema,
        response: {
          200: VideoSchema,
          404: z.object({
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const updates = request.body;

      const videoIndex = videosList.findIndex((video) => video.id === id);

      if (videoIndex === -1) {
        return reply.status(404).send({
          error: "Not Found",
          message: `Video with id ${id} was not found`,
        });
      }

      videosList[videoIndex] = {
        ...videosList[videoIndex],
        ...updates,
      };

      return videosList[videoIndex];
    }
  );
}
