import { NextRequest, NextResponse } from "next/server";
import { ASRClient, Config, HeaderUtils } from "coze-coding-dev-sdk";

export async function POST(request: NextRequest) {
  try {
    const { audio, format } = await request.json();

    if (!audio) {
      return NextResponse.json(
        { error: "缺少音频数据" },
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new ASRClient(config, customHeaders);

    const result = await client.recognize({
      uid: "lesson-chat-user",
      base64Data: audio,
    });

    return NextResponse.json({ text: result.text });
  } catch (error) {
    console.error("ASR error:", error);
    return NextResponse.json(
      { error: "语音识别失败" },
      { status: 500 }
    );
  }
}