import { defineRouteConfig } from "@medusajs/admin-sdk"
import { TruckFast } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"

const SettingsPage = () => {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">This is my custom route</Heading>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "4PX Settings",
  icon: TruckFast,
})

export default SettingsPage

export const handle = {
  breadcrumb: () => "4PX Settings",
}