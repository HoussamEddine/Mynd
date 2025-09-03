FROM nvidia/cuda:12.1-cudnn8-devel-ubuntu22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PATH="/opt/conda/bin:${PATH}"

# Install basic dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    bzip2 \
    ca-certificates \
    git \
    curl \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Install Miniconda
RUN wget --quiet https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda.sh && \
    /bin/bash ~/miniconda.sh -b -p /opt/conda && \
    rm ~/miniconda.sh && \
    /opt/conda/bin/conda clean -tipsy && \
    ln -s /opt/conda/etc/profile.d/conda.sh /etc/profile.d/conda.sh && \
    echo ". /opt/conda/etc/profile.d/conda.sh" >> ~/.bashrc && \
    echo "conda activate base" >> ~/.bashrc

# Create a conda environment
RUN conda create -n cosyvoice python=3.10 -y
ENV PATH /opt/conda/envs/cosyvoice/bin:$PATH
SHELL ["/bin/bash", "-c"]

# Activate environment and install dependencies
RUN source activate cosyvoice && \
    pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cu121 && \
    pip install --no-cache-dir fastapi uvicorn numpy scipy librosa soundfile

# Clone CosyVoice repository
WORKDIR /workspace
RUN git clone https://github.com/FunAudioLLM/CosyVoice.git && \
    cd CosyVoice && \
    source activate cosyvoice && \
    pip install --no-cache-dir -r requirements.txt || echo "Some requirements may have failed, continuing anyway"

# Create API server
COPY api_server.py /workspace/api_server.py

# Expose port
EXPOSE 8000

# Set the entrypoint
CMD ["bash", "-c", "source activate cosyvoice && python /workspace/api_server.py"]