# Fulfillment Module

In this section of the documentation, you will find resources to learn more about the Fulfillment Module and how to use it in your application.

Refer to the Medusa Admin User Guide to learn how to use the dashboard to:

- [Manage order fulfillments](https://docs.medusajs.com/user-guide/orders/fulfillments).
- [Manage shipping options and profiles](https://docs.medusajs.com/user-guide/settings/locations-and-shipping).

Medusa has fulfillment related features available out-of-the-box through the Fulfillment Module. A [module](https://docs.medusajs.com/learn/fundamentals/modules) is a standalone package that provides features for a single domain. Each of Medusa's commerce features are placed in Commerce Modules, such as this Fulfillment Module.

Learn more about why modules are isolated in [this documentation](https://docs.medusajs.com/learn/fundamentals/modules/isolation).

## Fulfillment Features

- [Fulfillment Management](https://docs.medusajs.com/commerce-modules/fulfillment/item-fulfillment): Create fulfillments and keep track of their status, items, and more.
- [Integrate Third-Party Fulfillment Providers](https://docs.medusajs.com/commerce-modules/fulfillment/fulfillment-provider): Create third-party fulfillment providers to provide customers with shipping options and fulfill their orders.
- [Restrict By Location and Rules](https://docs.medusajs.com/commerce-modules/fulfillment/shipping-option): Shipping options can be restricted to specific geographical locations. You can also specify custom rules to restrict shipping options.
- [Support Different Fulfillment Forms](https://docs.medusajs.com/commerce-modules/fulfillment/concepts): Support various fulfillment forms, such as shipping or pick up.
- [Tiered Pricing and Price Rules](https://docs.medusajs.com/commerce-modules/pricing/price-rules): Set prices for shipping options with tiers and rules, allowing you to create complex pricing strategies.

***

## How to Use the Fulfillment Module

In your Medusa application, you build flows around Commerce Modules. A flow is built as a [Workflow](https://docs.medusajs.com/learn/fundamentals/workflows), which is a special function composed of a series of steps that guarantees data consistency and reliable roll-back mechanism.

You can build custom workflows and steps. You can also re-use Medusa's workflows and steps, which are provided by the `@medusajs/medusa/core-flows` package.

For example:

```ts title="src/workflows/create-fulfillment.ts" highlights={highlights}
import { 
  createWorkflow, 
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"

const createFulfillmentStep = createStep(
  "create-fulfillment",
  async ({}, { container }) => {
    const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)

    const fulfillment = await fulfillmentModuleService.createFulfillment({
      location_id: "loc_123",
      provider_id: "webshipper",
      delivery_address: {
        country_code: "us",
        city: "Strongsville",
        address_1: "18290 Royalton Rd",
      },
      items: [
        {
          title: "Shirt",
          sku: "SHIRT",
          quantity: 1,
          barcode: "123456",
        },
      ],
      labels: [],
      order: {},
    })

    return new StepResponse({ fulfillment }, fulfillment.id)
  },
  async (fulfillmentId, { container }) => {
    if (!fulfillmentId) {
      return
    }
    const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)

    await fulfillmentModuleService.deleteFulfillment(fulfillmentId)
  }
)

export const createFulfillmentWorkflow = createWorkflow(
  "create-fulfillment",
  () => {
    const { fulfillment } = createFulfillmentStep()

    return new WorkflowResponse({
      fulfillment,
    })
  }
)
```

You can then execute the workflow in your custom API routes, scheduled jobs, or subscribers:

### API Route

```ts title="src/api/workflow/route.ts" highlights={[["11"], ["12"]]} collapsibleLines="1-6" expandButtonLabel="Show Imports"
import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createFulfillmentWorkflow } from "../../workflows/create-fuilfillment"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { result } = await createFulfillmentWorkflow(req.scope)
    .run()

  res.send(result)
}
```

### Subscriber

```ts title="src/subscribers/user-created.ts" highlights={[["11"], ["12"]]} collapsibleLines="1-6" expandButtonLabel="Show Imports"
import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/framework"
import { createFulfillmentWorkflow } from "../workflows/create-fuilfillment"

export default async function handleUserCreated({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const { result } = await createFulfillmentWorkflow(container)
    .run()

  console.log(result)
}

export const config: SubscriberConfig = {
  event: "user.created",
}
```

### Scheduled Job

```ts title="src/jobs/run-daily.ts" highlights={[["7"], ["8"]]}
import { MedusaContainer } from "@medusajs/framework/types"
import { createFulfillmentWorkflow } from "../workflows/create-fuilfillment"

export default async function myCustomJob(
  container: MedusaContainer
) {
  const { result } = await createFulfillmentWorkflow(container)
    .run()

  console.log(result)
}

export const config = {
  name: "run-once-a-day",
  schedule: `0 0 * * *`,
}
```

Learn more about workflows in [this documentation](https://docs.medusajs.com/learn/fundamentals/workflows).

***

## Configure Fulfillment Module

The Fulfillment Module accepts options for further configurations. Refer to [this documentation](https://docs.medusajs.com/commerce-modules/fulfillment/module-options) for details on the module's options.

***