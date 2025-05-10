from pydub import AudioSegment
import os
import torch
from transformers import AutoProcessor, AutoModelForSpeechSeq2Seq
import librosa

# 1. Whisper 모델 준비 (Hugging Face의 openai/whisper-medium 사용)
processor = AutoProcessor.from_pretrained("openai/whisper-medium")
model = AutoModelForSpeechSeq2Seq.from_pretrained("openai/whisper-medium")
model.eval()  # 모델을 평가 모드로 설정 (추론 전용)

# 2. 오디오 파일을 30초 단위로 분할하여 chunks 폴더에 저장
def split_audio(file_path, chunk_dir="uploads/chunks", chunk_length_ms=30_000):
    os.makedirs(chunk_dir, exist_ok=True)  # 디렉토리 없으면 생성
    audio = AudioSegment.from_file(file_path)
    chunks = []

    for i in range(0, len(audio), chunk_length_ms):
        chunk = audio[i:i + chunk_length_ms]
        out_path = os.path.join(chunk_dir, f"chunk_{i // chunk_length_ms}.wav")
        chunk.export(out_path, format="wav")
        chunks.append(out_path)  # 분할된 파일 경로 리스트에 추가

    return chunks

# 📌 3. Whisper 모델을 활용한 오디오 → 텍스트 변환 함수
def transcribe(audio_path):
    speech, sr = librosa.load(audio_path, sr=16000)  # 샘플링 주파수 16kHz로 로드
    inputs = processor(speech, sampling_rate=16000, return_tensors="pt")
    
    with torch.no_grad():  # 학습 없이 추론만 수행
        generated_ids = model.generate(inputs["input_features"], max_length=448)
        text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]

    return text

# 📌 4. 실행 흐름: 오디오 파일 분할 → 각 파일 텍스트화 → 전체 결과 출력
if __name__ == "__main__":
    original_file = "uploads/my_audio.wav"       # 🎧 원본 오디오 파일
    chunk_output_dir = "uploads/chunks"          # 🗂️ 분할된 오디오 저장 폴더

    chunks = split_audio(original_file, chunk_output_dir)

    all_text = ""
    for chunk_path in chunks:
        print(f"🟡 처리 중: {chunk_path}")
        chunk_text = transcribe(chunk_path)
        print(f"✅ 변환된 텍스트: {chunk_text}")
        all_text += chunk_text + " "

    # 전체 결과 출력
    print("\n🟢 전체 결과:")
    print(all_text)

    # 🔽 결과를 output.txt 파일로 저장
    with open("output.txt", "w", encoding="utf-8") as f:
        f.write(all_text)
