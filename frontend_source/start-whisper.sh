#!/bin/bash
# ============================================================
# start-whisper.sh — Deploy Whisper ASR locally on port 9000
# Run this on Morefine M6s before starting icaffeOS
# ============================================================

set -e

echo "🎙️  Starting Whisper ASR (Hebrew / medium model)..."

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Start Docker Desktop or 'sudo systemctl start docker'"
  exit 1
fi

# Pull latest image
echo "📦 Pulling latest whisper-asr image..."
docker pull onerahmet/openai-whisper-asr-webservice:latest

# Stop existing container if running
docker compose -f "$(dirname "$0")/docker-compose.whisper.yml" down 2>/dev/null || true

# Start the service
docker compose -f "$(dirname "$0")/docker-compose.whisper.yml" up -d

echo ""
echo "⏳ Waiting for Whisper to load model (small ~10s first boot)..."

# Wait for the service to respond
MAX_WAIT=120
ELAPSED=0
until curl -s http://localhost:9000/ > /dev/null 2>&1; do
  sleep 3
  ELAPSED=$((ELAPSED + 3))
  if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo "⚠️  Whisper took longer than expected. Check: docker logs icaffe-whisper-asr"
    break
  fi
  echo -n "."
done

echo ""
echo "✅ Whisper ASR is ready at http://localhost:9000"
echo ""
echo "🧪 Test with:"
echo '   curl -F "audio_file=@test.wav" "http://localhost:9000/asr?language=he&output=json"'
echo ""
echo "📊 Monitor logs:"
echo "   docker logs -f icaffe-whisper-asr"
