import { model } from "@medusajs/framework/utils"

const Settings = model.define(
  { name: "fourpx_settings", tableName: "4px_settings" },
  {
    id: model.id().primaryKey(),
    name: model.text(),
    value: model.text(),
    auto_load: model.boolean()
  }
)

export default Settings
