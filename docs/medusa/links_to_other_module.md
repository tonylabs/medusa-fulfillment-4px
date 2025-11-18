# Links between Fulfillment Module and Other Modules

This document showcases the module links defined between the Fulfillment Module and other Commerce Modules.

## Summary

The Fulfillment Module has the following links to other modules:

|First Data Model|Second Data Model|Type|Description|
|---|---|---|---|
|ShippingMethod|ShippingOption|Read-only - has one|Learn more|
|Order|Fulfillment|Stored - one-to-many|Learn more|
|Return|Fulfillment|Stored - one-to-many|Learn more|
|PriceSet|ShippingOption|Stored - many-to-one|Learn more|
|Product|ShippingProfile|Stored - many-to-one|Learn more|
|StockLocation|FulfillmentProvider|Stored - one-to-many|Learn more|
|StockLocation|FulfillmentSet|Stored - one-to-many|Learn more|

***

## Cart Module

Medusa defines a read-only link between the `ShippingMethod` data model of the [Cart Module](https://docs.medusajs.com/commerce-modules/cart) and the `ShippingOption` data model. This means you can retrieve the details of a shipping method's shipping option, but you don't manage the links in a pivot table in the database. The shipping option of a shipping method is determined by the `shipping_option_id` property of the `ShippingMethod` data model.

This link allows you to retrieve the shipping option that a shipping method was created from.

This read-only link was added in [Medusa v2.10.0](https://github.com/medusajs/medusa/releases/tag/v2.10.0)

### Retrieve with Query

To retrieve the shipping option of a shipping method with [Query](https://docs.medusajs.com/learn/fundamentals/module-links/query), pass `shipping_option.*` in `fields`:

### query.graph

```ts
const { data: shippingMethods } = await query.graph({
  entity: "shipping_method",
  fields: [
    "shipping_option.*",
  ],
})

// shippingMethods[0].shipping_option
```

### useQueryGraphStep

```ts
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

// ...

const { data: shippingMethods } = useQueryGraphStep({
  entity: "shipping_method",
  fields: [
    "shipping_option.*",
  ],
})

// shippingMethods[0].shipping_option
```

***

## Order Module

The [Order Module](https://docs.medusajs.com/commerce-modules/order) provides order-management functionalities.

Medusa defines a link between the `Fulfillment` and `Order` data models. A fulfillment is created for an orders' items.

![A diagram showcasing an example of how data models from the Fulfillment and Order modules are linked](https://res.cloudinary.com/dza7lstvk/image/upload/v1716549903/Medusa%20Resources/order-fulfillment_h0vlps.jpg)

A fulfillment is also created for a return's items. So, Medusa defines a link between the `Fulfillment` and `Return` data models.

![A diagram showcasing an example of how data models from the Fulfillment and Order modules are linked](https://res.cloudinary.com/dza7lstvk/image/upload/v1728399052/Medusa%20Resources/Social_Media_Graphics_2024_Order_Return_vetimk.jpg)

### Retrieve with Query

To retrieve the order of a fulfillment with [Query](https://docs.medusajs.com/learn/fundamentals/module-links/query), pass `order.*` in `fields`:

To retrieve the return, pass `return.*` in `fields`.

### query.graph

```ts
const { data: fulfillments } = await query.graph({
  entity: "fulfillment",
  fields: [
    "order.*",
  ],
})

// fulfillments.order
```

### useQueryGraphStep

```ts
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

// ...

const { data: fulfillments } = useQueryGraphStep({
  entity: "fulfillment",
  fields: [
    "order.*",
  ],
})

// fulfillments.order
```

### Manage with Link

To manage the order of a cart, use [Link](https://docs.medusajs.com/learn/fundamentals/module-links/link):

### link.create

```ts
import { Modules } from "@medusajs/framework/utils"

// ...

await link.create({
  [Modules.ORDER]: {
    order_id: "order_123",
  },
  [Modules.FULFILLMENT]: {
    fulfillment_id: "ful_123",
  },
})
```

### createRemoteLinkStep

```ts
import { Modules } from "@medusajs/framework/utils"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"

// ...

createRemoteLinkStep({
  [Modules.ORDER]: {
    order_id: "order_123",
  },
  [Modules.FULFILLMENT]: {
    fulfillment_id: "ful_123",
  },
})
```

***

## Pricing Module

The Pricing Module provides features to store, manage, and retrieve the best prices in a specified context.

Medusa defines a link between the `PriceSet` and `ShippingOption` data models. A shipping option's price is stored as a price set.

![A diagram showcasing an example of how data models from the Pricing and Fulfillment modules are linked](https://res.cloudinary.com/dza7lstvk/image/upload/v1716561747/Medusa%20Resources/pricing-fulfillment_spywwa.jpg)

### Retrieve with Query

To retrieve the price set of a shipping option with [Query](https://docs.medusajs.com/learn/fundamentals/module-links/query), pass `price_set.*` in `fields`:

### query.graph

```ts
const { data: shippingOptions } = await query.graph({
  entity: "shipping_option",
  fields: [
    "price_set_link.*",
  ],
})

// shippingOptions[0].price_set_link?.price_set_id
```

### useQueryGraphStep

```ts
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

// ...

const { data: shippingOptions } = useQueryGraphStep({
  entity: "shipping_option",
  fields: [
    "price_set_link.*",
  ],
})

// shippingOptions[0].price_set_link?.price_set_id
```

### Manage with Link

To manage the price set of a shipping option, use [Link](https://docs.medusajs.com/learn/fundamentals/module-links/link):

### link.create

```ts
import { Modules } from "@medusajs/framework/utils"

// ...

await link.create({
  [Modules.FULFILLMENT]: {
    shipping_option_id: "so_123",
  },
  [Modules.PRICING]: {
    price_set_id: "pset_123",
  },
})
```

### createRemoteLinkStep

```ts
import { Modules } from "@medusajs/framework/utils"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"

// ...

createRemoteLinkStep({
  [Modules.FULFILLMENT]: {
    shipping_option_id: "so_123",
  },
  [Modules.PRICING]: {
    price_set_id: "pset_123",
  },
})
```

***

## Product Module

Medusa defines a link between the `ShippingProfile` data model and the `Product` data model of the Product Module. Each product must belong to a shipping profile.

This link is introduced in [Medusa v2.5.0](https://github.com/medusajs/medusa/releases/tag/v2.5.0).

### Retrieve with Query

To retrieve the products of a shipping profile with [Query](https://docs.medusajs.com/learn/fundamentals/module-links/query), pass `products.*` in `fields`:

### query.graph

```ts
const { data: shippingProfiles } = await query.graph({
  entity: "shipping_profile",
  fields: [
    "products.*",
  ],
})

// shippingProfiles[0].products
```

### useQueryGraphStep

```ts
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

// ...

const { data: shippingProfiles } = useQueryGraphStep({
  entity: "shipping_profile",
  fields: [
    "products.*",
  ],
})

// shippingProfiles[0].products
```

### Manage with Link

To manage the shipping profile of a product, use [Link](https://docs.medusajs.com/learn/fundamentals/module-links/link):

### link.create

```ts
import { Modules } from "@medusajs/framework/utils"

// ...

await link.create({
  [Modules.PRODUCT]: {
    product_id: "prod_123",
  },
  [Modules.FULFILLMENT]: {
    shipping_profile_id: "sp_123",
  },
})
```

### createRemoteLinkStep

```ts
import { Modules } from "@medusajs/framework/utils"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"

// ...

createRemoteLinkStep({
  [Modules.PRODUCT]: {
    product_id: "prod_123",
  },
  [Modules.FULFILLMENT]: {
    shipping_profile_id: "sp_123",
  },
})
```

***

## Stock Location Module

The Stock Location Module provides features to manage stock locations in a store.

Medusa defines a link between the `FulfillmentSet` and `StockLocation` data models. A fulfillment set can be conditioned to a specific stock location.

![A diagram showcasing an example of how data models from the Fulfillment and Stock Location modules are linked](https://res.cloudinary.com/dza7lstvk/image/upload/v1712567101/Medusa%20Resources/fulfillment-stock-location_nlkf7e.jpg)

Medusa also defines a link between the `FulfillmentProvider` and `StockLocation` data models to indicate the providers that can be used in a location.

![A diagram showcasing an example of how data models from the Fulfillment and Stock Location modules are linked](https://res.cloudinary.com/dza7lstvk/image/upload/v1728399492/Medusa%20Resources/fulfillment-provider-stock-location_b0mulo.jpg)

### Retrieve with Query

To retrieve the stock location of a fulfillment set with [Query](https://docs.medusajs.com/learn/fundamentals/module-links/query), pass `location.*` in `fields`:

To retrieve the stock location of a fulfillment provider, pass `locations.*` in `fields`.

### query.graph

```ts
const { data: fulfillmentSets } = await query.graph({
  entity: "fulfillment_set",
  fields: [
    "location.*",
  ],
})

// fulfillmentSets[0].location
```

### useQueryGraphStep

```ts
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

// ...

const { data: fulfillmentSets } = useQueryGraphStep({
  entity: "fulfillment_set",
  fields: [
    "location.*",
  ],
})

// fulfillmentSets[0].location
```

### Manage with Link

To manage the stock location of a fulfillment set, use [Link](https://docs.medusajs.com/learn/fundamentals/module-links/link):

### link.create

```ts
import { Modules } from "@medusajs/framework/utils"

// ...

await link.create({
  [Modules.STOCK_LOCATION]: {
    stock_location_id: "sloc_123",
  },
  [Modules.FULFILLMENT]: {
    fulfillment_set_id: "fset_123",
  },
})
```

### createRemoteLinkStep

```ts
import { Modules } from "@medusajs/framework/utils"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"

// ...

createRemoteLinkStep({
  [Modules.STOCK_LOCATION]: {
    stock_location_id: "sloc_123",
  },
  [Modules.FULFILLMENT]: {
    fulfillment_set_id: "fset_123",
  },
})
```