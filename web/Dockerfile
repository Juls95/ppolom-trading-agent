FROM node:20-slim AS base
WORKDIR /app

# NEXT_PUBLIC_* must be present at build time (inlined into client bundle)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_ENGINE_URL
ARG NEXT_PUBLIC_ENGINE_WS
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_ENGINE_URL=$NEXT_PUBLIC_ENGINE_URL
ENV NEXT_PUBLIC_ENGINE_WS=$NEXT_PUBLIC_ENGINE_WS

COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable && pnpm install --frozen-lockfile=false
COPY . .
RUN pnpm build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
