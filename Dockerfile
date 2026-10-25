FROM node:20-alpine
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build" DIRECT_URL="postgresql://build:build@127.0.0.1:5432/build" AUTH_SECRET="build-only-secret-not-used-at-runtime-123456" npm run build
EXPOSE 3200
CMD ["sh","-c","npm run db:deploy && npm run db:seed && npm start -- -p 3200"]
