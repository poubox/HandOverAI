import sys
from pydub import AudioSegment
import os
import torch
from transformers import AutoProcessor, AutoModelForSpeechSeq2Seq
import librosa

# Whisper 모델 준비
processor = AutoProcessor.from_pretrained("openai/whisper-medium")
model = AutoModelForSpeechSeq2Seq.from_pretrained("openai/whisper-medium")
model.eval()

# 오디오 분할 함수
def split_audio(file_path, chunk_dir="uploads/chunks", chunk_length_ms=30_000):
    os.makedirs(chunk_dir, exist_ok=True)
    audio = AudioSegment.from_file(file_path)
    chunks = []
    for i in range(0, len(audio), chunk_length_ms):
        chunk = audio[i:i + chunk_length_ms]
        out_path = os.path.join(chunk_dir, f"chunk_{i // chunk_length_ms}.wav")
        chunk.export(out_path, format="wav")
        chunks.append(out_path)
    return chunks

# 변환 함수
def transcribe(audio_path):
    speech, sr = librosa.load(audio_path, sr=16000)
    inputs = processor(speech, sampling_rate=16000, return_tensors="pt")
    with torch.no_grad():
        generated_ids = model.generate(inputs["input_features"], max_length=448)
        text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
    return text

# 실행 흐름
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ 사용법: python3 transcribe.py [오디오파일경로]")
        sys.exit(1)

    original_file = sys.argv[1]
    chunks = split_audio(original_file)

    all_text = ""
    for chunk_path in chunks:
        print(f"🟡 처리 중: {chunk_path}")
        chunk_text = transcribe(chunk_path)
        print(f"✅ 변환된 텍스트: {chunk_text}")
        all_text += chunk_text + " "

    print("\n🟢 전체 결과:")
    print(all_text)

    with open("output.txt", "w", encoding="utf-8") as f:
        f.write(all_text)
