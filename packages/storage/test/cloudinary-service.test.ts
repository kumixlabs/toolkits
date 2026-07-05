import { describe, expect, it } from "vitest";

import { CloudinaryService } from "../src/services/cloudinary";
import type { CloudinaryConfig } from "../src/types";

describe("CloudinaryService", () => {
  const config: CloudinaryConfig = {
    provider: "cloudinary",
    cloudName: "cloud",
    apiKey: "key",
    apiSecret: "secret",
    secure: true,
    folder: "uploads",
  };

  it("uploadFile and getPublicUrl", async () => {
    const cloud = new CloudinaryService(config);
    const res = await cloud.uploadFile("folder/photo.jpg", Buffer.from("x"), "image/jpeg");
    expect(res.success).toBe(true);
    const url = cloud.getPublicUrl("folder/photo.jpg");
    expect(url).toBe("https://res.cloudinary.com/cloud/image/upload/folder/photo.jpg");
  });

  it("getProvider and getConfig", () => {
    const cloud = new CloudinaryService(config);
    expect(cloud.getProvider()).toBe("cloudinary");
    expect(cloud.getConfig().cloudName).toBe("cloud");
  });
});
