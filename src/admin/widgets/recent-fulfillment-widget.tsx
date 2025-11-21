import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading } from "@medusajs/ui"

// The widget
const RecentFulfillmentWidget = () => {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Recent Fulfillment</Heading>
      </div>
    </Container>
  )
}

// The widget's configurations
export const config = defineWidgetConfig({
  zone: "order.list.before",
})

export default RecentFulfillmentWidget