# CosyVoice RunPod Deployment

This directory contains the optimized CosyVoice deployment for RunPod with production-ready features.

## 🚀 Quick Start

### 1. Build and Deploy

```bash
# Build the Docker image
docker build -t cosyvoice-runpod .

# Run locally for testing
docker-compose up -d

# Or deploy to RunPod
# Upload the image to your registry and use the RunPod template
```

### 2. Test the API

```bash
# Health check
curl http://localhost:8000/health

# Clone voice
curl -X POST http://localhost:8000/clone-voice \
  -H "Content-Type: application/json" \
  -d '{
    "audio_file": "base64_encoded_audio",
    "text": "Hello, this is a test.",
    "language": "en"
  }'

# Generate speech
curl -X POST http://localhost:8000/generate-speech \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test.",
    "voice_id": "voice_12345678",
    "speed": 1.0,
    "emotion": "neutral"
  }'
```

## 📋 API Endpoints

### Health Check
- `GET /health` - Check service status and GPU availability

### Voice Cloning
- `POST /clone-voice` - Clone voice from audio sample
- `DELETE /voice/{voice_id}` - Delete voice profile

### Speech Generation
- `POST /generate-speech` - Generate speech with cloned voice
- `GET /job-status/{job_id}` - Check job status
- `GET /audio/{job_id}` - Download generated audio

## 🔧 Configuration

### Environment Variables
- `PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:128` - GPU memory optimization
- `CUDA_VISIBLE_DEVICES=0` - Use first GPU
- `PYTHONUNBUFFERED=1` - Real-time logging

### RunPod Template Settings
```yaml
Name: CosyVoice-TTS-Production
Container Image: your-registry/cosyvoice-runpod:latest
Container Disk: 50GB
Volume Disk: 20GB
GPU: RTX 4090 or A100
Environment Variables: [see above]
Exposed Ports: 8000
Start Command: /opt/CosyVoice/startup.sh
```

## 💾 Caching Strategy

### Redis Cache
- **Voice Clones**: 24 hours TTL
- **Speech Generation**: 1 hour TTL
- **Job Status**: 30 minutes TTL

### Cache Keys
- `voice_clone:voice_id:{voice_id}`
- `speech_gen:text:{text}:voice_id:{voice_id}:speed:{speed}`

## 🎯 Performance Optimization

### GPU Memory Management
- Automatic model loading/unloading
- Efficient tensor operations
- Memory pooling for concurrent requests

### Audio Processing
- Async job processing
- Streaming responses
- Optimized audio format conversion

### Caching Benefits
- Reduces redundant processing
- Faster response times
- Lower GPU utilization

## 🔍 Monitoring

### Health Metrics
- GPU availability and memory
- Model loading status
- CUDA version
- Service uptime

### Performance Metrics
- Request latency
- Cache hit rates
- GPU utilization
- Error rates

## 🛠️ Troubleshooting

### Common Issues

1. **Models not loading**
   ```bash
   # Check model paths
   ls -la /opt/models/
   
   # Re-download models
   python download_models.py
   ```

2. **GPU not detected**
   ```bash
   # Check CUDA installation
   nvidia-smi
   
   # Check PyTorch CUDA
   python -c "import torch; print(torch.cuda.is_available())"
   ```

3. **Redis connection issues**
   ```bash
   # Check Redis status
   redis-cli ping
   
   # Restart Redis
   redis-server --daemonize yes
   ```

### Logs
```bash
# View container logs
docker logs cosyvoice-runpod_cosyvoice_1

# View Redis logs
docker logs cosyvoice-runpod_redis_1
```

## 🔐 Security

### API Security
- Input validation
- Rate limiting (implement in production)
- Error handling without data leakage

### Data Privacy
- Temporary file cleanup
- Secure audio processing
- No persistent storage of user audio

## 📈 Scaling

### Horizontal Scaling
- Multiple RunPod instances
- Load balancer configuration
- Shared Redis cache

### Vertical Scaling
- Higher GPU memory (A100)
- Faster storage (NVMe)
- More CPU cores

## 💰 Cost Optimization

### RunPod Pricing
- **RTX 3090**: ~$0.50/hour (serverless)
- **RTX 4090**: ~$0.80/hour (serverless)
- **A100**: ~$2.50/hour (always-on)

### Optimization Tips
- Use caching to reduce processing
- Implement request batching
- Monitor and optimize model usage
- Use appropriate GPU for workload

## 🔄 Integration with Backend

The API is designed to integrate seamlessly with your existing `CosyVoiceService`:

```typescript
// Example integration
const response = await fetch(`${runpodEndpoint}/clone-voice`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${runpodApiKey}`
  },
  body: JSON.stringify({
    audio_file: audioBase64,
    text: "Hello, this is a test.",
    language: "en"
  })
});
```

## 📝 Next Steps

1. **Deploy to RunPod** using the template
2. **Update backend configuration** with RunPod endpoints
3. **Implement job queue system** for async processing
4. **Add monitoring and alerting**
5. **Optimize for production scale**
