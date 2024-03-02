# Analyzer
This CloudFlare Worker tracks an application's usage by storing daily data and displaying a graph for each version.
Each installation identifies itself by sending a unique identifier (UUID) and its installed version.

## API Calls
 - `/api/lnxlink`: POST request with a JSON payload of `uuid` and `version` which is stored to the database and should be sent every 24 hours
 - `/api/lnxlink/users`: GET request to show a list of app versions and per day usage
 - `/api/lnxlink/countries`: GET request to show a list active users per country in the last 10 days
 - `/lnxlink/graph`: GET request to show a line chart of active users per day
 - `/lnxlink/map`: GET request to show a map of active users in the last 10 days

## Installation
The full guide for setting up your environment is located [here](https://developers.cloudflare.com/d1/get-started/).

With these commands you can create your own analytics server:
```bash
npx wrangler login
npx wrangler d1 execute prod-d1-analyzer --file=./schema.sql
npx wrangler deploy
```

