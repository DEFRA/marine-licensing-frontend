# marine-licensing-frontend

[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_marine-licensing-frontend&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=DEFRA_marine-licensing-frontend)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_marine-licensing-frontend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DEFRA_marine-licensing-frontend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_marine-licensing-frontend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=DEFRA_marine-licensing-frontend)

Core delivery platform Node.js Frontend Template.

- [Requirements](#requirements)
  - [Node.js](#nodejs)
- [Server-side Caching](#server-side-caching)
- [Redis](#redis)
- [Local Development](#local-development)
  - [Setup](#setup)
  - [Development](#development)
  - [Production](#production)
  - [Npm scripts](#npm-scripts)
  - [Update dependencies](#update-dependencies)
  - [Code Analysis with Knip](#code-analysis-with-knip)
  - [Mutation Testing](#mutation-testing)
  - [Formatting](#formatting)
    - [Windows prettier issue](#windows-prettier-issue)
- [Docker](#docker)
  - [Development image](#development-image)
  - [Production image](#production-image)
  - [Docker Compose](#docker-compose)
  - [Dependabot](#dependabot)
  - [SonarCloud](#sonarcloud)
- [Licence](#licence)
  - [About the licence](#about-the-licence)

## Requirements

### Node.js

Please install [Node.js](http://nodejs.org/) `>= v18` and [npm](https://nodejs.org/) `>= v9`. You will find it
easier to use the Node Version Manager [nvm](https://github.com/creationix/nvm)

To use the correct version of Node.js for this application, via nvm:

```bash
cd marine-licensing-frontend
nvm use
```

## Server-side Caching

We use Catbox for server-side caching. By default the service will use CatboxRedis when deployed and CatboxMemory for
local development.
You can override the default behaviour by setting the `SESSION_CACHE_ENGINE` environment variable to either `redis` or
`memory`.

Please note: CatboxMemory (`memory`) is _not_ suitable for production use! The cache will not be shared between each
instance of the service and it will not persist between restarts.

## Redis

Redis is an in-memory key-value store. Every instance of a service has access to the same Redis key-value store similar
to how services might have a database (or MongoDB). All frontend services are given access to a namespaced prefixed that
matches the service name. e.g. `my-service` will have access to everything in Redis that is prefixed with `my-service`.

If your service does not require a session cache to be shared between instances or if you don't require Redis, you can
disable setting `SESSION_CACHE_ENGINE=false` or changing the default value in `~/src/config/index.js`.

## Proxy

We are using forward-proxy which is set up by default. To make use of this: `import { fetch } from 'undici'` then because of the `setGlobalDispatcher(new ProxyAgent(proxyUrl))` calls will use the ProxyAgent Dispatcher

If you are not using Wreck, Axios or Undici or a similar http that uses `Request`. Then you may have to provide the proxy dispatcher:

To add the dispatcher to your own client:

```javascript
import { ProxyAgent } from 'undici'

return await fetch(url, {
  dispatcher: new ProxyAgent({
    uri: proxyUrl,
    keepAliveTimeout: 10,
    keepAliveMaxTimeout: 10
  })
})
```

## Local Development

### Setup

Install application dependencies:

```bash
npm install
```

### Development

To run the application in `development` mode run:

```bash
npm run dev
```

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

### Update dependencies

To update dependencies use [npm-check-updates](https://github.com/raineorshine/npm-check-updates):

> The following script is a good start. Check out all the options on
> the [npm-check-updates](https://github.com/raineorshine/npm-check-updates)

```bash
ncu --interactive --format group
```

### Code Analysis with Knip

We use [Knip](https://knip.dev/) to find and remove unused dependencies, exports, and files in the codebase. Knip helps keep projects clean by identifying dead code, unused dependencies, and unreferenced files.

To run knip:

```bash
npm run knip
```

Knip analyses the entire project and reports:

- Unused dependencies in `package.json`
- Unused exports that aren't imported anywhere
- Unreferenced files that aren't used
- Missing dependencies that should be added to `package.json`

Benefits of using knip:

- Reduces bundle sizes by identifying code that can be removed
- Improves build performance by eliminating unnecessary dependencies
- Makes the codebase easier to maintain and navigate
- Helps prevent version conflicts and security vulnerabilities from unused packages

For automatic fixes, knip can remove unused code with the `--fix` flag, though this should be used with caution and proper version control.

### Mutation Testing

We use [Stryker](https://stryker-mutator.io/) for mutation testing to assess the quality of our test suite by introducing small code changes (mutations) and verifying that tests catch them.

To run mutation testing:

```bash
npm run test:mutation
```

#### Configuration

The mutation testing is configured in `stryker.conf.cjs` with the following key settings:

**Files to mutate:**

- All JavaScript files in `src/` directory
- Excludes test files (`*.test.js`, `*.spec.js`)
- Excludes test helpers in `src/server/test-helpers/`
- Excludes problematic files that cause issues during mutation

**Test runner settings:**

- Uses Jest as the test runner with our existing `jest.config.js`
- Enables per-test coverage analysis for more precise mutation testing
- Disables `findRelatedTests` for better performance

**Output and reporting:**

- Generates HTML report in `reports/mutation/mutation.html`
- Provides clear-text and progress output during execution
- Runs with 4 concurrent workers for optimal performance

**Quality thresholds:**

- High threshold: 80% (good mutation score)
- Low threshold: 60% (minimum acceptable score)
- No break threshold (won't fail the build)

Reports help identify areas where test coverage could be improved by showing which mutations weren't caught by existing tests.

### Formatting

#### Windows prettier issue

If you are having issues with formatting of line breaks on Windows update your global git config by running:

```bash
git config --global core.autocrlf false
```

## Docker

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
- This service.
- A commented out backend example.

```bash
docker compose up --build -d
```

### Dependabot

We have added an example dependabot configuration file to the repository. You can enable it by renaming
the [.github/example.dependabot.yml](.github/example.dependabot.yml) to `.github/dependabot.yml`

### SonarCloud

Instructions for setting up SonarCloud can be found in [sonar-project.properties](./sonar-project.properties).

## Releases

### [1.0.0](https://eaflood.atlassian.net/projects/ML/versions/23736/tab/release-report-all-issues)

Initial release of the marine licensing frontend application but wont be used by public.

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
