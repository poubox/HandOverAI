import React, { useState } from "react";

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [transcribedText, setTranscribedText] = useState("");
  const [handoverText, setHandoverText] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("파일을 선택하세요.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      setMessage(`✅ 업로드 성공: ${uploadData.filename}`);

      const transcribeRes = await fetch("http://localhost:5000/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filepath: uploadData.filepath }),
      });

      const transcribeData = await transcribeRes.json();
      setTranscribedText(transcribeData.text);

      const handoverRes = await fetch("http://localhost:5000/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textPath: "output.txt" }),
      });

      const handoverData = await handoverRes.json();
      setHandoverText(handoverData.handover);
    } catch (err) {
      console.error("오류:", err);
      setMessage("❌ 처리 실패");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🎤 음성 파일 업로드</h2>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <br />
      <button onClick={handleUpload} style={{ marginTop: "1rem" }}>
        업로드 및 변환
      </button>
      <p>{message}</p>

      {transcribedText && (
        <div style={{ marginTop: "2rem" }}>
          <h3>📝 Whisper 변환 결과</h3>
          <pre>{transcribedText}</pre>
        </div>
      )}

      {handoverText && (
        <div style={{ marginTop: "2rem" }}>
          <h3>📄 인수인계 요약 문서</h3>
          <pre>{handoverText}</pre>
        </div>
      )}
    </div>
  );
}
