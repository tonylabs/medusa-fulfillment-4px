import FourPXModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const FOURPX_MODULE = "fourpx"

export default Module(FOURPX_MODULE, {
  service: FourPXModuleService,
})