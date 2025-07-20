# Build the Go Agent for CoreControl
FROM golang:1.21-alpine AS build

# Set the working directory
WORKDIR /app

# Copy go.mod and go.sum
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o agent ./cmd/agent

# Production image
FROM alpine:latest

# Install ca-certificates for SSL
RUN apk --no-cache add ca-certificates

# Set the working directory
WORKDIR /root/

# Copy the binary from the build stage
COPY --from=build /app/agent .

# Expose port (if needed)
EXPOSE 8080

# Command to run the agent
CMD ["./agent"]

# For building the multi-platform image locally (if needed):
# docker buildx build --platform linux/amd64,linux/arm64 \
#   -t haedlessdev/serverdash-agent:1.0.0 \
#   -t haedlessdev/serverdash-agent:latest \
#   --push .