# Codex Guidance

## Project Overview

This repo is a Medusa V2 plugin in TypeScript, which is providing international carrier services when a Medusa administration configure and enable this plugin. When 

## Structure

- `index.ts` is the entry of this plugin
- `client.ts` is the file that should be implemented as an API client which has POST and GET methods to call the endpoint like `ds.xms.order.cancel` and return JSON format responses based on the API definition from `docs/4px.md`
- `service.ts` is the file providing services for Medusa V2 backend. You need to go through the documentation files from `docs/medusa` and understand how to provide services.
  1. This `service.ts` should provide options of `FulfillmentOption` for Medusa backend by loading the `ds.xms.logistics_product.getlist` API which is defined in the `docs/4px.md`
  2. This `service.ts` should support both `Flat` and `Calculated` price types.
  3. The `service.ts` should load estimated cost when user is checking out from the 4PX `ds.xms.estimated_cost.get` by sending parameters which can be mapped or converted between Medusa and 4PX.

## Installation

This plugin will be installed by Medusa administrator via npm. 

## Medusa Configuration

After installation, Medusa administration needs to load this plugin by editing the `medusa-config.ts` file with the following content. The `FOURPX_API_KEY` and `FOURPX_API_SECRET` are required in the `.env` file of the Medusa backend.

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
            },
          },
        ],
      },
    },
  ]
})
```

## Forbidden actions
- Never call `npm install` directly.
- Never enable network during tests.