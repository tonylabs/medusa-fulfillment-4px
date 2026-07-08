import { MedusaContainer } from "@medusajs/framework/types"

export default async function sync(container: MedusaContainer) {

  const productService = container.resolve("product")

  const products = await productService.listAndCountProducts();

}

export const config = {
  name: "daily-4px-sync",
  schedule: "0 0 * * *", // Every day at midnight
};