import {
  AbstractFulfillmentProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import {
    Logger,
    FulfillmentDTO,
    FulfillmentItemDTO,
    FulfillmentOption,
    FulfillmentOrderDTO,
    CalculatedShippingOptionPrice,
    CreateShippingOptionDTO,
    CalculateShippingOptionPriceContext,
    CreateFulfillmentResult,
    ValidateFulfillmentDataContext,
} from "@medusajs/framework/types"

import { Client } from "./client"

type InjectedDependencies = {
  logger: Logger
}

type LogisticsProduct = Record<string, any>
type PriceType = "flat" | "calculated"

export type Options = {
  api_key?: string
  api_secret?: string
  sandbox?: boolean
  api_version?: string
  access_token?: string
  language?: string
  timeout?: number
  default_warehouse_code?: string
  default_origin_country?: string
  default_currency?: string
  default_business_type?: string
  default_duty_type?: string
}

class FourPXFulfillmentProviderService extends AbstractFulfillmentProviderService {
  static identifier = "fulfillment-4px"
  protected logger_: Logger
  protected options_: Options
  protected client: Client
  protected productsCache:
    | {
        expires_at: number
        items: LogisticsProduct[]
      }
    | null = null

  constructor({ logger }: InjectedDependencies, options: Options = {}) {
    super()
    this.logger_ = logger
    this.options_ = options ?? {}
    this.client = new Client(this.options_)
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    const products = await this.retrieveLogisticsProducts()

    return products.map((product) => this.toFulfillmentOption(product))
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: ValidateFulfillmentDataContext
  ): Promise<Record<string, unknown>> {
    const productCode = this.getProductCode(optionData)

    if (!productCode) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The selected 4PX shipping option is missing `logistics_product_code`."
      )
    }

    return {
      ...data,
      logistics_product_code: productCode,
      logistics_channel_code:
        this.getProp<string>(optionData, "logistics_channel_code") ??
        this.getProp<string>(optionData, "channel_code"),
      shipping_address: context.shipping_address,
    }
  }

  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    return !!this.getProductCode(data)
  }

  async canCalculate(data: CreateShippingOptionDTO): Promise<boolean> {
    if (data.price_type !== "calculated") {
      return true
    }

    const supported = this.getSupportedPriceTypes(data.data ?? {})

    return supported.includes("calculated")
  }

  async canUseFlatPrice(data: Record<string, unknown>): Promise<boolean> {
    const supported = this.getSupportedPriceTypes(data)
    return supported.includes("flat")
  }

  async calculatePrice(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: CalculateShippingOptionPriceContext
  ): Promise<CalculatedShippingOptionPrice> {
    const priceType = this.resolvePriceType(optionData)

    if (priceType === "flat") {
      const flatAmount = this.resolveFlatAmount(optionData, data)

      return {
        calculated_amount: flatAmount,
        is_calculated_price_tax_inclusive: false,
      }
    }

    const estimationPayload = this.buildEstimatedCostPayload(
      optionData,
      data,
      context
    )

    const response = await this.client.post(
      "ds.xms.estimated_cost.get",
      estimationPayload
    )

    const amount = this.extractEstimatedAmount(response?.data ?? response)

    return {
      calculated_amount: amount,
      is_calculated_price_tax_inclusive: false,
    }
  }

  async createFulfillment(
    data: Record<string, unknown>,
    items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    order: Partial<FulfillmentOrderDTO> | undefined,
    fulfillment: Partial<Omit<FulfillmentDTO, "provider_id" | "data" | "items">>
  ): Promise<CreateFulfillmentResult> {
    this.logger_.info(
      `Creating 4PX fulfillment - ${JSON.stringify({
        data,
        items,
        order,
        fulfillment,
      })}`
    )

    return {
      data: {
        ...data,
        fulfillment_id: fulfillment?.id,
      },
      labels: [],
    }
  }

  async cancelFulfillment(
    fulfillment: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    this.logger_.info(
      `Canceling 4PX fulfillment - ${JSON.stringify(fulfillment)}`
    )

    return fulfillment
  }

  async createReturnFulfillment(
    data: Record<string, unknown>
  ): Promise<CreateFulfillmentResult> {
    this.logger_.info(
      `Creating 4PX return fulfillment - ${JSON.stringify(data)}`
    )

    return {
      data,
      labels: [],
    }
  }

  async getFulfillmentDocuments(
    data: Record<string, unknown>
  ): Promise<never[]> {
    return []
  }

  async getReturnDocuments(data: Record<string, unknown>): Promise<never[]> {
    return []
  }

  async getShipmentDocuments(data: Record<string, unknown>): Promise<never[]> {
    return []
  }

  async retrieveDocuments(
    fulfillmentData: Record<string, unknown>,
    documentType: string
  ): Promise<any> {
    return []
  }

  protected async retrieveLogisticsProducts(): Promise<LogisticsProduct[]> {
    if (this.productsCache && this.productsCache.expires_at > Date.now()) {
      return this.productsCache.items
    }

    const payload: Record<string, unknown> = {
      page_no: 1,
      page_size: 200,
    }

    if (this.options_.default_warehouse_code) {
      payload.warehouse_code = this.options_.default_warehouse_code
    }

    try {
      const response = await this.client.post(
        "ds.xms.logistics_product.getlist",
        payload
      )

      const list = this.extractList(response?.data ?? response)

      this.productsCache = {
        items: list,
        expires_at: Date.now() + 5 * 60 * 1000,
      }

      return list
    } catch (error) {
      this.logger_.error(
        `Failed to load 4PX logistics products: ${
          (error as Error)?.message ?? error
        }`
      )
      throw error
    }
  }

  protected toFulfillmentOption(product: LogisticsProduct): FulfillmentOption {
    const productCode = this.getProductCode(product)

    return {
      id: productCode,
      name:
        this.getProp<string>(product, "logistics_product_name") ??
        this.getProp<string>(product, "product_name") ??
        productCode,
      product_code: productCode,
      logistics_channel_code:
        this.getProp<string>(product, "logistics_channel_code") ??
        this.getProp<string>(product, "channel_code"),
      logistics_channel_name:
        this.getProp<string>(product, "logistics_channel_name") ??
        this.getProp<string>(product, "channel_name"),
      warehouse_code:
        this.getProp<string>(product, "warehouse_code") ??
        this.options_.default_warehouse_code,
      supported_price_types: this.getSupportedPriceTypes(product),
      default_price_type: this.resolvePriceType(product),
      raw_product: product,
    }
  }

  protected getProductCode(data: Record<string, unknown>): string {
    return (
      this.getProp<string>(data, "logistics_product_code") ??
      this.getProp<string>(data, "product_code") ??
      this.getProp<string>(data, "id") ??
      ""
    )
  }

  protected getSupportedPriceTypes(data: Record<string, unknown>): PriceType[] {
    const rawSupported = this.getProp<PriceType[]>(data, "supported_price_types")
    const supported = Array.isArray(rawSupported)
      ? (rawSupported as PriceType[])
      : []

    if (supported.length) {
      return supported
    }

    const priceType = this.resolvePriceType(data)

    return priceType === "flat" ? ["flat"] : ["flat", "calculated"]
  }

  protected resolvePriceType(
    data: Record<string, unknown>,
    fallback: PriceType = "calculated"
  ): PriceType {
    const explicitPriceType =
      this.getProp<string>(data, "price_type") ??
      this.getProp<string>(data, "default_price_type") ??
      this.getProp<string>(data, "billing_type") ??
      this.getProp<string>(data, "pricing_type")

    const normalized = explicitPriceType?.toLowerCase?.() ?? ""

    if (normalized.includes("flat")) {
      return "flat"
    }

    if (normalized.includes("calc") || normalized.includes("estimate")) {
      return "calculated"
    }

    return fallback
  }

  protected resolveFlatAmount(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>
  ): number {
    const candidates = [
      this.getProp<number | string>(optionData, "flat_price_amount"),
      this.getProp<number | string>(data, "flat_price_amount"),
      this.getProp<number | string>(optionData, "amount"),
      this.getProp<number | string>(data, "amount"),
    ]

    for (const candidate of candidates) {
      const converted = this.toMinorUnits(candidate)

      if (converted > 0) {
        return converted
      }
    }

    return 0
  }

  protected buildEstimatedCostPayload(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: CalculateShippingOptionPriceContext
  ): Record<string, unknown> {
    const shippingAddress = context.shipping_address ?? {}
    const shipping = shippingAddress as Record<string, unknown>
    const measurements = this.getPackageMeasurements(context)
    const currency = this.resolveCurrency(optionData, data, context)

    const payload: Record<string, unknown> = {
      logistics_product_code: this.getProductCode(optionData),
      destination_country:
        this.getProp<string>(shipping, "country_code") ??
        this.getProp<string>(shipping, "country"),
      destination_state:
        this.getProp<string>(shipping, "province_code") ??
        this.getProp<string>(shipping, "province"),
      destination_city: shipping?.["city"],
      destination_post_code:
        this.getProp<string>(shipping, "postal_code") ??
        this.getProp<string>(shipping, "zip_code"),
      parcel_qty: measurements.parcel_qty || 1,
      weight: measurements.weight_kg,
      declared_value: this.toMajorUnits(measurements.declared_value),
      currency,
      warehouse_code:
        this.getProp<string>(optionData, "warehouse_code") ??
        this.getProp<string>(data, "warehouse_code") ??
        this.options_.default_warehouse_code,
      business_type:
        this.getProp<string>(optionData, "business_type") ??
        this.getProp<string>(data, "business_type") ??
        this.options_.default_business_type ??
        "BDS",
      duty_type:
        this.getProp<string>(optionData, "duty_type") ??
        this.getProp<string>(data, "duty_type") ??
        this.options_.default_duty_type ??
        "U",
      sender_country:
        this.getProp<string>(optionData, "sender_country") ??
        this.options_.default_origin_country,
      package_list: measurements.packages,
    }

    return this.compactObject(payload)
  }

  protected extractEstimatedAmount(input: any): number {
    const data = this.ensureObject(input)

    if (!data) {
      return 0
    }

    const amountCandidate =
      data?.total_fee ??
      data?.total_price ??
      data?.estimated_fee ??
      data?.estimated_price ??
      data?.amount ??
      data?.price ??
      (Array.isArray(data?.charges_detail)
        ? data.charges_detail.reduce(
            (sum: number, charge: Record<string, unknown>) =>
              sum + Number(charge?.amount ?? 0),
            0
          )
        : undefined)

    return this.toMinorUnits(amountCandidate)
  }

  protected extractList(input: any): LogisticsProduct[] {
    const data = this.ensureObject(input)

    if (Array.isArray(data)) {
      return data
    }

    if (Array.isArray(data?.list)) {
      return data.list as LogisticsProduct[]
    }

    if (Array.isArray(data?.logistics_product_list)) {
      return data.logistics_product_list as LogisticsProduct[]
    }

    if (Array.isArray(data?.items)) {
      return data.items as LogisticsProduct[]
    }

    return []
  }

  protected ensureObject(value: any): Record<string, any> | undefined {
    if (!value) {
      return undefined
    }

    if (typeof value === "string") {
      try {
        return JSON.parse(value)
      } catch {
        return undefined
      }
    }

    if (typeof value === "object") {
      return value
    }

    return undefined
  }

  protected getPackageMeasurements(context: CalculateShippingOptionPriceContext) {
    const packages: Record<string, unknown>[] = []

    const accumulator = (context?.items ?? []).reduce(
      (acc, item) => {
        const lineItem = item as Record<string, any>
        const quantity = this.toNumber(lineItem.quantity)

        if (!quantity) {
          return acc
        }

        const variant = (lineItem.variant ?? {}) as Record<string, any>
        const weight = this.toNumber(variant.weight)
        const length = this.toNumber(variant.length)
        const width = this.toNumber(variant.width)
        const height = this.toNumber(variant.height)
        const itemDeclaredValue =
          this.toMinorUnits(lineItem.unit_price) * quantity

        acc.weight_grams += weight * quantity
        acc.declared_value += itemDeclaredValue
        acc.parcel_qty += quantity

        packages.push(
          this.compactObject({
            weight,
            length,
            width,
            height,
            quantity,
            sku: variant?.sku ?? lineItem.variant_id,
          })
        )

        return acc
      },
      {
        weight_grams: 0,
        declared_value: 0,
        parcel_qty: 0,
      }
    )

    return {
      weight_grams: accumulator.weight_grams,
      weight_kg: accumulator.weight_grams / 1000 || 0,
      declared_value: accumulator.declared_value,
      parcel_qty: accumulator.parcel_qty || 1,
      packages,
    }
  }

  protected resolveCurrency(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: CalculateShippingOptionPriceContext
  ): string {
    return (
      (context as Record<string, any>)?.currency_code ??
      this.getProp<string>(optionData, "currency") ??
      this.getProp<string>(data, "currency") ??
      this.options_.default_currency ??
      "USD"
    )
  }

  protected toMinorUnits(value: any): number {
    const numericValue = this.toNumber(value)

    if (Number.isInteger(numericValue)) {
      return numericValue
    }

    if (Number.isNaN(numericValue)) {
      return 0
    }

    return Math.round(numericValue * 100)
  }

  protected toMajorUnits(value: number) {
    return Math.round(value ?? 0) / 100
  }

  protected toNumber(value: any): number {
    if (value === undefined || value === null) {
      return 0
    }

    if (typeof value === "number") {
      return value
    }

    if (typeof value === "string") {
      const parsed = Number(value)
      return Number.isNaN(parsed) ? 0 : parsed
    }

    if (typeof value === "object") {
      if (typeof value.toNumber === "function") {
        return value.toNumber()
      }

      if (typeof value.valueOf === "function") {
        const numericValue = value.valueOf()
        if (typeof numericValue === "number") {
          return numericValue
        }
      }
    }

    return 0
  }

  protected getProp<T>(
    source: Record<string, unknown> | undefined,
    key: string
  ): T | undefined {
    if (!source) {
      return undefined
    }

    return source[key] as T | undefined
  }

  protected compactObject<T extends Record<string, unknown>>(input: T): T {
    return Object.entries(input).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        acc[key as keyof T] = value as T[keyof T]
      }

      return acc
    }, {} as T)
  }
}

export default FourPXFulfillmentProviderService
