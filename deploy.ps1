# Deployment helper for AI Interview Prep Platform
# Run this script from the project root (vite-project)

Set-Location -Path "c:\Users\salon\OneDrive\Desktop\AI Based Interview Preparation Platform\vite-project"

# 1. build the docker image
Write-Host "Building image..."
docker build -t ai-interview-app:latest .
if ($LASTEXITCODE -ne 0) { throw "Build failed" }

# 2. run container locally (port 5000)
Write-Host "Starting container..."
docker rm -f ai-app 2>$null | Out-Null
docker run -d `
  --name ai-app `
  -p 5000:5000 `
  -e NODE_ENV=production `
  # add more -e lines for any other vars, e.g. -e MONGO_URI="mongodb://..."
  ai-interview-app:latest

Write-Host "Container started; tailing logs (ctrl-c to stop)..."
docker logs -f ai-app &

# ------------------------------------------------------------
# Optional: push to registry (uncomment and edit before using)
# ------------------------------------------------------------
# $registry = "myregistry/ai-interview-app"
# docker tag ai-interview-app:latest "$registry:1.0"
# docker push "$registry:1.0"

# ------------------------------------------------------------
# Optional cleanup helper
# ------------------------------------------------------------
# Write-Host "Stopping container..."
# docker stop ai-app
# docker rm ai-app
