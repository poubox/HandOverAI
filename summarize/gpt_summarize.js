// 📄 summarize/gpt_summarize.js
const axios = require("axios");
require("dotenv").config();

async function generateHandoverDocument(fullText) {
  const messages = [
    {
      role: "system",
      content:
        "너는 인수인계 문서를 자동 생성하는 비서야. 아래 내용을 토대로 요약된 인수인계 문서를 작성해줘.",
    },
    {
      role: "user",
      content: `다음은 작업 인수인계를 위한 전체 대화 또는 회의 음성 텍스트입니다:\n\n${fullText}\n\n이 내용을 바탕으로 다음 항목을 포함한 인수인계 문서를 작성해줘:
- 오늘 작업 내용 요약
- 주의사항 및 참고사항
- 다음 담당자가 알아야 할 정보`,
    },
  ];

  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.3,
        max_tokens: 800,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data.choices[0].message.content;
  } catch (error) {
    console.error("❌ GPT 요약 실패:", error.response?.data || error.message);
    return null;
  }
}

module.exports = generateHandoverDocument;
