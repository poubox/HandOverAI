// 📁 index.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const generateHandoverDocument = require("./summarize/gpt_summarize"); // ✅ GPT 요약 함수

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// 📂 업로드 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// ✅ 기본 라우터
app.get("/", (req, res) => {
  res.send("Handover.AI 서버가 실행 중입니다.");
});

// ✅ 1. 파일 업로드
app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "파일이 업로드되지 않았습니다." });
  }

  res.json({
    message: "파일 업로드 성공",
    filepath: file.path,
    filename: file.originalname,
  });
});

// ✅ 2. Whisper 텍스트 변환 (Hugging Face Inference API)
app.post("/transcribe", async (req, res) => {
  try {
    const { filepath } = req.body;
    if (!filepath)
      return res.status(400).json({ message: "filepath가 필요합니다." });

    const audioData = fs.readFileSync(filepath);

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/openai/whisper-medium",
      audioData,
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "audio/x-m4a",
        },
      }
    );

    const resultText = response.data.text || "[변환 결과 없음]";

    // 변환된 텍스트를 output.txt로 저장
    fs.writeFileSync("output.txt", resultText, "utf-8");

    res.json({
      message: "Whisper 변환 완료",
      text: resultText,
    });
  } catch (error) {
    console.error("Whisper 변환 오류:", error.response?.data || error.message);
    res
      .status(500)
      .json({ message: "Whisper 변환 실패", error: error.message });
  }
});

// ✅ 3. GPT 요약 → 인수인계 문서 생성
app.post("/handover", async (req, res) => {
  try {
    const textPath = req.body.textPath || "output.txt";

    if (!fs.existsSync(textPath)) {
      return res.status(404).json({ error: "output.txt 파일이 없습니다." });
    }

    const fullText = fs.readFileSync(textPath, "utf-8");

    const summary = await generateHandoverDocument(fullText);

    if (!summary) {
      return res.status(500).json({ error: "GPT 요약 실패" });
    }

    res.json({ handover: summary });
  } catch (error) {
    console.error("GPT 요약 오류:", error.message);
    res.status(500).json({ error: "서버 오류" });
  }
});

// ✅ 서버 시작
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});
