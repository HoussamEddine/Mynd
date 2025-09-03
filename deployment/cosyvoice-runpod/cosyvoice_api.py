#!/usr/bin/env python3

import os
import sys
import torch
import torchaudio
import io
import base64
import json
import uuid
import time
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

# Add CosyVoice to path
sys.path.append('/opt/CosyVoice')

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import redis
import aiofiles

# Import CosyVoice
try:
    from cosyvoice.cli.cosyvoice import CosyVoice
    from cosyvoice.utils.file_utils import load_wav
except ImportError as e:
    print(f"Error importing CosyVoice: {e}")
    sys.exit(1)

# Initialize FastAPI app
app = FastAPI(
    title="CosyVoice TTS API",
    description="High-quality text-to-speech with voice cloning",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Redis for caching
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# Global variables for models
cosyvoice_sft = None
cosyvoice_zero_shot = None
models_loaded = False

# Job storage (in production, use Redis or database)
jobs = {}

class JobStatus:
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class VoiceCloneRequest(BaseModel):
    audio_file: str  # base64 encoded audio
    text: str
    language: str = "en"
    quality: str = "high"

class SpeechGenerationRequest(BaseModel):
    text: str
    voice_id: str
    language: str = "en"
    speed: float = 1.0
    emotion: str = "neutral"

class JobResponse(BaseModel):
    job_id: str
    status: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: str
    updated_at: str

def initialize_models():
    """Initialize CosyVoice models"""
    global cosyvoice_sft, cosyvoice_zero_shot, models_loaded
    
    try:
        print("Loading CosyVoice models...")
        
        # Load SFT model for fine-tuned voices
        sft_path = "/opt/models/CosyVoice-300M-SFT"
        if os.path.exists(sft_path):
            cosyvoice_sft = CosyVoice(sft_path)
            print("✓ SFT model loaded")
        
        # Load zero-shot model for voice cloning
        zero_shot_path = "/opt/models/CosyVoice-300M"
        if os.path.exists(zero_shot_path):
            cosyvoice_zero_shot = CosyVoice(zero_shot_path)
            print("✓ Zero-shot model loaded")
        
        models_loaded = True
        print("All models loaded successfully!")
        
    except Exception as e:
        print(f"Error loading models: {e}")
        models_loaded = False

def get_cache_key(operation: str, **kwargs) -> str:
    """Generate cache key for operations"""
    key_parts = [operation]
    for k, v in sorted(kwargs.items()):
        key_parts.append(f"{k}:{v}")
    return ":".join(key_parts)

async def cache_result(key: str, data: Dict[str, Any], ttl: int = 3600):
    """Cache result in Redis"""
    try:
        await redis_client.setex(key, ttl, json.dumps(data))
    except Exception as e:
        print(f"Cache error: {e}")

async def get_cached_result(key: str) -> Optional[Dict[str, Any]]:
    """Get cached result from Redis"""
    try:
        data = await redis_client.get(key)
        return json.loads(data) if data else None
    except Exception as e:
        print(f"Cache error: {e}")
        return None

def create_job() -> str:
    """Create a new job"""
    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "status": JobStatus.PENDING,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "result": None,
        "error": None
    }
    return job_id

def update_job(job_id: str, status: str, result: Optional[Dict] = None, error: Optional[str] = None):
    """Update job status"""
    if job_id in jobs:
        jobs[job_id].update({
            "status": status,
            "updated_at": datetime.utcnow().isoformat(),
            "result": result,
            "error": error
        })

def load_wav_from_bytes(audio_bytes: bytes, sample_rate: int = 16000):
    """Convert audio bytes to tensor for CosyVoice"""
    try:
        # Save bytes to temporary file
        temp_path = f"/tmp/audio_{uuid.uuid4()}.wav"
        with open(temp_path, 'wb') as f:
            f.write(audio_bytes)
        
        # Load with torchaudio
        waveform, sr = torchaudio.load(temp_path)
        
        # Resample if needed
        if sr != sample_rate:
            resampler = torchaudio.transforms.Resample(sr, sample_rate)
            waveform = resampler(waveform)
        
        # Convert to mono if stereo
        if waveform.shape[0] > 1:
            waveform = torch.mean(waveform, dim=0, keepdim=True)
        
        # Remove temporary file
        os.remove(temp_path)
        
        return waveform.squeeze().numpy()
        
    except Exception as e:
        print(f"Error loading audio: {e}")
        raise

def tensor_to_wav_bytes(tensor: torch.Tensor, sample_rate: int = 22050) -> bytes:
    """Convert audio tensor to WAV bytes"""
    try:
        buffer = io.BytesIO()
        
        # Ensure tensor is on CPU and has correct shape
        if tensor.dim() == 1:
            tensor = tensor.unsqueeze(0)
        
        torchaudio.save(buffer, tensor.cpu(), sample_rate, format="wav")
        return buffer.getvalue()
        
    except Exception as e:
        print(f"Error converting tensor to WAV: {e}")
        raise

@app.on_event("startup")
async def startup_event():
    """Initialize models on startup"""
    initialize_models()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    gpu_available = torch.cuda.is_available()
    gpu_memory = torch.cuda.get_device_properties(0).total_memory if gpu_available else 0
    
    return {
        "status": "healthy" if models_loaded else "unhealthy",
        "models_loaded": models_loaded,
        "gpu_available": gpu_available,
        "gpu_memory_gb": round(gpu_memory / (1024**3), 2) if gpu_memory > 0 else 0,
        "cuda_version": torch.version.cuda if gpu_available else "N/A",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/clone-voice", response_model=JobResponse)
async def clone_voice(request: VoiceCloneRequest):
    """Zero-shot voice cloning endpoint"""
    
    if not models_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    if not cosyvoice_zero_shot:
        raise HTTPException(status_code=503, detail="Zero-shot model not available")
    
    # Create job
    job_id = create_job()
    
    # Start background task
    asyncio.create_task(process_voice_cloning(job_id, request))
    
    return JobResponse(
        job_id=job_id,
        status=JobStatus.PENDING,
        created_at=jobs[job_id]["created_at"],
        updated_at=jobs[job_id]["updated_at"]
    )

async def process_voice_cloning(job_id: str, request: VoiceCloneRequest):
    """Process voice cloning in background"""
    try:
        update_job(job_id, JobStatus.PROCESSING)
        
        # Decode audio
        audio_bytes = base64.b64decode(request.audio_file)
        prompt_speech_16k = load_wav_from_bytes(audio_bytes, 16000)
        
        # Generate speech with cloned voice
        for i, result in enumerate(cosyvoice_zero_shot.inference_zero_shot(
            request.text,
            "希望你以后能够做的比我还好呦。",  # Reference text
            prompt_speech_16k,
            stream=False
        )):
            # Convert tensor to audio bytes
            audio_bytes = tensor_to_wav_bytes(result['tts_speech'], cosyvoice_zero_shot.sample_rate)
            
            # Encode to base64 for storage
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            # Generate voice ID
            voice_id = f"voice_{uuid.uuid4().hex[:8]}"
            
            # Store result
            result_data = {
                "voice_id": voice_id,
                "audio_base64": audio_base64,
                "duration": len(audio_bytes) / (cosyvoice_zero_shot.sample_rate * 2),  # Approximate duration
                "text": request.text,
                "language": request.language
            }
            
            # Cache result
            cache_key = get_cache_key("voice_clone", voice_id=voice_id)
            await cache_result(cache_key, result_data, ttl=86400)  # Cache for 24 hours
            
            update_job(job_id, JobStatus.COMPLETED, result_data)
            break
            
    except Exception as e:
        print(f"Voice cloning error: {e}")
        update_job(job_id, JobStatus.FAILED, error=str(e))

@app.post("/generate-speech", response_model=JobResponse)
async def generate_speech(request: SpeechGenerationRequest):
    """Generate speech using existing voice profile"""
    
    if not models_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    if not cosyvoice_sft:
        raise HTTPException(status_code=503, detail="SFT model not available")
    
    # Check cache first
    cache_key = get_cache_key("speech_gen", text=request.text, voice_id=request.voice_id, speed=request.speed)
    cached_result = await get_cached_result(cache_key)
    
    if cached_result:
        # Return cached result
        job_id = create_job()
        update_job(job_id, JobStatus.COMPLETED, cached_result)
        return JobResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            result=cached_result,
            created_at=jobs[job_id]["created_at"],
            updated_at=jobs[job_id]["updated_at"]
        )
    
    # Create job for new generation
    job_id = create_job()
    
    # Start background task
    asyncio.create_task(process_speech_generation(job_id, request))
    
    return JobResponse(
        job_id=job_id,
        status=JobStatus.PENDING,
        created_at=jobs[job_id]["created_at"],
        updated_at=jobs[job_id]["updated_at"]
    )

async def process_speech_generation(job_id: str, request: SpeechGenerationRequest):
    """Process speech generation in background"""
    try:
        update_job(job_id, JobStatus.PROCESSING)
        
        # Generate speech using SFT model
        for i, result in enumerate(cosyvoice_sft.inference_sft(
            request.text,
            request.voice_id,
            stream=False
        )):
            # Convert tensor to audio bytes
            audio_bytes = tensor_to_wav_bytes(result['tts_speech'], cosyvoice_sft.sample_rate)
            
            # Encode to base64
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            result_data = {
                "audio_base64": audio_base64,
                "duration": len(audio_bytes) / (cosyvoice_sft.sample_rate * 2),
                "text": request.text,
                "voice_id": request.voice_id,
                "speed": request.speed,
                "emotion": request.emotion
            }
            
            # Cache result
            cache_key = get_cache_key("speech_gen", text=request.text, voice_id=request.voice_id, speed=request.speed)
            await cache_result(cache_key, result_data, ttl=3600)  # Cache for 1 hour
            
            update_job(job_id, JobStatus.COMPLETED, result_data)
            break
            
    except Exception as e:
        print(f"Speech generation error: {e}")
        update_job(job_id, JobStatus.FAILED, error=str(e))

@app.get("/job-status/{job_id}", response_model=JobResponse)
async def get_job_status(job_id: str):
    """Get job status"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    return JobResponse(
        job_id=job_id,
        status=job["status"],
        result=job["result"],
        error=job["error"],
        created_at=job["created_at"],
        updated_at=job["updated_at"]
    )

@app.get("/audio/{job_id}")
async def get_audio(job_id: str):
    """Get generated audio for completed job"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    if job["status"] != JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Job not completed")
    
    if not job["result"] or "audio_base64" not in job["result"]:
        raise HTTPException(status_code=404, detail="Audio not found")
    
    # Decode audio
    audio_bytes = base64.b64decode(job["result"]["audio_base64"])
    
    return StreamingResponse(
        io.BytesIO(audio_bytes),
        media_type="audio/wav",
        headers={"Content-Disposition": f"attachment; filename=audio_{job_id}.wav"}
    )

@app.delete("/voice/{voice_id}")
async def delete_voice(voice_id: str):
    """Delete voice profile"""
    try:
        # Remove from cache
        cache_key = get_cache_key("voice_clone", voice_id=voice_id)
        await redis_client.delete(cache_key)
        
        return {"message": f"Voice {voice_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete voice: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
