#!/bin/bash

set -e

# Configuration
DOCKER_USERNAME=${DOCKER_USERNAME:-"your-dockerhub-username"}
IMAGE_NAME="cosyvoice-runpod"
TAG="latest"

echo "🚀 Building and deploying CosyVoice to RunPod..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG} .

# Test the image locally (optional)
echo "🧪 Testing image locally..."
docker run --rm --gpus all -p 8000:8000 ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG} &
CONTAINER_ID=$!

# Wait for container to start
sleep 10

# Test health endpoint
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Local test passed!"
else
    echo "⚠️  Local test failed, but continuing with deployment..."
fi

# Stop test container
docker stop $CONTAINER_ID

# Login to Docker Hub
echo "🔐 Logging into Docker Hub..."
docker login

# Push the image
echo "📤 Pushing image to Docker Hub..."
docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}

echo "✅ Image pushed successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Go to RunPod dashboard"
echo "2. Create template with image: ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}"
echo "3. Deploy your first pod"
echo ""
echo "📋 Template settings:"
echo "   - Container Disk: 50GB"
echo "   - Volume Disk: 20GB"
echo "   - GPU: RTX 4090 or A100"
echo "   - Port: 8000"
echo "   - Environment: PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:128"
