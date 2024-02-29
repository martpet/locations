import { Handlers, STATUS_CODE } from "$fresh/server.ts";
import { AWSSignerV4 } from "aws_sign_v4";
import { getEnv } from "../../utils/env.ts";
import { LngLat, State } from "../../utils/types.ts";

export type FindAddressReqData = LngLat;

export interface FindAddressRespData {
  esri: string;
  here: string;
  details: {
    postalCode: number;
  };
}

export const handler: Handlers<State> = {
  async POST(req, ctx) {
    if (!ctx.state.user) {
      return new Response(null, {
        status: STATUS_CODE.Unauthorized,
      });
    }
    const reqData = await req.json();
    if (!isFindAddressReqData(reqData)) {
      return new Response(null, {
        status: STATUS_CODE.BadRequest,
      });
    }
    const [esri, here] = await Promise.all([
      fetchAddress(reqData, "esri"),
      fetchAddress(reqData, "here"),
    ]);
    const respData: FindAddressRespData = {
      esri: esri.label,
      here: here.label,
      details: {
        postalCode: Number(esri.postalCode),
      },
    };
    return Response.json(respData);
  },
};

async function fetchAddress(lngLat: LngLat, provider: "esri" | "here") {
  const region = getEnv("AWS_REGION");
  const req = new Request(
    `https://places.geo.${region}.amazonaws.com/places/v0/indexes/places-${provider}-index/search/position`,
    {
      method: "post",
      body: JSON.stringify({
        "Position": lngLat,
        "Language": "bg",
        "MaxResults": 1,
      }),
    },
  );
  const signer = new AWSSignerV4();
  const signedReq = await signer.sign("geo", req);
  const resp = await fetch(signedReq);
  const data = await resp.json();
  return {
    label: data.Results[0].Place.Label,
    postalCode: data.Results[0].Place.PostalCode,
  };
}

function isFindAddressReqData(
  o: unknown,
): o is FindAddressReqData {
  return Array.isArray(o) &&
    typeof o[0] === "number" &&
    typeof o[1] === "number";
}
