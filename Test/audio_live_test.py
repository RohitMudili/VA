import os
import torch
from faster_whisper import WhisperModel
import sounddevice as sd
import numpy as np
from queue import Queue
from threading import Thread


DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {DEVICE}")

SAMPLE_RATE   = 16_000   
CHANNELS      = 1
CHUNK_SEC     = 0.5      
SILENCE_SEC   = 1.0      
SILENCE_THRESH = 0.01    
BUFFER_SEC    = 30       


q = Queue()

class STTWork:
    def __init__(self, model_size: str = "distil-large-v3"):
        print(f"Loading Whisper model '{model_size}' on {DEVICE}...")
        # Use fp16 on CUDA for speed
        compute_type = "float16" if DEVICE == "cuda" else "float32"
        self.model = WhisperModel(model_size, device=DEVICE, compute_type=compute_type)
    def run(self, audio: np.ndarray) -> str:
        # Transcribe audio array
        segments, info = self.model.transcribe(
            audio,
            beam_size=5,
            language="en",
            task="transcribe"
        )
        # Concatenate segment texts
        return "".join([segment.text for segment in segments])

# Audio callback: push raw PCM bytes into queue
def audio_callback(indata, frames, time, status):
    if status:
        print(f"⚠️ {status}")
    pcm16 = (indata.flatten() * 32767).astype(np.int16)
    q.put(pcm16.tobytes())

# Main loop: detect speech boundaries and transcribe
def transcription_loop(stt_worker: STTWork):
    buffer = bytearray()
    speech_started = False
    silence_duration = 0.0
    bytes_per_sec = SAMPLE_RATE * CHANNELS * 2
    max_bytes = int(bytes_per_sec * BUFFER_SEC)

    while True:
        chunk = q.get()
        pcm = np.frombuffer(chunk, dtype=np.int16).astype(np.float32) / 32767.0
        rms = np.sqrt(np.mean(pcm**2))

        if rms > SILENCE_THRESH:
            # Detected voice activity
            buffer.extend(chunk)
            speech_started = True
            silence_duration = 0.0
        else:
            if speech_started:
                silence_duration += CHUNK_SEC
                if silence_duration >= SILENCE_SEC:
                    # End of speech: process buffer
                    audio_arr = np.frombuffer(bytes(buffer), dtype=np.int16).astype(np.float32) / 32767.0
                    try:
                        text = stt_worker.run(audio_arr)
                        print(f"\n🗨️  {text}\n")
                    except Exception as e:
                        print(f"Transcription error: {e}")
                    buffer.clear()
                    speech_started = False
                    silence_duration = 0.0

        # Trim buffer if too long
        if len(buffer) > max_bytes:
            buffer = buffer[-max_bytes:]

if __name__ == "__main__":
    # Check for audio devices
    if not sd.query_devices():
        print("No audio input devices found. Exiting.")
        exit(1)

    stt = STTWork(model_size="distil-large-v3")
    listener = Thread(target=transcription_loop, args=(stt,), daemon=True)
    listener.start()

    # Open microphone stream
    with sd.InputStream(
        samplerate=SAMPLE_RATE,
        channels=CHANNELS,
        blocksize=int(SAMPLE_RATE * CHUNK_SEC),
        callback=audio_callback
    ):
        print(f"🎤 Listening... Press Ctrl+C to stop.")
        try:
            while True:
                sd.sleep(1000)
        except KeyboardInterrupt:
            print("\n🛑 Stopped by user.")
