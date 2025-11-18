# How to Create a Fulfillment Module Provider

In this document, youâ€™ll learn how to create a Fulfillment Module Provider and the methods you must implement in its main service.

***

## Understanding Fulfillment Module Provider Implementation

The Fulfillment Module Provider handles processing fulfillments and shipments with a third-party provirder. However, it's not responsible for managing fulfillment concepts within Medusa, such as creating a fulfillment or its shipments. The Fulfillment Module uses your Fulfillment Module Provider within core operations.

For example, when the merchant creates a fulfillment for an order, the Fulfillment Module uses your Fulfillment Module Provider to create the fulfillment in the third-party system, then creates the fulfillment in Medusa. So, you only have to implement the third-party fulfillment processing logic in your Fulfillment Module Provider.

***

## 1. Create Module Provider Directory

Start by creating a new directory for your module provider.

If you're creating the module provider in a Medusa application, create it under the `src/modules` directory. For example, `src/modules/my-fulfillment`.

If you're creating the module provider in a plugin, create it under the `src/providers` directory. For example, `src/providers/my-fulfillment`.

The rest of this guide always uses the `src/modules/my-fulfillment` directory as an example.

***

## 2. Create the Fulfillment Module Provider Service

Create the file `src/modules/my-fulfillment/service.ts` that holds the module provider's main service. It must extend the `AbstractFulfillmentProviderService` class imported from `@medusajs/framework/utils`:

```ts title="src/modules/my-fulfillment/service.ts"
import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"

class MyFulfillmentProviderService extends AbstractFulfillmentProviderService {
  // TODO implement methods
}

export default MyFulfillmentProviderService
```

### constructor

The constructor allows you to access resources from the [module's container](https://docs.medusajs.com/learn/fundamentals/modules/container)
using the first parameter, and the module's options using the second parameter.

:::note

A module's options are passed when you register it in the Medusa application.

:::

If you're creating a client or establishing a connection with a third-party service, do it in the constructor.

#### Example

```ts title="src/modules/my-fulfillment/service.ts"
import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"
import { Logger } from "@medusajs/framework/types"

type InjectedDependencies = {
  logger: Logger
}

type Options = {
  apiKey: string
}

class MyFulfillmentProviderService extends AbstractFulfillmentProviderService {
// other properties...
  protected logger_: Logger
  protected options_: Options
  // assuming you're initializing a client
  protected client

  constructor(
    { logger }: InjectedDependencies,
    options: Options
  ) {
    super()

    this.logger_ = logger
    this.options_ = options

    // TODO initialize your client
  }
}

export default MyFulfillmentProviderService
```

### identifier

Each fulfillment provider has a unique identifier defined in its class. The provider's ID
will be stored as `fp_{identifier}_{id}`, where `{id}` is the provider's `id`
property in the `medusa-config.ts`.

#### Example

```ts
class MyFulfillmentProviderService extends AbstractFulfillmentProviderService {
  static identifier = "my-fulfillment"

  // ...
}
```

### calculatePrice

This method calculates the price of a shipping method when it's created or its cart is refreshed.

In this method, you can send a request to your third-party provider to retrieve the prices. The first
parameters holds the `data` property of the shipping method's shipping option, which has fulfillment
object data returned by [getFulfillmentOptions](https://docs.medusajs.com/references/fulfillment/provider#getfulfillmentoptions).

The second parameter holds the `data` property of the shipping method, which has data returned by [validateFulfillmentData](https://docs.medusajs.com/references/fulfillment/provider#validatefulfillmentdata).
It can also hold custom data passed from the frontend during checkout.

So, using both of these data, assuming you're storing in them data related to the third-party service,
you can retrieve the calculated price of the shipping method.

#### Example

```ts
import { CalculateShippingOptionPriceDTO } from "@medusajs/framework/types"
class MyFulfillmentProviderService extends AbstractFulfillmentProviderService {
  // ...
  async calculatePrice(
    optionData: CalculateShippingOptionPriceDTO["optionData"],
    data: CalculateShippingOptionPriceDTO["data"],
    context: CalculateShippingOptionPriceDTO["context"]
  ): Promise<CalculatedShippingOptionPrice> {
    // assuming the client can calculate the price using
    // the third-party service
    const price = await this.client.calculate(data)
    return {
      calculated_amount: price,
      // Update this boolean value based on your logic
      is_calculated_price_tax_inclusive: true,
    }
  }
}
```

#### Parameters

- optionData: (\`Record\<string, unknown>\`) The \`data\` property of a shipping option.
- data: (\`Record\<string, unknown>\`) The shipping method's \`data\` property with custom data passed from the frontend.
- context: (\[CartPropsForFulfillment]\(../../../fulfillment/types/fulfillment.CartPropsForFulfillment/page.mdx) & \&#123; \[k: string]: unknown; from\\\_location?: StockLocationDTO \\| undefined; \&#125; & CalculatedRMAShippingContext) The context details, such as the cart details.

    - id: (\[CartDTO]\(../../../fulfillment/interfaces/fulfillment.CartDTO/page.mdx)\[\`"id"\`]) The cart's ID.

    - shipping\_address: (\[CartDTO]\(../../../fulfillment/interfaces/fulfillment.CartDTO/page.mdx)\[\`"shipping\_address"\`]) The cart's shipping address.

    - items: (\[CartDTO]\(../../../fulfillment/interfaces/fulfillment.CartDTO/page.mdx)\[\`"items"\`] & \`object\`) The cart's items

        - variant: (\`object\`) The item's variant.

        - product: (\`object\`) The item's product.

#### Returns

- Promise: (Promise\&#60;\[CalculatedShippingOptionPrice]\(../../../types/types/types.CalculatedShippingOptionPrice/page.mdx)\&#62;) The calculated price's details.

    - calculated\_amount: (\`number\`) The calculated price.

    - is\_calculated\_price\_tax\_inclusive: (\`boolean\`) Whether the calculated price includes taxes. If enabled, Medusa will
      infer the taxes from the calculated price. If false, Medusa will
      add taxes to the calculated price.

### canCalculate

This method validates whether a shippin option's price can be calculated during checkout. It's executed when the admin user creates a shipping
option of type `calculated`. If this method returns `false`, an error is thrown as the shipping option's price can't be calculated.

You can perform the checking using the third-party provider if applicable. The `data` parameter will hold the shipping option's `data` property, which
includes the data of a fulfillment option returned by [getFulfillmentOptions](https://docs.medusajs.com/references/fulfillment/provider#getfulfillmentoptions).

#### Example

```ts
class MyFulfillmentProviderService extends AbstractFulfillmentProviderService {
  // ...
  async canCalculate(data: CreateShippingOptionDTO): Promise<boolean> {
    // assuming you have a client
    return await this.client.hasRates(data.id)
  }
}
```

#### Parameters

- data: (\[CreateShippingOptionDTO]\(../../../fulfillment/interfaces/fulfillment.CreateShippingOptionDTO/page.mdx)) The \`data\` property of the shipping option.

    - name: (\`string\`) The name of the shipping option.

    - price\_type: (\[ShippingOptionPriceType]\(../../../fulfillment/types/fulfillment.ShippingOptionPriceType/page.mdx)) The type of the shipping option's price.

    - service\_zone\_id: (\`string\`) The associated service zone's ID.

    - shipping\_profile\_id: (\`string\`) The associated shipping profile's ID.

    - provider\_id: (\`string\`) The associated provider's ID.

    - type: (\`string\` \\| \[CreateShippingOptionTypeDTO]\(../../../fulfillment/interfaces/fulfillment.CreateShippingOptionTypeDTO/page.mdx)) The shipping option type associated with the shipping option.

        - label: (\`string\`) The label of the shipping option type.

        - code: (\`string\`) The code of the shipping option type.

        - description: (\`string\`) The description of the shipping option type.

    - data: (\`null\` \\| \`Record\<string, unknown>\`) The data necessary for the associated fulfillment provider to process the shipping option
      and its associated fulfillments.

    - rules: (Omit\&#60;\[CreateShippingOptionRuleDTO]\(../../../fulfillment/interfaces/fulfillment.CreateShippingOptionRuleDTO/page.mdx), "shipping\_option\_id"\&#62;\[]) The shipping option rules associated with the shipping option.

        - attribute: (\`string\`) The attribute of the shipping option rule.

        - operator: (\[RuleOperatorType]\(../../../fulfillment/types/fulfillment.RuleOperatorType/page.mdx)) The operator of the shipping option rule.

        - value: (\`string\` \\| \`string\`\[]) The value(s) of the shipping option rule.

#### Returns

- Promise: (Promise\&#60;boolean\&#62;) Whether the price can be calculated for the shipping option.

    - boolean: (\`boolean\`)

### cancelFulfillment

This method is used when a fulfillment is canceled. Use it to perform operations
with the third-party fulfillment service.

#### Example

```ts
class MyFulfillmentProviderService extends AbstractFulfillmentProviderService {
  // ...
  async cancelFulfillment(data: Record<string, unknown>): Promise<any> {
    // assuming the client cancels a fulfillment
    // in the third-party service
    const { external_id } = data as {
      external_id: string
    }
    await this.client.cancel(external_id)
  }
}
```

#### Parameters

- data: (\`Record\<string, unknown>\`) The fulfillment's \`data\` property.

#### Returns

- Promise: (Promise\&#60;any\&#62;) This method is used when a fulfillment is canceled. Use it to perform operations
  with the third-party fulfillment service.

    - any: (\`any\`)

### createFulfillment

This method is used when a fulfillment is created. If the method returns in the object a
`data` property, it's stored in the fulfillment's `data` property.

The `data` property is useful when handling the fulfillment later,
as you can access information useful for your integration, such as the ID in the
third-party provider.

You can also use this method to perform an action with the third-party fulfillment service
since a fulfillment is created, such as purchase a label.

#### Example

```ts
class MyFulfillmentProviderService extends AbstractFulfillmentProviderService {
  // ...
  async createFulfillment(
    data: Record<string, unknown>,
    items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    order: Partial<FulfillmentOrderDTO> | undefined,
    fulfillment: Partial<Omit<FulfillmentDTO, "provider_id" | "data" | "items">>
  ): Promise<CreateFulfillmentResult> {
    // assuming the client creates a fulfillment
    // in the third-party service
    const externalData = await this.client.create(
      fulfillment,
      items
    )

    return {
      data: {
        ...(fulfillment.data as object || {}),
        ...externalData
      }
    }
  }
}
```

#### Parameters

- data: (\`Record\<string, unknown>\`) The \`data\` property of the shipping method this fulfillment is created for.
- items: (Partial\&#60;Omit\&#60;\[FulfillmentItemDTO]\(../../../fulfillment/interfaces/fulfillment.FulfillmentItemDTO/page.mdx), "fulfillment"\&#62;\&#62;\[]) The items in the fulfillment.
- order: (\`undefined\` \\| Partial\&#60;FulfillmentOrderDTO\&#62;) The order this fulfillment is created for.
- fulfillment: (Partial\&#60;Omit\&#60;\[FulfillmentDTO]\(../../../fulfillment/interfaces/fulfillment.FulfillmentDTO/page.mdx), "items" \\| "data" \\| "provider\_id"\&#62;\&#62;) The fulfillment's details.

    - id: (\`string\`) The ID of the fulfillment.

    - location\_id: (\`string\`) The associated location's ID.

    - packed\_at: (\`null\` \\| \`Date\`) The date the fulfillment was packed.

    - shipped\_at: (\`null\` \\| \`Date\`) The date the fulfillment was shipped.

    - delivered\_at: (\`null\` \\| \`Date\`) The date the fulfillment was delivered.

    - canceled\_at: (\`null\` \\| \`Date\`) The date the fulfillment was canceled.

    - shipping\_option\_id: (\`null\` \\| \`string\`) The associated shipping option's ID.

    - metadata: (\`null\` \\| \`Record\<string, unknown>\`) Holds custom data in key-value pairs.

    - shipping\_option: (\`null\` \\| \[ShippingOptionDTO]\(../../../fulfillment/interfaces/fulfillment.ShippingOptionDTO/page.mdx)) The associated shipping option.

        - id: (\`string\`) The ID of the shipping option.

        - name: (\`string\`) The name of the shipping option.

        - price\_type: (\[ShippingOptionPriceType]\(../../../fulfillment/types/fulfillment.ShippingOptionPriceType/page.mdx)) The type of the shipping option's price.

        - service\_zone\_id: (\`string\`) The associated service zone's ID.

        - shipping\_profile\_id: (\`string\`) The associated shipping profile's ID.

        - provider\_id: (\`string\`) The associated fulfillment provider's ID.

        - shipping\_option\_type\_id: (\`null\` \\| \`string\`) The associated shipping option type's ID.

        - data: (\`null\` \\| \`Record\<string, unknown>\`) The data necessary for the associated fulfillment provider to process the shipping option
          and, later, its associated fulfillments.

        - metadata: (\`null\` \\| \`Record\<string, unknown>\`) Holds custom data in key-value pairs.

        - service\_zone: (\[ServiceZoneDTO]\(../../../fulfillment/interfaces/fulfillment.ServiceZoneDTO/page.mdx)) The associated service zone.

        - shipping\_profile: (\[ShippingProfileDTO]\(../../../fulfillment/interfaces/fulfillment.ShippingProfileDTO/page.mdx)) The associated shipping profile.

        - fulfillment\_provider: (\[FulfillmentProviderDTO]\(../../../fulfillment/interfaces/fulfillment.FulfillmentProviderDTO/page.mdx)) The associated fulfillment provider.

        - type: (\[ShippingOptionTypeDTO]\(../../../fulfillment/interfaces/fulfillment.ShippingOptionTypeDTO/page.mdx)) The associated shipping option type.

        - rules: (\[ShippingOptionRuleDTO]\(../../../fulfillment/interfaces/fulfillment.ShippingOptionRuleDTO/page.mdx)\[]) The rules associated with the shipping option.

        - fulfillments: (\[FulfillmentDTO]\(../../../fulfillment/interfaces/fulfillment.FulfillmentDTO/page.mdx)\[]) The fulfillments associated with the shipping option.

        - created\_at: (\`Date\`) The creation date of the shipping option.

        - updated\_at: (\`Date\`) The update date of the shipping option.

        - deleted\_at: (\`null\` \\| \`Date\`) The deletion date of the shipping option.

    - requires\_shipping: (\`boolean\`) Flag to indidcate whether shipping is required

    - provider: (\[FulfillmentProviderDTO]\(../../../fulfillment/interfaces/fulfillment.FulfillmentProviderDTO/page.mdx)) The associated fulfillment provider.

        - id: (\`string\`) The ID of the fulfillment provider.

        - name: (\`string\`) The name of the fulfillment provider.

        - metadata: (\`null\` \\| \`Record\<string, unknown>\`) Holds custom data in key-value pairs.

        - shipping\_options: (\[ShippingOptionDTO]\(../../../fulfillment/interfaces/fulfillment.ShippingOptionDTO/page.mdx)\[]) The shipping options associated with the fulfillment provider.

        - created\_at: (\`Date\`) The creation date of the fulfillment provider.

        - updated\_at: (\`Date\`) The update date of the fulfillment provider.

        - deleted\_at: (\`null\` \\| \`Date\`) The deletion date of the fulfillment provider.

    - delivery\_address: (\[FulfillmentAddressDTO]\(../../../fulfillment/interfaces/fulfillment.FulfillmentAddressDTO/page.mdx)) The associated fulfillment address used for delivery.

        - id: (\`string\`) The ID of the address.

        - fulfillment\_id: (\`null\` \\| \`string\`) The associated fulfillment's ID.

        - company: (\`null\` \\| \`string\`) The company of the address.

        - first\_name: (\`null\` \\| \`string\`) The first name of the address.

        - last\_name: (\`null\` \\| \`string\`) The last name of the address.

        - address\_1: (\`null\` \\| \`string\`) The first line of the address.

        - address\_2: (\`null\` \\| \`string\`) The second line of the address.

        - city: (\`null\` \\| \`string\`) The city of the address.

        - country\_code: (\`null\` \\| \`string\`) The ISO 2 character country code of the address.

        - province: (\`null\` \\| \`string\`) The lower-case \[ISO 3166-2]\(https://en.wikipedia.org/wiki/ISO\\\_3166-2) province of the address.

        - postal\_code: (\`null\` \\| \`string\`) The postal code of the address.

        - phone: (\`null\` \\| \`string\`) The phone of the address.

        - metadata: (\`null\` \\| \`Record\<string, unknown>\`) Holds custom data in key-value pairs.

        - created\_at: (\`Date\`) The creation date of the address.

        - updated\_at: (\`Date\`) The update date of the address.

        - deleted\_at: (\`null\` \\| \`Date\`) The deletion date of the address.

    - labels: (\[FulfillmentLabelDTO]\(../../../fulfillment/interfaces/fulfillment.FulfillmentLabelDTO/page.mdx)\[]) The labels of the fulfillment.

        - id: (\`string\`) The ID of the fulfillment label.

        - tracking\_number: (\`string\`) The tracking number of the fulfillment label.

        - tracking\_url: (\`string\`) The tracking URL of the fulfillment label.

        - label\_url: (\`string\`) The label's URL.

        - fulfillment\_id: (\`string\`) The associated fulfillment's ID.

        - fulfillment: (\[FulfillmentDTO]\(../../../fulfillment/interfaces/fulfillment.FulfillmentDTO/page.mdx)) The associated fulfillment.

        - created\_at: (\`Date\`) The creation date of the fulfillment label.

        - updated\_at: (\`Date\`) The update date of the fulfillment label.

        - deleted\_at: (\`null\` \\| \`Date\`) The deletion date of the fulfillment label.

    - created\_at: (\`Date\`) The creation date of the fulfillment.

    - updated\_at: (\`Date\`) The update date of the fulfillment.

    - deleted\_at: (\`null\` \\| \`Date\`) The deletion date of the fulfillment.

    - marked\_shipped\_by: (\`null\` \\| \`string\`) The id of the user that marked fulfillment as shipped

    - created\_by: (\`null\` \\| \`string\`) The id of the user that created the fulfillment

#### Returns

- Promise: (Promise\&#60;\[CreateFulfillmentResult]\(../../../types/types/types.CreateFulfillmentResult/page.mdx)\&#62;) An object whose \`data\` property is stored in the fulfillment's \`data\` property.

    - data: (\`Record\<string, unknown>\`) Additional fulfillment data from provider

    - labels: (\`object\`\[])

        - tracking\_number: (\`string\`) The tracking number of the fulfillment label.

        - tracking\_url: (\`string\`) The tracking URL of the fulfillment label.

        - label\_url: (\`string\`) The label's URL.

### createReturnFulfillment

This method is used when a fulfillment is created for a return. If the method returns in the object a
`data` property, it's stored in the fulfillment's `data` property.

The `data` property is useful when handling the fulfillment later,
as you can access information useful for your integration. For example, you
can store an ID for the fulfillment in the third-party service.

Use this method to perform actions necessary in the third-party fulfillment service, such as
purchasing a label for the return fulfillment.

#### Example

```ts
class MyFulfillmentProviderService extends AbstractFulfillmentProviderService {
  // ...
  async createReturnFulfillment(fulfillment: Record<string, unknown>): Promise<CreateFulfillmentResult> {
    // assuming the client creates a fulfillment for a return
    // in the third-party service
    const externalData = await this.client.createReturn(
      fulfillment
    )

    return {
      data: {
        ...(fulfillment.data as object || {}),
        ...externalData
      }
    }
  }
}
```

#### Parameters

- fulfillment: (\`Record\<string, unknown>\`) The fulfillment's details.

#### Returns

- Promise: (Promise\&#60;\[CreateFulfillmentResult]\(../../../types/types/types.CreateFulfillmentResult/page.mdx)\&#62;) An object containing \`data\` which is stored in the fulfillment's \`data\` property and \`labels\` array which is used to create FulfillmentLabels.

    - data: (\`Record\<string, unknown>\`) Additional fulfillment data from provider

    - labels: (\`object\`\[])

        - tracking\_number: (\`string\`) The tracking number of the fulfillment label.

        - tracking\_url: (\`string\`) The tracking URL of the fulfillment label.

        - label\_url: (\`string\`) The label's URL.

### getFulfillmentDocuments

This method retrieves the documents of a fulfillment.

#### Example

```ts
class MyFulfillmentProviderService extends AbstractFulfillmentProviderService {
  // ...
  async getFulfillmentDocuments(data: any): Promise<never[]> {
    // assuming the client retrieves documents
    // from a third-party service
    return await this.client.documents(data)
  }
}
```

#### Parameters

- data: (\`Record\<string, unknown>\`) The \`data\` property of the fulfillment.

#### Returns

- Promise: (Promise\&#60;never\[]\&#62;) The fulfillment's documents.

    - never\[]: (\`never\`\[])

### getFulfillmentOptions

This method retrieves a list of fulfillment options that this provider supports. Admin users will then choose from these options when
they're creating a shipping option. The chosen fulfillment option's object is then stored within the created shipping option's `data` property.
The `data` property is useful to store data relevant for the third-party provider to later process the fulfillment.

This method is useful if your third-party provider allows you to retrieve support options, carriers, or services from an API. You can then
retrieve those and return then in the method, allowing the admin user to choose from the services provided by the third-party provider.

#### Example

```ts
// other imports...
import { FulfillmentOption } from "@medusajs/framework/types"

class MyFulfillmentProviderService extends AbstractFulfillmentProviderService {
  // ...
  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    // assuming you have a client
    const services = await this.client.getServices()

    return services.map((service) => ({
      id: service.service_id,
      name: service.name,
      service_code: service.code,
      // can add other relevant data for the provider to later process the shipping option.
    }))
  }
}
```

#### Returns

- Promise: (Promise\&#60;\[FulfillmentOption]\(../../../types/types/types.FulfillmentOption/page.mdx)\[]\&#62;) The list of fulfillment options. Each object in the array should have an \`id\` property unique to an item, and a \`name\` property
  that's used to display the option in the admin.

    - FulfillmentOption\[]: (\[FulfillmentOption]\(../../../types/types/types.FulfillmentOption/page.mdx)\[])

        - id: (\`string\`) The option's ID. This ID can be an ID in the third-party system relevant
          for later processing of fulfillment.

        - is\_return: (\`boolean\`) Whether the option can be used to return items.

### getReturnDocuments

This method retrieves documents for a return's fulfillment.

#### Example

```ts
class MyFulfillmentProviderService extends AbstractFulfillmentProviderService {
  // ...
  async getReturnDocuments(data: any): Promise<never[]> {
    // assuming the client retrieves documents
    // from a third-party service
    return await this.client.documents(data)
  }
}
```

#### Parameters

- data: (\`Record\<string, unknown>\`) The \`data\` property of the fulfillment.

#### Returns

- Promise: (Promise\&#60;never\[]\&#62;) The fulfillment's documents.

    - never\[]: (\`never\`\[])

### getShipmentDocuments

This method retrieves the documents for a shipment.

#### Example

```ts
class MyFulfillmentProviderService extends AbstractFulfillmentProviderService {
  // ...
  async getShipmentDocuments(data: any): Promise<never[]> {
    // assuming the client retrieves documents
    // from a third-party service
    return await this.client.documents(data)
  }
}
```

#### Parameters

- data: (\`Record\<string, unknown>\`) The \`data\` property of the shipmnet.

#### Returns

- Promise: (Promise\&#60;never\[]\&#62;) The shipment's documents.

    - never\[]: (\`never\`\[])

### retrieveDocuments

This method retrieves the documents of a fulfillment of a certain type.

#### Example

```ts
class MyFulfillmentProviderService extends AbstractFulfillmentProviderService {
  // ...
  async retrieveDocuments(
    fulfillmentData: any,
    documentType: any
  ): Promise<void> {
    // assuming the client retrieves documents
    // from a third-party service
    return await this.client.documents(
      fulfillmentData,
      documentType
    )
  }
}
```

#### Parameters

- fulfillmentData: (\`Record\<string, unknown>\`) The \`data\` property of the fulfillment.
- documentType: (\`string\`) The document's type. For example, \`invoice\`.

#### Returns

- Promise: (Promise\&#60;void\&#62;) The fulfillment's documents.

### validateFulfillmentData

This method validates the `data` property of a shipping method and returns it. The returned data
is stored in the shipping method's `data` property.

Your fulfillment provider can use the `data` property to store additional information useful for
handling the fulfillment later. For example, you may store an ID from the third-party fulfillment
system.

#### Example

```ts
class MyFulfillmentProviderService extends AbstractFulfillmentProviderService {
  // ...
  async validateFulfillmentData(
    optionData: any,
    data: any,
    context: any
  ): Promise<any> {
    // assuming your client retrieves an ID from the
    // third-party service
    const externalId = await this.client.getId()

    return {
      ...data,
      externalId
    }
  }
}
```

#### Parameters

- optionData: (\`Record\<string, unknown>\`) The \`data\` property of the shipping option.
- data: (\`Record\<string, unknown>\`) The \`data\` property of the shipping method.
- context: (\[ValidateFulfillmentDataContext]\(../../../types/types/types.ValidateFulfillmentDataContext/page.mdx)) Context details, such as context of the cart or customer.

    - id: (\[CartDTO]\(../../../fulfillment/interfaces/fulfillment.CartDTO/page.mdx)\[\`"id"\`]) The cart's ID.

    - shipping\_address: (\[CartDTO]\(../../../fulfillment/interfaces/fulfillment.CartDTO/page.mdx)\[\`"shipping\_address"\`]) The cart's shipping address.

    - items: (\[CartDTO]\(../../../fulfillment/interfaces/fulfillment.CartDTO/page.mdx)\[\`"items"\`] & \`object\`) The cart's items

        - variant: (\`object\`) The item's variant.

        - product: (\`object\`) The item's product.

    - from\_location: (\[StockLocationDTO]\(../../../types/StockLocationTypes/types/types.StockLocationTypes.StockLocationDTO/page.mdx)) Details about the location that items are being shipped from.

        - id: (\`string\`) The ID of the stock location.

        - name: (\`string\`) The name of the stock location.

        - metadata: (\`Record\<string, unknown>\` \\| \`null\`) Holds custom data in key-value pairs.

        - address\_id: (\`string\`) The associated address's ID.

        - fulfillment\_sets: (\[FulfillmentSetDTO]\(../../../fulfillment/interfaces/fulfillment.FulfillmentSetDTO/page.mdx)\[]) Fulfillment sets for the location

        - created\_at: (\`string\` \\| \`Date\`) The creation date of the stock location.

        - updated\_at: (\`string\` \\| \`Date\`) The update date of the stock location.

        - deleted\_at: (\`string\` \\| \`Date\` \\| \`null\`) The deletion date of the stock location.

        - address: (\[StockLocationAddressDTO]\(../../../types/StockLocationTypes/types/types.StockLocationTypes.StockLocationAddressDTO/page.mdx)) The address of the stock location.

#### Returns

- Promise: (Promise\&#60;any\&#62;) the data to store in the \`data\` property of the shipping method.

    - any: (\`any\`)

### validateOption

This method validates the `data` property of a shipping option when it's created.

The `data` property can hold useful information that's later added to the `data` attribute
of shipping methods created from this option.

#### Example

```ts
class MyFulfillmentProviderService extends AbstractFulfillmentProviderService {
  // ...
  async validateOption(data: any): Promise<boolean> {
    return data.external_id !== undefined
  }
}
```

#### Parameters

- data: (\`Record\<string, unknown>\`) The data to validate.

#### Returns

- Promise: (Promise\&#60;boolean\&#62;) Whether the data is valid.

    - boolean: (\`boolean\`)

***

## 3. Create Module Provider Definition File

Create the file `src/modules/my-fulfillment/index.ts` with the following content:

```ts title="src/modules/my-fulfillment/index.ts"
import MyFulfillmentProviderService from "./service"
import { 
  ModuleProvider, 
  Modules
} from "@medusajs/framework/utils"

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [MyFulfillmentProviderService],
})
```

This exports the module provider's definition, indicating that the `MyFulfillmentProviderService` is the module provider's service.

A fulfillment module provider can have export multiple provider services, where each are registered as a separate fulfillment provider.

***

## 4. Use Module Provider

To use your Fulfillment Module Provider, add it to the `providers` array of the Fulfillment Module in `medusa-config.ts`:

```ts title="medusa-config.ts"
module.exports = defineConfig({
  // ...
  modules: [
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          // default provider
          {
            resolve: "@medusajs/medusa/fulfillment-manual",
            id: "manual",
          },
          {
            // if module provider is in a plugin, use `plugin-name/providers/my-fulfillment`
            resolve: "./src/modules/my-fulfillment",
            id: "my-fulfillment",
            options: {
              // provider options...
            },
          },
        ],
      },
    },
  ]
})
```

***

## 5. Test it Out

Before you use your Fulfillment Module Provider, in the Medusa Admin:

1. Add the Fulfillment Module Provider to a location.
2. Add in the location a delivery shipping option that uses the provider.

Then, place an order, choosing the shipping option you created during checkout, and create a fulfillment in the Medusa Admin. The fulfillment is created using your provider.