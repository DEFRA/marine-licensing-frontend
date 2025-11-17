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

For latest minimum versions of Node.js and NPM, see the [package.json](./package.json) 'engines'
property.

- [Node.js](http://nodejs.org/)
- [npm](https://nodejs.org/)
- [Docker](https://www.docker.com/)

You may find it easier to manage Node.js versions using a version manager such
as [nvm](https://github.com/creationix/nvm) or [n](https://www.npmjs.com/package/n). From within the
project folder you can then either run `nvm use` or `n auto` to install the required version.

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
