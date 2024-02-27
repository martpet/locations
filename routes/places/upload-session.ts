import { Handlers } from "$fresh/server.ts";
import { ulid } from "ulid";
import { setUploadSession } from "../../utils/db.ts";
import { getEnv, uploadPhotoBucket } from "../../utils/env.ts";
import { State } from "../../utils/types.ts";

export interface PostUploadSessionReqData {
  filesCount: number;
}

export interface PostUploadSessionRespData {
  uploadUrls: string[];
  s3Keys: string[];
  uploadSessionId: string;
}

export const handler: Handlers<undefined, State> = {
  async POST(req, ctx) {
    const { getSignatureKey, getSignedUrl } = await import("aws_s3_presign");
    // Check user
    const user = ctx.state.user;
    if (!user) {
      return new Response(null, { status: 401 });
    }
    // Check request
    const reqData = await req.json();
    if (!isPostUploadSessionReqData(reqData)) {
      return new Response(null, { status: 400 });
    }
    // Create upload urls
    const uploadUrls = [];
    const s3Keys = [];
    const date = new Date();
    const signatureKey = getSignatureKey({
      date,
      region: getEnv("AWS_REGION"),
      secretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY"),
    });
    for (let i = 0; i < reqData.filesCount; i++) {
      const s3Key = `${ulid()}.jpeg`;
      const signedUrl = getSignedUrl({
        key: s3Key,
        bucket: uploadPhotoBucket(),
        accessKeyId: getEnv("AWS_ACCESS_KEY_ID"),
        secretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY"),
        region: getEnv("AWS_REGION"),
        expiresIn: 60 * 60,
        method: "PUT",
        signatureKey,
        date,
      });
      uploadUrls.push(signedUrl);
      s3Keys.push(s3Key);
    }
    // Save upload session to db
    const uploadSessionId = ulid();
    await setUploadSession({
      id: uploadSessionId,
      userId: user.id,
      s3Keys,
    });
    // Send response
    const respData: PostUploadSessionRespData = {
      uploadSessionId,
      uploadUrls,
      s3Keys,
    };
    return Response.json(respData);
  },
};

function isPostUploadSessionReqData(
  o: unknown,
): o is PostUploadSessionReqData {
  const obj = o as PostUploadSessionReqData;
  return typeof obj === "object" && obj !== null &&
    typeof obj.filesCount === "number";
}
