import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import FourPXFulfillmentProviderService from "./service"

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [FourPXFulfillmentProviderService],
})