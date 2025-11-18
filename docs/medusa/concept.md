# Fulfillment Concepts

In this document, youâ€™ll learn about some basic fulfillment concepts.

## Fulfillment Set

A fulfillment set is a general form or way of fulfillment. For example, shipping is a form of fulfillment, and pick-up is another form of fulfillment. Each of these can be created as fulfillment sets.

A fulfillment set is represented by the [FulfillmentSet data model](https://docs.medusajs.com/references/fulfillment/models/FulfillmentSet). All other configurations, options, and management features are related to a fulfillment set, in one way or another.

```ts
const fulfillmentSets = await fulfillmentModuleService.createFulfillmentSets(
  [
    {
      name: "Shipping",
      type: "shipping",
    },
    {
      name: "Pick-up",
      type: "pick-up",
    },
  ]
)
```

***

## Service Zone

A service zone is a collection of geographical zones or areas. Itâ€™s used to restrict available shipping options to a defined set of locations.

A service zone is represented by the [ServiceZone data model](https://docs.medusajs.com/references/fulfillment/models/ServiceZone). Itâ€™s associated with a fulfillment set, as each service zone is specific to a form of fulfillment. For example, if a customer chooses to pick up items, you can restrict the available shipping options based on their location.

![A diagram showcasing the relation between fulfillment sets, service zones, and geo zones](https://res.cloudinary.com/dza7lstvk/image/upload/v1712329770/Medusa%20Resources/service-zone_awmvfs.jpg)

A service zone can have multiple geographical zones, each represented by the [GeoZone data model](https://docs.medusajs.com/references/fulfillment/models/GeoZone). It holds location-related details to narrow down supported areas, such as country, city, or province code.

The province code is always in lower-case and in [ISO 3166-2 format](https://en.wikipedia.org/wiki/ISO_3166-2).

***

## Shipping Profile

A shipping profile defines a type of items that are shipped in a similar manner. For example, a `default` shipping profile is used for all item types, but the `digital` shipping profile is used for digital items that arenâ€™t shipped and delivered conventionally.

A shipping profile is represented by the [ShippingProfile data model](https://docs.medusajs.com/references/fulfillment/models/ShippingProfile). It only defines the profileâ€™s details, but itâ€™s associated with the shipping options available for the item type.