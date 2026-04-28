FROM node:20-alpine AS base
WORKDIR /app
ENV CI=true

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci

FROM base AS backend-build
COPY . .
RUN npm run build --workspace=backend

FROM base AS frontend-build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}

COPY . .
RUN npm run build --workspace=frontend

FROM node:20-alpine AS backend-run
WORKDIR /app
ENV NODE_ENV=development
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=backend-build /app/backend ./backend
WORKDIR /app/backend
EXPOSE 3001
CMD ["node", "dist/main"]

FROM node:20-alpine AS frontend-run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=frontend-build /app/node_modules ./node_modules
COPY --from=frontend-build /app/frontend ./frontend
WORKDIR /app/frontend
EXPOSE 3000
CMD ["npm", "run", "start", "--", "-p", "3000"]