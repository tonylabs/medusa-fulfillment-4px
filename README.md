<p align="center">
  <a href="https://www.medusajs.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    </picture>
  </a>
</p>
<h1 align="center">
  Medusa 4PX Fulfillment
</h1>

<h4 align="center">
  <a href="https://docs.medusajs.com">Documentation</a> |
  <a href="https://www.medusajs.com">Website</a>
</h4>


## Compatibility

This plugin is compatible with versions >= 2.11.x of `@medusajs/medusa`.

## Table of Contents
- [Prerequisites](#prerequisites)
- [4PX API Document](/docs/4px.md)
- [Installation](#installation)
- [Configuration](#configuration)
    - [Configuration Options](#configuration-options)
    - [Environment Variables](#environment-variables)

## Prerequisites
- Node.js v20 or higher
- Medusa server v2.11.3 or higher
- Get your own API Key and API Secret from [4PX API](https://open.4px.com)
  - **Note:** To use this plugin with the 4PX API, you must have registered your 4PX account as a merchant. Developer or other service-provider account types are not supported.

## Installation

```bash
yarn add @gerbergpt/medusa-fulfillment-sfexpress
```

## Configuration
Add the provider module in your `medusa-config.ts` file:

```typescript
module.exports = defineConfig({
  projectConfig: {
    // ...
  },
  modules: [
    // ... other modules
    {
      key: Modules.FULFILLMENT,
      resolve: "@medusajs/fulfillment",
      options: {
        providers: [
          {
            id: "4px",
            resolve: "@gerbergpt/medusa-fulfillment-4px/providers/fulfillment-4px",
            options: {
              api_key: process.env.FOURPX_API_KEY,
              api_secret: process.env.FOURPX_API_SECRET,
              sandbox: process.env.FOURPX_ENV === "sandbox",
              //source_country_code: 'CN',
              //language: 'en',
              //default_transport_mode: 2
            },
          },
        ],
      },
    },
  ],
  ...,
  plugins: [
    {
      resolve: "@gerbergpt/medusa-fulfillment-4px",
      options: {},
    },
  ],
})
```

---

## Environment Variables
Create or update your `.env` file with the following variables:

```bash
FOURPX_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
FOURPX_API_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
FOURPX_ENV="sandbox | production"
```

---

## Development

- [Medusa Plugin Development](https://docs.medusajs.com/learn/fundamentals/plugins/create)

The following steps guide you through setting up the plugin locally using `yalc`, a tool that allows you to publish local packages and test them in other projects without pushing them to a registry.

1. Prepare the plugin for local development
Install dependencies, build the project, and publish it to your local yalc store:

```bash
yarn install
yarn run build
yarn run publish
```

2. Navigate to your Medusa backend application and install the plugin:

```bash
npx medusa plugin:add @gerbergpt/medusa-fulfillment-4px
```

3. After installation, you should see an entry pointing to the local yalc package:

```json
"dependencies": {
  ...,
  "@gerbergpt/medusa-fulfillment-4px": "file:.yalc/@gerbergpt/medusa-fulfillment-4px",
  ...
}
```

4. Follow the steps in the [configuration](#Configuration) section
5. You can now begin development by running the `yarn run dev` command. The Medusa backend server will automatically restart whenever you make changes to this plugin.
5. When you have completed development and testing, remove the local published yalc package:

```bash
yalc remove  @gerbergpt/medusa-fulfillment-4px
```
