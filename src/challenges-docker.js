// Docker Drills — challenges for devs who already know `docker run`
// Focus: production patterns, compilation, layer-fu, signal hygiene, compose lifecycle

var dockerChallenges = [
  // ─── DOCKERFILE: MULTI-STAGE BUILD ─────────────────────────────────
  {
    id: 'multi-stage-go',
    area: 'Dockerfile',
    title: 'Multi-stage Build — Go binary',
    difficulty: '★★☆',
    description: `Build a Go app in one stage, copy the binary into a distroless image.
Rules:
- Stage 1: golang:1.22-alpine as "builder"
- Stage 2: gcr.io/distroless/base-debian12 as final
- Binary must be compiled with CGO_ENABLED=0 GOOS=linux
- Final image must NOT contain a package manager or shell`,
    starterCode: `FROM golang:1.22-alpine AS builder
WORKDIR /app
# write the Dockerfile`,
    solutionCheck(code) {
      const errors = [];
      const lines = code.split('\n').filter(l => l.trim());
      const upper = code.toUpperCase();

      if (!lines.some(l => /FROM\s+golang/i.test(l) && /AS\s+builder/i.test(l)))
        errors.push('Stage 1 must use "FROM golang:1.22-alpine AS builder"');
      if (!lines.some(l => /FROM\s+gcr\.io\/distroless/i.test(l)))
        errors.push('Final stage must use distroless base image');
      if (!lines.some(l => /COPY\s+--from=builder/i.test(l)))
        errors.push('Need COPY --from=builder to copy the compiled binary');
      if (lines.some(l => /apk\s+add|apt-get|yum\s+install/i.test(l) && l.trimLeft().startsWith('RUN')))
        errors.push('Final image must not install packages — use distroless');
      if (lines.some(l => /GOOS=linux/i.test(l) || /CGO_ENABLED=0/i.test(l)))
        ; // good
      else
        errors.push('Set CGO_ENABLED=0 and GOOS=linux for a static binary');
      if (errors.length === 3 && !code.includes('CGO_ENABLED=0'))
        errors.push('Set CGO_ENABLED=0');

      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Multi-stage build is correct. distroless, static binary, clean layering.' };
    },
  },

  // ─── DOCKERFILE: LAYER OPTIMIZATION ─────────────────────────────────
  {
    id: 'layer-cache',
    area: 'Dockerfile',
    title: 'Layer Cache Busting',
    difficulty: '★★☆',
    description: `Re-order this Dockerfile so dependency install gets cached independently of source changes.
The Dockerfile installs npm deps then copies source — but any source change busts the node_modules layer.
Fix by copying package.json first, running npm install, then copying the rest.`,
    starterCode: `FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci --omit=dev
CMD ["node", "dist/index.js"]`,
    solutionCheck(code) {
      const errors = [];
      const lines = code.split('\n').filter(l => l.trim());
      const copyPkgIdx = lines.findIndex(l => /COPY\s/.test(l) && /package\.json/i.test(l));
      const copyAllIdx = lines.findIndex(l => /COPY\s+\.\s+\./.test(l) || /COPY\s+\.\s+\/app/i.test(l));
      const npmIdx = lines.findIndex(l => /RUN\s+npm\s+(ci|install)/i.test(l));

      if (copyPkgIdx === -1)
        errors.push('Copy package.json (or package.json package-lock.json) BEFORE running npm install');
      else if (copyAllIdx !== -1 && npmIdx !== -1 && copyAllIdx < npmIdx)
        errors.push('COPY . . comes before npm install — a source change busts the npm cache');
      if (copyPkgIdx > npmIdx)
        errors.push('npm install runs before package.json is copied!');
      if (code.includes('npm ci') && !code.includes('package-lock.json'))
        errors.push('npm ci requires package-lock.json in the COPY');
      if (!code.includes('npm ci') && !code.includes('npm install'))
        errors.push('No dependency install step found');

      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Layer caching structured correctly: deps only reinstall when package.json changes.' };
    },
  },

  // ─── DOCKERFILE: NON-ROOT USER ─────────────────────────────────────
  {
    id: 'nonroot',
    area: 'Dockerfile',
    title: 'Drop Root — Non-root User',
    difficulty: '★★☆',
    description: `Create a non-root user, chown the working directory, and switch to it.
Production containers should NEVER run as root.
- Create user "appuser" with uid 1001 (no home dir, no shell)
- Ensure /app is owned by appuser
- Switch to appuser before CMD`,
    starterCode: `FROM node:20-alpine
WORKDIR /app
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev
COPY --chown=node:node . .
EXPOSE 3000
CMD ["node", "server.js"]`,
    solutionCheck(code) {
      const errors = [];
      const upper = code.toUpperCase();

      if (upper.includes('USER APPUSER') || upper.includes('USER 1001')) {
        // check it's created
        if (!code.includes('useradd') && !code.includes('adduser'))
          errors.push('Must create appuser with adduser before USER directive');
      } else {
        errors.push('Must switch to a non-root user (USER appuser or USER 1001)');
      }

      if (!code.includes('chown') && !code.includes('--chown'))
        errors.push('Working directory files should be owned by appuser');

      if (code.includes('USER root') || code.includes('USER 0'))
        errors.push('Do not switch back to root after creating the user');

      if (!code.includes('appuser') && !code.includes('1001'))
        errors.push('Create user "appuser" with uid 1001');

      if (code.includes('USER node'))
        errors.push('Use appuser (uid 1001), not the default node user — explicit uid is better for production');

      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Non-root user configured. appuser (1001), chowned, dropped root.' };
    },
  },

  // ─── DOCKERFILE: HEALTHCHECK ───────────────────────────────────────
  {
    id: 'healthcheck',
    area: 'Dockerfile',
    title: 'Production-grade HEALTHCHECK',
    difficulty: '★★☆',
    description: `Add a HEALTHCHECK that actually works in production.
Rules:
- Must use curl or wget against a specific endpoint
- Set retries, interval, timeout, start-period
- Must handle the case where curl is not in the image (install it in a single RUN then rm)
- start-period must account for app boot time`,
    starterCode: `FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]`,
    solutionCheck(code) {
      const errors = [];
      const lines = code.split('\n').filter(l => l.trim());

      const hcIdx = lines.findIndex(l => /HEALTHCHECK/i.test(l));
      if (hcIdx === -1) return { pass: false, message: 'No HEALTHCHECK directive found.' };

      const hc = lines.slice(hcIdx).join(' ');

      if (!/curl|wget/i.test(hc))
        errors.push('HEALTHCHECK must use curl or wget against an endpoint');
      if (!/--retry/i.test(hc) && !/retries/i.test(hc))
        errors.push('Set retries (e.g. --retries=3 or --retries 3)');
      if (!/--interval/i.test(hc) && !/interval/i.test(hc))
        errors.push('Set an interval (e.g. --interval=30s)');
      if (!/--timeout/i.test(hc) && !/timeout/i.test(hc))
        errors.push('Set a timeout (e.g. --timeout=10s)');
      if (!/--start-period/i.test(hc) && !/start-period/i.test(hc))
        errors.push('Set a start-period (e.g. --start-period=40s — accounts for boot time)');

      // Check it uses a specific path, not just localhost:3000
      if (!/\/(health|ready|status|ping|livez|readyz)/i.test(hc))
        errors.push('Hit a specific endpoint like /health or /ready, not just localhost:3000');

      return { pass: errors.length === 0, message: errors.join('\n') || '✓ HEALTHCHECK configured: retries, interval, timeout, start-period, specific endpoint.' };
    },
  },

  // ─── DOCKERFILE: BUILDKIT CACHE MOUNTS ─────────────────────────────
  {
    id: 'buildkit-cache',
    area: 'Dockerfile',
    title: 'BuildKit Cache Mounts',
    difficulty: '★★★',
    description: `Speed up repetitive builds with BuildKit cache mounts.
Rewrite the npm install step to use --mount=type=cache for both:
- /root/.npm (npm cache directory)
- /app/node_modules (or the install target)
Must use npm ci, not npm install, and set --prefer-offline.`,
    starterCode: `FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["node", "server.js"]`,
    solutionCheck(code) {
      const errors = [];
      const lines = code.split('\n').filter(l => l.trim());

      const hasCache = lines.some(l => /--mount=type=cache/i.test(l));
      if (!hasCache) return { pass: false, message: 'No BuildKit cache mounts. Add --mount=type=cache to the RUN command.' };

      const hasNpmCache = lines.some(l => /--mount=type=cache.*\/root\/\.npm/i.test(l) || /--mount=type=cache.*npm/i.test(l));
      if (!hasNpmCache) errors.push('Mount cache for /root/.npm so npm downloads are cached across builds');

      const hasTarget = lines.some(l => /--mount=type=cache.*node_modules/i.test(l) || /--mount=type=cache.*\/app/i.test(l));
      if (!hasTarget) errors.push('Mount cache for the node_modules target dir');

      // Check the RUN line ordering — cache mounts go before the command
      const runLines = lines.filter(l => /RUN/.test(l));
      for (const rl of runLines) {
        const beforeMount = rl.split('--mount')[0];
        if (beforeMount.trim() === 'RUN' || beforeMount.trim() === 'RUN \\') continue;
        if (!rl.includes('--mount'))
          errors.push('Any RUN with cache mounts: mount directives must come before the shell command');
      }

      if (!code.includes('npm ci')) errors.push('Use npm ci (not npm install) for reproducible builds');
      if (!code.includes('--prefer-offline')) errors.push('Add --prefer-offline to avoid network lookups when cache is warm');

      return { pass: errors.length === 0, message: errors.join('\n') || '✓ BuildKit cache mounts for npm cache + node_modules. Builds are ~10x faster on re-run.' };
    },
  },

  // ─── DOCKERFILE: GRACEFUL SHUTDOWN ─────────────────────────────────
  {
    id: 'graceful-shutdown',
    area: 'Dockerfile',
    title: 'Graceful Shutdown — SIGTERM Hygiene',
    difficulty: '★★★',
    description: `Default CMD ["node", "server.js"] uses shell form wrapping which orphans the process.
Fix by:
1. Using exec form for CMD (already done — good)
2. Adding a signal handler in app code (documented via comment in the Dockerfile)
3. Setting STOPSIGNAL to SIGTERM explicitly
4. Adding a HEALTHCHECK that returns non-zero during shutdown for orchestrated draining

Write a Dockerfile with proper signal handling documentation.`,
    starterCode: `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
CMD ["node", "server.js"]`,
    solutionCheck(code) {
      const errors = [];
      const lines = code.split('\n').filter(l => l.trim());

      if (!code.includes('CMD ["node'))
        errors.push('CMD must use exec form: CMD ["node", "server.js"] — shell form wraps the process as pid 1');

      if (!lines.some(l => /STOPSIGNAL/i.test(l)))
        errors.push('Set STOPSIGNAL SIGTERM explicitly in the Dockerfile');

      if (!lines.some(l => /SIGTERM|SIGINT|signal|shutdown|drain/i.test(l) && /#|comment|\/\//i.test(l)))
        errors.push('Document signal handling — add a comment noting the app must trap SIGTERM for graceful shutdown');

      if (lines.some(l => /^CMD\s+node/i.test(l) && !l.startsWith('CMD [')))
        errors.push('CMD node ... is shell form. Use CMD ["node", "server.js"] exec form so signals reach the app');

      if (code.includes('tini') || code.includes('dumb-init'))
        ; // bonus: using an init system
      else
        errors.push('(Optional but recommended) Add tini or dumb-init as init for proper signal forwarding to subprocesses');

      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Signal hygiene: exec form, STOPSIGNAL, documented signal handling.' };
    },
  },

  // ─── COMPOSE: INIT CONTAINER ───────────────────────────────────────
  {
    id: 'compose-init',
    area: 'docker-compose.yml',
    title: 'Init Container — DB Migrations',
    difficulty: '★★☆',
    description: `docker-compose pattern: a migration container that runs before the app starts.
Requirements:
- Service "migrate" that runs db migrations, then exits
- Service "app" that depends_on migrate with condition: service_completed_successfully
- Both use the same image but different commands
- migrate is not exposed on any port
- migrate and app share a network with db`,
    starterCode: `services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 5`,
    solutionCheck(code) {
      const errors = [];
      const lower = code.toLowerCase();

      if (!lower.includes('migrate'))
        return { pass: false, message: 'No "migrate" service defined.' };
      if (!lower.includes('app'))
        return { pass: false, message: 'No "app" service defined.' };

      // Find migrate block
      const m = code.match(/migrate:\s*\n([\s\S]*?)(?=\n\s+\w+:|$)/i);
      if (m) {
        const b = m[1];
        if (!b.includes('command') && !b.includes('entrypoint'))
          errors.push('migrate must have a command (e.g. command: npx prisma migrate deploy)');
        if (b.includes('ports:'))
          errors.push('migrate must not expose ports — it exits immediately');
      }

      // Find app block for depends_on
      const a = code.match(/^\s+app:\s*\n([\s\S]*?)(?=\n\s+\w+:|$)/im);
      if (a) {
        const b = a[1];
        if (!b.includes('depends_on'))
          errors.push('app must have depends_on');
        if (!b.includes('service_completed_successfully'))
          errors.push('app must depend on migrate with condition: service_completed_successfully');
        if (!b.includes('migrate'))
          errors.push('depends_on must reference the migrate service');
      }

      // Check they share a network
      if (!code.includes('networks:'))
        errors.push('Both services should share a custom network');

      if (!lower.includes('condition:') || !lower.includes('service_completed_successfully'))
        errors.push('Use "condition: service_completed_successfully" so the app waits for migrations to finish');

      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Init container pattern: migrate runs first, app waits for its successful exit.' };
    },
  },

  // ─── COMPOSE: NETWORK ISOLATION ────────────────────────────────────
  {
    id: 'compose-network',
    area: 'docker-compose.yml',
    title: 'Network Isolation — Frontend / Backend / DB',
    difficulty: '★★★',
    description: `Three-tier network isolation:
- frontend → backend network only (frontend cannot reach db)
- backend → db network only (backend can reach db)
- frontend-network: publicly accessible
- backend-network: internal only (no external access)
- db: no ports published to host at all

Write the docker-compose.yml with proper network segmentation.`,
    starterCode: `services:
  frontend:
    image: nginx:alpine
    ports:
      - "80:80"

  api:
    image: myapp-api:latest
    environment:
      DATABASE_URL: postgres://app:secret@db:5432/myapp

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_PASSWORD: secret`,
    solutionCheck(code) {
      const errors = [];
      const lower = code.toLowerCase();

      // Must have two networks
      if (!code.includes('frontend-network') && !code.includes('frontend_net'))
        errors.push('Define a frontend-network for public-facing services');
      if (!code.includes('backend-network') && !code.includes('backend_net') && !code.includes('internal'))
        errors.push('Define a backend/internal network for backend-db communication');

      // Frontend should NOT have backend network
      const feMatch = code.match(/^\s+frontend:\s*\n([\s\S]*?)(?=\n\s+\w+:|$)/im);
      if (feMatch) {
        const b = feMatch[1];
        if (b.includes('backend') || b.includes('internal'))
          errors.push('frontend must not be on the backend network');
        if (!b.includes('frontend-network') && !b.includes('frontend_net'))
          errors.push('frontend must be on frontend-network');
      }

      const apiMatch = code.match(/^\s+api:\s*\n([\s\S]*?)(?=\n\s+\w+:|$)/im);
      if (apiMatch) {
        const b = apiMatch[1];
        if (!b.includes('backend-network') && !b.includes('backend_net') && !b.includes('internal'))
          errors.push('api/backend must be on the backend network');
        if (!b.includes('frontend-network') && !b.includes('frontend_net'))
          errors.push('api/backend must also be on the frontend-network');
      }

      const dbMatch = code.match(/^\s+db:\s*\n([\s\S]*?)(?=\n\s+\w+:|$)/im);
      if (dbMatch) {
        const b = dbMatch[1];
        if (b.includes('ports:'))
          errors.push('db must not publish ports to the host — only accessible via backend network');
        if (!b.includes('backend-network') && !b.includes('backend_net') && !b.includes('internal'))
          errors.push('db must be on the backend network only');
        if (b.includes('frontend-network') || b.includes('frontend_net'))
          errors.push('db must NOT be on the frontend network');
      }

      // Network definition must mark backend as internal
      if (!lower.includes('internal: true') && !lower.includes('internal:  true'))
        errors.push('Backend/internal network must be marked as internal: true so it cannot be reached from the host');

      // Network drivers
      if (!code.includes('networks:') && !code.includes('network:'))
        errors.push('Define networks at the top level with driver: bridge');

      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Network isolation: frontend→api→db with proper segmentation and internal network.' };
    },
  },

  // ─── COMPOSE: PROFILES ─────────────────────────────────────────────
  {
    id: 'compose-profiles',
    area: 'docker-compose.yml',
    title: 'Docker Compose Profiles',
    difficulty: '★★★',
    description: `Set up profiles so you can run different service compositions:
- "dev" profile: app + db + adminer (DB browser)
- "ci" profile: app + db (no adminer, no extra services)
- "prod" profile: app + db (with restart: always, no ports on db)
- Profile-less services that always run: traefik or nginx reverse proxy

Use YAML anchors (&) to avoid duplicating app/db config across profiles.`,
    starterCode: `services:
  app:
    image: myapp:latest
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgres://app:secret@db:5432/myapp

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_PASSWORD: secret
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]`,
    solutionCheck(code) {
      const errors = [];
      const lower = code.toLowerCase();

      // Must have profiles
      if (!lower.includes('profiles:')) errors.push('Use profiles: to distinguish dev/ci/prod');

      // Check each service has profiles
      const services = code.match(/^\s+\w+:\s*$/gm) || [];

      for (const svc of services) {
        const name = svc.trim().replace(':', '');
        if (name === 'services' || name === 'volumes' || name === 'networks' || name === 'x-') continue;

        const svcBlock = code.match(new RegExp(`^\\s+${name}:\\s*\\n([\\s\\S]*?)(?=\\n\\s+\\w+:|$)`, 'im'));
        if (!svcBlock) continue;

        const b = svcBlock[1];
        if (name === 'adminer' && (!b.includes('profiles:') || b.includes('profile: dev') || b.includes("profile: 'dev'"))) {
          // adminer is only dev
          if (!b.includes('profiles:') || !b.includes('dev'))
            errors.push('adminer should only be in the dev profile');
        }
        if (name === 'app' || name === 'db') {
          if (!b.includes('profiles:') || (!b.includes('dev') && !b.includes('ci') && !b.includes('prod')))
            errors.push(`${name} should list all relevant profiles`);
        }
      }

      // Check for YAML anchors deduplication
      if (!code.includes('&') || !code.includes('<<: *'))
        errors.push('Use YAML anchors (&app_defaults, &db_defaults) and <<: * merge to avoid repeating config');

      if (!code.includes('restart: always') && !code.includes('restart: unless-stopped'))
        errors.push('prod/ci profile should specify restart policy');

      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Profiles: dev/ci/prod with YAML anchors, adminer gated to dev only.' };
    },
  },

  // ─── COMPOSE: SECRETS ──────────────────────────────────────────────
  {
    id: 'compose-secrets',
    area: 'docker-compose.yml',
    title: 'Docker Secrets — No ENV for Secrets',
    difficulty: '★★☆',
    description: `Never put secrets in environment variables — use Docker secrets.
Requirements:
- Define secrets in the top-level secrets: block
- Mount secrets to /run/secrets/ in the app service
- App reads secrets from files at runtime (document with comment)
- Do NOT use environment: for the API key or DB password
- One file-based secret: db_password.txt, one external secret: api_key

Note: secrets require Docker Swarm or Compose v3.8+. Use "external: true" for api_key.
Use file: for db_password.`,
    starterCode: `services:
  app:
    image: myapp:latest
    environment:
      - DATABASE_URL=postgres://app:secret@db:5432/myapp
      - API_KEY=sk-abc123`,
    solutionCheck(code) {
      const errors = [];

      if (!code.includes('secrets:'))
        return { pass: false, message: 'No top-level secrets: block defined.' };

      if (!code.includes('file:'))
        errors.push('Use file: to load db_password from a file');

      if (!code.includes('external: true'))
        errors.push('Mark api_key as external: true (injected by orchestration)');

      // Check app service has secrets: section (not environment)
      const appBlock = code.match(/^\s+app:\s*\n([\s\S]*?)(?=\n\s+\w+:|$)/im);
      if (appBlock) {
        const b = appBlock[1];
        if (!b.includes('secrets:'))
          errors.push('app service must have a secrets: section');
        // Check environment doesn't contain raw secrets
        if (b.includes('API_KEY') || b.includes('DATABASE_URL'))
          errors.push('Remove secrets from environment: — use secrets: and read from /run/secrets/');
      }

      // Check for secrets mount syntax
      if (!code.includes('source:') && !code.includes('source: '))
        errors.push('Use source:/target: syntax or the short form for secret mounts');

      if (!code.includes('/run/secrets/') && !code.includes('target:'))
        errors.push('Mount secrets with a target path (target: /run/secrets/db_password)');

      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Secrets managed via Docker secrets: file-based + external, never in env vars.' };
    },
  },

  // ─── COMPOSE: depends_on WITH HEALTHCHECK ──────────────────────────
  {
    id: 'compose-depends-health',
    area: 'docker-compose.yml',
    title: 'depends_on with Health Conditions',
    difficulty: '★★☆',
    description: `Basic but often wrong: app should wait for db to be HEALTHY, not just "started".
Rules:
- db: has a healthcheck
- app: depends_on db with condition: service_healthy
- app: reads db host from env
- Both on the same network`,
    starterCode: `services:
  app:
    image: myapp:latest
    environment:
      DATABASE_URL: postgres://app:secret@db:5432/myapp

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_PASSWORD: secret`,
    solutionCheck(code) {
      const errors = [];

      const dbBlock = code.match(/^\s+db:\s*\n([\s\S]*?)(?=\n\s+\w+:|$)/im);
      if (dbBlock) {
        const b = dbBlock[1];
        if (!b.includes('healthcheck:'))
          errors.push('db must have a healthcheck (e.g. pg_isready)');
      }

      const appBlock = code.match(/^\s+app:\s*\n([\s\S]*?)(?=\n\s+\w+:|$)/im);
      if (appBlock) {
        const b = appBlock[1];
        if (!b.includes('depends_on'))
          return { pass: false, message: 'No depends_on in app service.' };
        if (!b.includes('service_healthy'))
          errors.push('condition must be service_healthy, not service_started');
      }

      if (!code.includes('networks:'))
        errors.push('Define a shared network');

      return { pass: errors.length === 0, message: errors.join('\n') || '✓ depends_on with service_healthy condition — app waits for db to be truly ready.' };
    },
  },

  // ─── DOCKERFILE: ROOTLESS DIND ────────────────────────────────────
  {
    id: 'rootless-dind',
    area: 'Dockerfile',
    title: 'Rootless Docker-in-Docker',
    difficulty: '★★★',
    description: `Build a CI runner image that can run Docker inside a container without root.
- Use docker:28-dind-rootless as base
- Add non-root user "ciuser" (uid 1000)
- Ensure /var/run/docker.sock has correct permissions
- Set DOCKER_HOST to the rootless socket
- Entrypoint starts dockerd-rootless.sh

No root, no privileged mode needed.`,
    starterCode: `FROM docker:28-dind-rootless

# write the Dockerfile`,
    solutionCheck(code) {
      const errors = [];

      if (!code.includes('docker:28-dind-rootless') && !code.includes('docker:dind-rootless'))
        errors.push('Base image should be docker:28-dind-rootless');

      if (!code.includes('ciuser') && !code.includes('1000'))
        errors.push('Create a non-root user (ciuser, uid 1000)');

      if (!code.includes('DOCKER_HOST'))
        errors.push('Set DOCKER_HOST to the rootless socket path');

      if (!code.includes('ENTRYPOINT') && !code.includes('CMD'))
        errors.push('Set ENTRYPOINT or CMD to start dockerd-rootless.sh (or entrypoint.sh)');

      // Check for common dind socket path
      if (!code.includes('docker\/run') && !code.includes('docker.sock'))
        errors.push('Reference the rootless Docker socket (typically /run/user/1001/docker.sock or /run/docker.sock)');

      if (code.includes('USER root'))
        errors.push('Don\'t switch to root — the whole point is rootless');

      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Rootless DinD: ciuser, DOCKER_HOST set, no privileged mode needed.' };
    },
  },

  // ─── COMPOSE: VOLUME USER ID MAPPING ──────────────────────────────
  {
    id: 'volume-uid',
    area: 'docker-compose.yml',
    title: 'Volume UID/GID Mapping',
    difficulty: '★★★',
    description: `When you mount a host volume, the container user's uid (usually 1000) must match the host user's uid.
This compose mounts a local ./data dir into the container.
- Set USER_UID and USER_GID as build args
- The container creates a user matching those IDs
- The mounted volume is writable by that user
- Use an .env file for USER_UID=1000 USER_GID=1000

Tip: use user: "\${USER_UID:-1000}:\${USER_GID:-1000}" in compose.`,
    starterCode: `services:
  app:
    build:
      context: .
    volumes:
      - ./data:/app/data
    image: myapp:latest`,
    solutionCheck(code) {
      const errors = [];

      if (!code.includes('USER_UID') && !code.includes('user:'))
        errors.push('Specify the runtime user with user: "${USER_UID:-1000}:${USER_GID:-1000}"');

      if (!code.includes('.env'))
        errors.push('Reference an .env file for USER_UID/USER_GID (the compose file should document this)');

      if (!code.includes('args:'))
        errors.push('Pass USER_UID and USER_GID as build args to create the user at build time');

      // Check the user directive
      if (!code.includes('user:') && !code.includes('user: '))
        errors.push('Add user: "${USER_UID:-1000}:${USER_GID:-1000}" to the app service');

      // ensure no uid mismatch
      if (code.includes('user: root') || code.includes('user: "0"'))
        errors.push('Do NOT run as root. Map the runtime user to match the host uid.');

      return { pass: errors.length === 0, message: errors.join('\n') || '✓ UID/GID mapped via user: directive and build args. Host volume permissions work correctly.' };
    },
  },

  // ─── DOCKERFILE: LINT & VULN CHECK MULTI-STAGE ────────────────────
  {
    id: 'multi-stage-lint',
    area: 'Dockerfile',
    title: 'Multi-stage Lint + Build + Scan',
    difficulty: '★★★',
    description: `Three-stage Dockerfile:
1. lint — run linter, throw if errors
2. build — compile the app with production deps only
3. release — distroless with the binary + a trivy/clair scan step

This ensures the CI pipeline is embedded in the Dockerfile itself.
Use hadolint or eslint for linting, trivy for scanning.`,
    starterCode: `FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS build
COPY . .
RUN npm run build

# release stage — write it`,
    solutionCheck(code) {
      const errors = [];
      const lines = code.split('\n').filter(l => l.trim());

      if (!lines.some(l => /AS\s+lint/i.test(l) || /AS\s+linter/i.test(l)))
        errors.push('Add a lint stage: FROM base AS lint');

      const lintStage = code.match(/AS\s+lint[\s\S]*?(?=FROM\s)/i);
      if (lintStage && !lintStage[0].includes('eslint') && !lintStage[0].includes('hadolint'))
        errors.push('Lint stage must run a linter (e.g. npx eslint . or hadolint)');

      if (!lines.some(l => /AS\s+release/i.test(l) || /AS\s+final/i.test(l)))
        errors.push('Add a release stage with distroless base');

      // release stage should have trivy or scan
      const releaseMatch = code.match(/AS\s+(release|final)[\s\S]*/i);
      if (releaseMatch) {
        const r = releaseMatch[0];
        if (!r.includes('trivy') && !r.includes('clair') && !r.includes('snyk') && !r.includes('grype'))
          errors.push('Release stage should include a vulnerability scan (e.g. trivy filesystem --severity HIGH /app)');
      }

      if (lines.some(l => /apk\s+add|apt-get/i.test(l) && l.trimLeft().startsWith('RUN')))
        errors.push('Release stage should be distroless — no package manager');

      if (!code.includes('COPY --from=build') && !code.includes('COPY --from=lint'))
        errors.push('Release must COPY --from=build the compiled output');

      return { pass: errors.length === 0, message: errors.join('\n') || '✓ Three-stage: lint → build → release+scan. CI embedded in Dockerfile.' };
    },
  },
];

export default dockerChallenges;
