import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const uploadRouter = {
  bookingPhotos: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 24,
    },
  }).onUploadComplete(async ({ file }) => {
    return { url: file.url };
  }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
