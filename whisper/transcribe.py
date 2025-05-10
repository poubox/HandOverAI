from pydub import AudioSegment
import os
import torch
from transformers import AutoProcessor, AutoModelForSpeechSeq2Seq
import librosa

# 모델 준비
processor = AutoProcessor.from_pretrained("openai/whisper-medium")
model = AutoModelForSpeechSeq2Seq.from_pretrained("openai/whisper-medium")
model.eval()

def split_audio(file_path, chunk_dir="uploads/chunks", chunk_length_ms=30_000):
    # 폴더 없으면 생성
    os.makedirs(chunk_dir, exist_ok=True)
    audio = AudioSegment.from_file(file_path)
    chunks = []

    for i in range(0, len(audio), chunk_length_ms):
        chunk = audio[i:i + chunk_length_ms]
        out_path = os.path.join(chunk_dir, f"chunk_{i // chunk_length_ms}.wav")
        chunk.export(out_path, format="wav")
        chunks.append(out_path)

    return chunks

def transcribe(audio_path):
    speech, sr = librosa.load(audio_path, sr=16000)
    inputs = processor(speech, sampling_rate=16000, return_tensors="pt")
    with torch.no_grad():
        generated_ids = model.generate(inputs["input_features"], max_length=448)
        text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
    return text

if __name__ == "__main__":
    original_file = "uploads/my_audio.wav"  # ✅ 원본 오디오
    chunk_output_dir = "uploads/chunks"     # ✅ 정리된 chunk 저장 위치

    chunks = split_audio(original_file, chunk_output_dir)

    all_text = ""
    for chunk_path in chunks:
        print(f"🟡 처리 중: {chunk_path}")
        chunk_text = transcribe(chunk_path)
        print(f"✅ 변환된 텍스트: {chunk_text}")
        all_text += chunk_text + " "

    print("\n🟢 전체 결과:")
    print(all_text)
