# 🚀 CosyVoice Deployment Guide - RunPod Web Interface

## Overview
Since the RunPod API has complex authentication and endpoint requirements, we'll use the web interface to deploy CosyVoice.

## Step 1: Access RunPod Console
1. Go to [https://console.runpod.io](https://console.runpod.io)
2. Sign in with your account
3. Navigate to the **Pods** section

## Step 2: Create New Pod
1. Click **"Create Pod"** or **"Deploy"**
2. Configure the pod with these settings:

### Pod Configuration
- **Name**: `CosyVoice RTX A4000`
- **GPU Type**: `NVIDIA RTX A4000` (or available equivalent)
- **Container Image**: `nvidia/cuda:12.1-devel-ubuntu22.04`
- **Container Disk**: `50 GB`
- **Volume Disk**: `100 GB`
- **Ports**: 
  - `8000` (HTTP)
  - `22` (SSH)
- **Start SSH**: ✅ **Yes**
- **Start Jupyter Lab**: ❌ **No**

## Step 3: Deploy CosyVoice
Once the pod is running, connect via SSH or web terminal and run:

```bash
# Update system
apt-get update

# Install dependencies
apt-get install -y python3-pip git curl wget

# Install Python packages
pip3 install torch torchaudio fastapi uvicorn numpy scipy librosa soundfile

# Clone CosyVoice
cd /workspace
git clone https://github.com/FunAudioLLM/CosyVoice.git
cd CosyVoice

# Install CosyVoice requirements
pip3 install -r requirements.txt

# Start the server
python3 -m http.server 8000 &
```

## Step 4: Access CosyVoice
- **Web Interface**: `https://your-pod-id-8000.proxy.runpod.net`
- **SSH Access**: Use the SSH credentials provided by RunPod

## Step 5: Test CosyVoice
1. Open the web interface
2. Upload an audio file or use text-to-speech
3. Verify the system is working correctly

## Troubleshooting
- **GPU Issues**: Ensure CUDA is properly installed
- **Port Issues**: Check if port 8000 is accessible
- **Memory Issues**: Increase container disk if needed

## Cost Optimization
- Use spot instances for lower costs
- Monitor usage in RunPod dashboard
- Stop pods when not in use

## Next Steps
1. Set up environment variables for production
2. Configure persistent storage
3. Set up monitoring and logging
4. Create deployment scripts for automation

---

**Note**: This guide uses the web interface approach since the RunPod API requires specific authentication and endpoint configurations that are complex to set up programmatically.
