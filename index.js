// 📁 index.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// 🔧 환경변수 사용
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// 📂 uploads 폴더 저장 설정 (Multer)
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

// ✅ 1. 파일 업로드 API
app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "파일이 업로드되지 않았습니다." });
  }

  res.json({
    message: "파일 업로드 성공",
    filepath: file.path, // 이걸 /transcribe에 넘기면 됨
    filename: file.originalname,
  });
});

// ✅ 2. Whisper 텍스트 변환 API (Hugging Face 무료 Inference API 사용)
app.post("/transcribe", async (req, res) => {
  try {
    const { filepath } = req.body;
    if (!filepath)
      return res.status(400).json({ message: "filepath가 필요합니다." });

    const audioData = fs.readFileSync(filepath); // 업로드된 음성 파일 읽기

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/openai/whisper-medium",
      audioData,
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "audio/x-m4a", // 필요 시 audio/mpeg 로 변경
        },
      }
    );

    const resultText = response.data.text || "[변환 결과 없음]";

    res.json({
      message: "음성 변환 완료",
      text: resultText,
    });
  } catch (error) {
    console.error("Whisper 변환 오류:", error.response?.data || error.message);
    res
      .status(500)
      .json({ message: "Whisper 변환 실패", error: error.message });
  }
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});
