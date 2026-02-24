FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/main.go .
COPY --from=frontend /app/dist ./dist
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /usr/local/bin/ecological-nlp-hub ./main.go

FROM gcr.io/distroless/static
COPY --from=builder /usr/local/bin/ecological-nlp-hub /usr/local/bin/ecological-nlp-hub
COPY --from=builder /app/dist /app/dist
EXPOSE 49152
ENTRYPOINT ["/usr/local/bin/ecological-nlp-hub"]
