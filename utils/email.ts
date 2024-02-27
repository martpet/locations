import { AWSSignerV4 } from "aws_sign_v4";
import { getEnv, siteEmail } from "./env.ts";

interface EmailNotification {
  to: string;
  subject: string;
  body: string;
}

export interface SendEmailMsg {
  type: "send-email";
  payload: EmailNotification;
}

export function isSendEmailMsg(o: unknown): o is SendEmailMsg {
  const obj = o as SendEmailMsg;
  return o !== undefined &&
    obj.type === "send-email" &&
    obj.payload !== undefined &&
    typeof obj.payload.to === "string" &&
    typeof obj.payload.subject === "string" &&
    typeof obj.payload.body === "string";
}

export async function sendEmail(notification: EmailNotification) {
  const body = JSON.stringify({
    FromEmailAddress: siteEmail(),
    Destination: {
      ToAddresses: [notification.to],
    },
    Content: {
      Simple: {
        Subject: {
          Data: notification.subject,
        },
        Body: {
          Text: {
            Data: notification.body,
          },
        },
      },
    },
  });
  const region = getEnv("AWS_REGION");
  const endpoint =
    `https://email.${region}.amazonaws.com/v2/email/outbound-emails`;
  const req = new Request(endpoint, { method: "POST", body });
  const signer = new AWSSignerV4();
  const signedReq = await signer.sign("ses", req);
  await fetch(signedReq);
}
