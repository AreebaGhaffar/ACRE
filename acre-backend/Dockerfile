FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages in stages to avoid timeout
RUN pip install --no-cache-dir --timeout=300 \
    fastapi uvicorn python-dotenv requests pymupdf

RUN pip install --no-cache-dir --timeout=300 \
    networkx spacy plotly streamlit

RUN pip install --no-cache-dir --timeout=300 \
    torch --index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir --timeout=300 \
    sentence-transformers

RUN python -m spacy download en_core_web_trf

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]