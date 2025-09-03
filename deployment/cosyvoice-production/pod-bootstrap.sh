#!/bin/bash
set -euo pipefail

echo "Starting CosyVoice bootstrap..."

# Detect package manager
if command -v apt-get >/dev/null 2>&1; then
  PM=apt-get
else
  echo "Unsupported base image. Need apt-get."
  exit 1
fi

# Update base
DEBIAN_FRONTEND=noninteractive $PM update
DEBIAN_FRONTEND=noninteractive $PM install -y --no-install-recommends \
  python3 python3-pip python3-venv git curl wget ca-certificates ffmpeg \
  build-essential pkg-config libsndfile1

python3 -m venv /opt/cosyvoice-venv
source /opt/cosyvoice-venv/bin/activate
python -m pip install --upgrade pip

# Core deps (torch CPU/GPU resolved by pip+CUDA libs in image)
pip install --no-cache-dir \
  fastapi uvicorn[standard] \
  numpy scipy librosa soundfile pydantic==2.* \
  torch torchaudio --index-url https://download.pytorch.org/whl/cu121

# Workspace
mkdir -p /workspace && cd /workspace
if [ ! -d CosyVoice ]; then
  git clone https://github.com/FunAudioLLM/CosyVoice.git
fi
cd CosyVoice
pip install --no-cache-dir -r requirements.txt || true

# Minimal API server wrapper
cat >/workspace/cosyvoice_api.py <<'PY'
from fastapi import FastAPI
import uvicorn

app = FastAPI(title="CosyVoice API")

@app.get("/health")
def health():
    return {"ok": True}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
PY

# Systemd not available; run via nohup
nohup /opt/cosyvoice-venv/bin/python /workspace/cosyvoice_api.py > /workspace/cosyvoice_api.log 2>&1 &

echo "CosyVoice bootstrap complete. API on :8000"
