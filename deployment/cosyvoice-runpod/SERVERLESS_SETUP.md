ii# 🚀 Serverless RunPod Setup for Testing

## Why Serverless for Testing?

- **Cost Effective**: Only pay when testing (~$0.50/hour when active)
- **No Idle Costs**: No charges when not in use
- **Easy Experimentation**: Start/stop as needed
- **Perfect for Development**: No commitment

## Step 1: Build Docker Image

```bash
# Navigate to deployment directory
cd deployment/cosyvoice-runpod

# Set your Docker Hub username
export DOCKER_USERNAME="your-dockerhub-username"

# Build and push (this will take 10-15 minutes)
./build-and-deploy.sh
```

## Step 2: Create Serverless Template

1. **Go to RunPod Dashboard**
   - Visit [runpod.io](https://runpod.io)
   - Sign in to your account

2. **Create New Template**
   - Click "Templates" → "New Template"
   - Select **"Serverless"** (not Always-On)

### Template Configuration

```yaml
Template Name: CosyVoice-TTS-Testing
Container Image: your-dockerhub-username/cosyvoice-runpod:latest
Container Disk: 50GB
Volume Disk: 20GB
GPU: RTX 3090 (cheaper for testing)
Serverless: ✅ Enabled
```

### Environment Variables

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

## Step 3: Test Your First Deployment

1. **Deploy Serverless Endpoint**
   - Go to "Serverless" in sidebar
   - Click "Deploy"
   - Select your template
   - Click "Deploy"

2. **Wait for Cold Start**
   - First request: 30-60 seconds
   - Subsequent requests: Instant
   - Models download on first use

## Step 4: Test the API

### Health Check

```bash
# Your endpoint will look like this:
curl https://your-endpoint-id.proxy.runpod.net/health
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
curl -X POST https://your-endpoint-id.proxy.runpod.net/clone-voice \
  -H "Content-Type: application/json" \
  -d '{
    "audio_file": "base64_encoded_audio_here",
    "text": "Hello, this is a test.",
    "language": "en"
  }'
```

## Step 5: Update Backend Configuration

Add to your backend `.env`:

```bash
# Serverless endpoint
RUNPOD_ENDPOINT=https://your-endpoint-id.proxy.runpod.net
RUNPOD_API_KEY=your-runpod-api-key
COSYVOICE_BASE_URL=https://your-endpoint-id.proxy.runpod.net

# Serverless specific settings
COSYVOICE_TIMEOUT=300000  # 5 minutes for cold start
COSYVOICE_MAX_RETRIES=3
```

## Cost Breakdown

### Serverless Pricing (Testing)
- **RTX 3090**: ~$0.50/hour when active
- **RTX 4090**: ~$0.80/hour when active
- **Idle time**: $0.00/hour

### Example Monthly Cost (Testing)
- **2 hours/day testing**: ~$30-48/month
- **5 hours/day testing**: ~$75-120/month
- **Idle time**: $0/month

## Testing Workflow

1. **Start Testing Session**
   ```bash
   # First request triggers cold start
   curl https://your-endpoint-id.proxy.runpod.net/health
   ```

2. **Run Your Tests**
   ```bash
   # Subsequent requests are instant
   curl -X POST https://your-endpoint-id.proxy.runpod.net/clone-voice ...
   ```

3. **End Testing Session**
   - Serverless automatically scales to zero
   - No charges when idle

## Monitoring Serverless Usage

### Check Usage in RunPod Dashboard
- Go to "Serverless" → Your endpoint
- View "Metrics" tab
- Monitor active time and costs

### API Usage Tracking
```bash
# Check endpoint status
curl https://your-endpoint-id.proxy.runpod.net/health

# Monitor response times
time curl https://your-endpoint-id.proxy.runpod.net/health
```

## Troubleshooting Serverless

### Cold Start Issues
- **First request slow**: Normal (30-60 seconds)
- **Models downloading**: Check logs in dashboard
- **GPU initialization**: Wait for completion

### Cost Optimization
1. **Batch requests**: Send multiple requests together
2. **Keep sessions alive**: Reuse same endpoint
3. **Monitor usage**: Check RunPod dashboard regularly

### Common Errors
1. **Timeout errors**: Increase timeout to 5 minutes
2. **GPU memory errors**: Use RTX 3090 instead of 4090
3. **Model loading errors**: Check disk space (50GB needed)

## When to Switch to Always-On

Switch to Always-On Pod when:
- ✅ **Production ready**
- ✅ **High traffic** (>100 requests/hour)
- ✅ **Budget allows** ($12-60/day)
- ✅ **Need instant response**

## Next Steps After Testing

1. **Validate API endpoints**
2. **Test with your app**
3. **Measure performance**
4. **Calculate costs**
5. **Decide on production setup**

## Support

For serverless issues:
1. Check RunPod serverless documentation
2. Monitor logs in dashboard
3. Test with simple health check first
4. Verify your Docker image works locally
