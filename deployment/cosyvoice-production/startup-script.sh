#!/bin/bash

# CosyVoice Startup Script
# This script will be executed when the pod starts

echo "🚀 Starting CosyVoice deployment..."

# Update system
apt-get update

# Install dependencies
apt-get install -y python3-pip git curl wget

# Create app directory
mkdir -p /app
cd /app

# Clone CosyVoice
echo "📦 Cloning CosyVoice..."
git clone https://github.com/FunAudioLLM/CosyVoice.git

# Install Python dependencies
echo "🔧 Installing Python dependencies..."
pip3 install fastapi uvicorn torch torchaudio numpy scipy librosa soundfile

# Install CosyVoice dependencies
cd CosyVoice
pip3 install -r requirements.txt

# Create a simple test server
echo "🌐 Starting test server..."
cd /app
python3 -m http.server 8000 &

echo "✅ CosyVoice deployment completed!"
echo "🌐 Server running on port 8000"

# Keep the script running
tail -f /dev/null
