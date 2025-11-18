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
  Medusa SF-Express Fulfillment
</h1>

<h4 align="center">
  <a href="https://docs.medusajs.com">Documentation</a> |
  <a href="https://www.medusajs.com">Website</a>
</h4>

<p align="center">
  Building blocks for digital commerce
</p>
<p align="center">
  <a href="https://github.com/medusajs/medusa/blob/master/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome!" />
  </a>
    <a href="https://www.producthunt.com/posts/medusa"><img src="https://img.shields.io/badge/Product%20Hunt-%231%20Product%20of%20the%20Day-%23DA552E" alt="Product Hunt"></a>
  <a href="https://discord.gg/xpCwq3Kfn8">
    <img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg" alt="Discord Chat" />
  </a>
  <a href="https://twitter.com/intent/follow?screen_name=medusajs">
    <img src="https://img.shields.io/twitter/follow/medusajs.svg?label=Follow%20@medusajs" alt="Follow @medusajs" />
  </a>
</p>

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
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            id: "4px",
            resolve: "@gerbergpt/medusa-fulfillment-4px/providers/fulfillment-4px",
            options: {
              api_key: process.env.FOURPX_API_KEY,
              api_secret: process.env.FOURPX_API_SECRET,
            },
          },
        ],
      },
    },
  ]
})
```

## Environment Variables
Create or update your `.env` file with the following variables:

```bash
FOURPX_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
FOURPX_API_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```
