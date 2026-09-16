# marine-licensing-frontend

[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_marine-licensing-frontend&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=DEFRA_marine-licensing-frontend)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_marine-licensing-frontend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DEFRA_marine-licensing-frontend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_marine-licensing-frontend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=DEFRA_marine-licensing-frontend)

The Marine Licensing Frontend is the start of a GDS-compliant application that will eventually
replace the Marine Case Management System (MCMS). It is under development and currently offers the
ability to create licence exemption notifications.

- [Prerequisites](#prerequisites)
- [Local development](#local-development)
  - [Setup](#setup)
  - [Development](#development)
  - [Dev container](#dev-container)
  - [Production](#production)
  - [Npm scripts](#npm-scripts)
  - [Routes](#routes)
  - [Authentication](#authentication)
  - [Dependency updates](#dependency-updates)
  - [Environment variables](#environment-variables)
- [Server-side caching](#server-side-caching)
- [Docker](#docker)
  - [Development image](#development-image)
  - [Production image](#production-image)
  - [Docker Compose](#docker-compose)
- [SonarCloud](#sonarcloud)
- [Licence](#licence)
  - [About the licence](#about-the-licence)

## Prerequisites

This project targets **Node.js 24** to align with the [CDP Node.js frontend template](https://github.com/DEFRA/cdp-node-frontend-template). The required version is pinned in [.nvmrc](./.nvmrc) (`v24.14.1`); minimum versions are also listed in [package.json](./package.json) `engines`.

- [Node.js](http://nodejs.org/) 24.x
- [npm](https://nodejs.org/) (bundled with Node.js)
- [Docker](https://www.docker.com/)

You may find it easier to manage Node.js versions using a version manager such
as [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm). From within the
project folder run `nvm use` or `fnm use` to select the version in `.nvmrc`.

## Local development

### Setup

Install application dependencies:

```bash
npm install
```

### Development mode

Note - to get all dependent services up you should also run `docker compose up --build -d` in both
this repo and in marine-licensing-backend. Then stop the marine-licensing-frontend container.

To run the application in `development` mode run:

```bash
npm run dev
```

and hit <http://localhost:3000> in your browser. This will
use [Defra ID stub](https://github.com/DEFRA/cdp-defra-id-stub?tab=readme-ov-file#cdp-defra-id-stub)
for login.

If you use the [dev container](#dev-container), follow that section for Defra ID stub and sign-in
setup.

### Dev container

Configuration lives in [.devcontainer/devcontainer.json](./.devcontainer/devcontainer.json). It
uses the Node 24 dev container image, forwards port `9229` for debugging, and enables
[Docker-outside-of-Docker](https://github.com/devcontainers/features/tree/main/src/docker-outside-of-docker)
so `docker` and `docker compose` run against the Docker daemon on your host.

#### Open the dev container

1. Install [Docker](https://www.docker.com/) on your machine and ensure it is running.
2. In VS Code or Cursor, install the **Dev Containers** extension.
3. Open this repository and run **Dev Containers: Reopen in Container**.

On first open (or after config changes), the container runs `npm install`. Each time you attach,
`scripts/devcontainer-stub-proxy.sh` starts if it is not already running.

#### Local development inside the dev container

The recommended workflow matches [Development mode](#development-mode): run dependent services in
Docker on the host, then run the app with Node inside the dev container.

1. Create the Compose network once (if it does not exist):

   ```bash
   docker network create cdp-tenant
   ```

2. Start Redis and the Defra ID stub (do not run the frontend service in Compose):

   ```bash
   docker compose up -d redis-frontend defra-id-stub
   docker stop marine-licensing-frontend-marine-licensing-frontend-1 2>/dev/null || true
   ```

3. Register stub users (required for `npm run dev`; Compose does this automatically for the
   frontend container):

   ```bash
   for f in compose/users/*.json; do
     curl -sS -X POST -H "Content-Type: application/json" -d @"$f" \
       "http://localhost:3200/cdp-defra-id-stub/API/register"
   done
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

   `predev` runs the stub proxy script before the dev server starts. You can also run it manually:

   ```bash
   bash scripts/devcontainer-stub-proxy.sh
   ```

5. Open <http://localhost:3000> in your browser on the host.

Environment variables for OIDC and `APP_BASE_URL` are set in `devcontainer.json`. Override locally
if needed:

```bash
export APP_BASE_URL=http://localhost:3000
export DEFRA_ID_OIDC_CONFIGURATION_URL=http://localhost:3200/cdp-defra-id-stub/.well-known/openid-configuration
```

Use **localhost** for the app and sign-in flow. `compose.yml` sets
`APP_BASE_URL=http://marine-licensing-frontend.local:3000` for the containerised frontend; that
hostname is only needed when running the full Compose stack and adding a matching `/etc/hosts`
entry on your machine.

#### Defra ID stub proxy

Inside the dev container, `localhost:3200` is not the stub running on the host. The stub’s OIDC
metadata also points at `http://localhost:3200`, so the app must reach the host stub via a local
forwarder.

`scripts/devcontainer-stub-proxy.sh` uses `socat` to forward port `3200` inside the dev container to
the host (`host.docker.internal` or `172.17.0.1`).

Check the proxy and stub:

```bash
curl http://127.0.0.1:3200/health   # expect 200
```

Without the proxy, the server may start but sign-in fails with **`ERR_TOO_MANY_REDIRECTS`** on
`/signin` because the OAuth callback never completes.

#### Docker commands from the dev container

`docker build` and `docker compose` use the host daemon. Ensure Docker is running on the host before
running them.

If port `3000` is already in use on the host (for example by `npm run dev` or port forwarding from
the dev container), `docker compose up` for the frontend service will fail to bind. Stop the process
using port `3000`, or run only `redis-frontend` and `defra-id-stub` while developing with
`npm run dev`.

#### Troubleshooting

| Symptom                                       | What to try                                                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ERR_TOO_MANY_REDIRECTS` on `/signin`         | Run `bash scripts/devcontainer-stub-proxy.sh`, confirm `curl http://127.0.0.1:3200/health` returns 200, clear cookies for `localhost`, restart `npm run dev`. |
| `ECONNREFUSED` to `127.0.0.1:3200` on startup | Start stub: `docker compose up -d defra-id-stub`. Run the proxy script.                                                                                       |
| `Cannot connect to the Docker daemon`         | Start Docker on the host. Rebuild the dev container after changing `.devcontainer/devcontainer.json`.                                                         |
| Port `3000` already in use                    | Stop `npm run dev` or the Compose frontend container before starting the other.                                                                               |

### Production

To mimic the application running in `production` mode locally run:

```bash
npm start
```

### Npm scripts

All available Npm scripts can be seen in [package.json](./package.json)
To view them in your command line run:

```bash
npm run
```

### Routes

The routes for this service are defined in [src/server/router.js](./src/server/router.js).

### Authentication

For authentication when running locally, there are 2 options:

#### Defra ID stub

The out-of-the-box config will use
the [cdp-defra-id-stub](https://github.com/DEFRA/cdp-defra-id-stub). If you run this with docker
compose (see section below) you will also get an instance of Redis, which can be used for session
caching.

#### Real Defra ID and Entra ID

To properly use features like organisation switching, you will need to use real Defra ID (not the
stub) and Entra ID.

All pages are authenticated with Defra ID, except the view exemption details page for Dynamics 365
users, which is authenticated with Entra ID.

To set this up and run it, [instructions are here](./local-https-setup/README.md)

### Environment variables

For most local development, you shouldn't need to override any of the env var defaults that are
in [config.js](./src/config/config.js).

## The deployed app

[Dev environment](https://marine-licensing-frontend.dev.cdp-int.defra.cloud/) - login uses Defra ID
stub

The other environments use real Defra ID and Entra ID for login:
[Test environment](https://marine-licensing-frontend.test.cdp-int.defra.cloud)
[Perf-test environment](https://marine-licensing-frontend.perf-test.cdp-int.defra.cloud)
[Production environment](https://marine-licensing-frontend.prod.cdp-int.defra.cloud/)

Those links and all the tools to deploy, view logs etc are on
the [Core Delivery Platform page](https://portal.cdp-int.defra.cloud/services/marine-licensing-frontend)

## Server-side caching

We use Catbox for server-side caching. By default the service will use CatboxRedis when deployed and
CatboxMemory for
local development. You can override the default behaviour by setting the `SESSION_CACHE_ENGINE`
environment variable to either `redis` or `memory`.

Please note: CatboxMemory (`memory`) is _not_ suitable for production use! The cache will not be
shared between each instance of the service and it will not persist between restarts.

## Docker

Ensure you have run `npm install` before running any Docker commands.

### Development image

Build:

```bash
docker build --target development --no-cache --tag marine-licensing-frontend:development .
```

Run:

```bash
docker run -p 3000:3000 marine-licensing-frontend:development
```

### Production image

Build:

```bash
docker build --no-cache --tag marine-licensing-frontend .
```

Run:

```bash
docker run -p 3000:3000 marine-licensing-frontend
```

### Docker Compose

A local environment with:

- Localstack for AWS services (S3, SQS)
- Redis
- MongoDB
- This service
- A commented out backend example

```bash
docker compose up --build -d
```

## SonarCloud

Instructions for setting up SonarCloud can be found
in [sonar-project.properties](./sonar-project.properties).

## Dependency updates

Dependabot automatically creates pull requests to update dependencies.

## Releases

### [8.0.0](https://eaflood.atlassian.net/projects/ML/versions/40904/tab/release-report-all-issues)

Details available on the release version ticket

### [7.0.0](https://eaflood.atlassian.net/projects/ML/versions/36894/tab/release-report-all-issues)

Details available on the release version ticket

### [6.0.0](https://eaflood.atlassian.net/projects/ML/versions/33941/tab/release-report-all-issues)

Details are available on the release version ticket

### [5.0.0](https://eaflood.atlassian.net/projects/ML/versions/32612/tab/release-report-all-issues)

Details available on the release version ticket

### [4.0.0](https://eaflood.atlassian.net/projects/ML/versions/29700/tab/release-report-all-issues)

Details available on the release version ticket

### [3.0.0](https://eaflood.atlassian.net/projects/ML/versions/29059/tab/release-report-all-issues)

Details available on the release version ticket

### [2.0.0](https://eaflood.atlassian.net/projects/ML/versions/23737/tab/release-report-all-issues)

Release of marine licensing frontend application that would be accessible by the public. The link lists all the features within the application

### [1.0.0](https://eaflood.atlassian.net/projects/ML/versions/23736/tab/release-report-all-issues)

Initial release of the marine licensing frontend application but wont be used by public.

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this
information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery
Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under
a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few
conditions.
