# 🚀 RunPod Setup Guide for CosyVoice

## Prerequisites

- RunPod account with credits
- Docker Hub account
- Docker installed locally

## Step 1: Build and Deploy Docker Image

### Option A: Use the Build Script (Recommended)

```bash
# Navigate to the deployment directory
cd deployment/cosyvoice-runpod

# Set your Docker Hub username
export DOCKER_USERNAME="your-dockerhub-username"

# Run the build script
./build-and-deploy.sh
```

### Option B: Manual Build

```bash
# Build the image
docker build -t your-dockerhub-username/cosyvoice-runpod:latest .

# Login to Docker Hub
docker login

# Push the image
docker push your-dockerhub-username/cosyvoice-runpod:latest
```

## Step 2: Create RunPod Template

1. **Go to RunPod Dashboard**
   - Visit [runpod.io](https://runpod.io)
   - Sign in to your account

2. **Create New Template**
   - Click "Templates" in the sidebar
   - Click "New Template"
   - Fill in the details:

### Template Configuration

```yaml
Template Name: CosyVoice-TTS-Production
Container Image: your-dockerhub-username/cosyvoice-runpod:latest
Container Disk: 50GB
Volume Disk: 20GB
GPU: RTX 4090 (or A100 for production)
```

### Environment Variables

Add these environment variables:

```yaml
PYTORCH_CUDA_ALLOC_CONF: max_split_size_mb:128
CUDA_VISIBLE_DEVICES: 0
PYTHONUNBUFFERED: 1
```

### Port Configuration

```yaml
Port: 8000
Protocol: HTTP
```

## Step 3: Deploy Your First Pod

1. **Create Pod**
   - Go to "Pods" in the sidebar
   - Click "Deploy"
   - Select your "CosyVoice-TTS-Production" template
   - Choose your preferred GPU
   - Click "Deploy"

2. **Wait for Startup**
   - The pod will take 2-5 minutes to start
   - Models will download automatically on first startup
   - Monitor the logs for progress

## Step 4: Test the Deployment

### Check Health Status

```bash
# Replace with your pod's URL
curl https://your-pod-id.proxy.runpod.net/health
```

Expected response:
```json
{
  "status": "healthy",
  "models_loaded": true,
  "gpu_available": true,
  "gpu_memory_gb": 24.0,
  "cuda_version": "11.8",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test Voice Cloning

```bash
# Create a test audio file (base64 encoded)
echo "Hello, this is a test." > test.txt

# Clone voice
curl -X POST https://your-pod-id.proxy.runpod.net/clone-voice \
  -H "Content-Type: application/json" \
  -d '{
    "audio_file": "base64_encoded_audio_here",
    "text": "Hello, this is a test.",
    "language": "en"
  }'
```

## Step 5: Get Your Pod Details

After deployment, you'll get:

- **Pod URL**: `https://your-pod-id.proxy.runpod.net`
- **API Endpoint**: `https://your-pod-id.proxy.runpod.net:8000`
- **Health Check**: `https://your-pod-id.proxy.runpod.net/health`

## Step 6: Update Backend Configuration

Update your backend environment variables:

```bash
# Add to your .env file
RUNPOD_ENDPOINT=https://your-pod-id.proxy.runpod.net
RUNPOD_API_KEY=your-runpod-api-key
COSYVOICE_BASE_URL=https://your-pod-id.proxy.runpod.net
```

## Monitoring and Troubleshooting

### Check Pod Status

1. **In RunPod Dashboard**
   - Go to "Pods"
   - Click on your pod
   - Check "Logs" tab for startup progress

2. **Via API**
   ```bash
   curl https://your-pod-id.proxy.runpod.net/health
   ```

### Common Issues

1. **Models not downloading**
   - Check internet connection
   - Verify disk space (need 50GB+)
   - Check logs for download errors

2. **GPU not detected**
   - Verify GPU selection in template
   - Check CUDA installation in logs
   - Restart pod if needed

3. **Port not accessible**
   - Verify port 8000 is exposed
   - Check firewall settings
   - Use RunPod's proxy URL

### Logs to Monitor

```bash
# Check startup logs
docker logs cosyvoice-container

# Check model download progress
tail -f /opt/CosyVoice/download_models.py.log

# Check API server logs
tail -f /opt/CosyVoice/cosyvoice_api.py.log
```

## Cost Optimization

### Development Setup
- **GPU**: RTX 3090 (serverless)
- **Cost**: ~$0.50/hour when active
- **Cold Start**: ~30 seconds

### Production Setup
- **GPU**: A100 (always-on)
- **Cost**: ~$2.50/hour
- **Response Time**: Instant

### Tips to Reduce Costs
1. Use serverless for development
2. Implement caching to reduce processing
3. Monitor usage and optimize requests
4. Use appropriate GPU for workload

## Next Steps

Once your pod is running:

1. **Test the API endpoints**
2. **Update your backend configuration**
3. **Implement job queue system**
4. **Add monitoring and alerting**
5. **Scale for production**

## Support

If you encounter issues:

1. Check the logs in RunPod dashboard
2. Verify your Docker image builds correctly
3. Test locally with docker-compose first
4. Check RunPod documentation for GPU issues
