#!/usr/bin/env python3

import os
import sys
import torch
from pathlib import Path

# Add CosyVoice to path
sys.path.append('/opt/CosyVoice')

try:
    from cosyvoice.utils.file_utils import load_or_download_config, load_or_download_model
    from cosyvoice.utils.file_utils import load_or_download_model_file
except ImportError as e:
    print(f"Error importing CosyVoice: {e}")
    sys.exit(1)

def download_models():
    """Download and cache CosyVoice models"""
    
    print("Starting model download...")
    
    # Create models directory
    models_dir = Path("/opt/models")
    models_dir.mkdir(exist_ok=True)
    
    # Models to download
    models = [
        {
            "name": "CosyVoice-300M",
            "repo": "iic/CosyVoice-300M",
            "path": models_dir / "CosyVoice-300M"
        },
        {
            "name": "CosyVoice-300M-SFT", 
            "repo": "iic/CosyVoice-300M-SFT",
            "path": models_dir / "CosyVoice-300M-SFT"
        }
    ]
    
    for model in models:
        print(f"Downloading {model['name']}...")
        try:
            # Download model files
            load_or_download_model(
                str(model['path']), 
                model['repo']
            )
            print(f"✓ {model['name']} downloaded successfully")
        except Exception as e:
            print(f"✗ Failed to download {model['name']}: {e}")
            continue
    
    print("Model download completed!")

if __name__ == "__main__":
    download_models()
