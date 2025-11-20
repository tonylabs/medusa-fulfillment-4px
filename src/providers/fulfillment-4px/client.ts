import crypto from "crypto"
import { MedusaError } from "@medusajs/framework/utils"
import type { Options } from "./service"

type HttpMethod = "GET" | "POST"
type RequestParams = Record<string, unknown>

export class Client {
  protected options: Options
  protected baseUrl: string
  protected timeout: number

  constructor(options: Options = {}) {
    this.options = options ?? {}
    const baseHost = this.options?.sandbox
      ? "https://open-test.4px.com"
      : "https://open.4px.com"
    this.baseUrl = `${baseHost}/router/api/service`
    this.timeout = this.options?.timeout ?? 10000
  }

  async post(
    methodName: string,
    payload: Record<string, unknown> = {},
    params: RequestParams = {}
  ) {
    return this.request(methodName, payload, "POST", params)
  }

  async get(methodName: string, params: RequestParams = {}) {
    return this.request(methodName, undefined, "GET", params)
  }

  protected async request(
    methodName: string,
    payload: Record<string, unknown> | undefined,
    httpMethod: HttpMethod,
    additionalParams: RequestParams
  ) {
    this.assertCredentials(methodName)

    const baseParams: RequestParams = {
      method: methodName,
      app_key: this.options.api_key,
      v: this.options.api_version ?? "1.0",
      timestamp: Date.now().toString(),
      format: "json",
      ...additionalParams,
    }

    if (this.options.access_token) {
      baseParams.access_token = this.options.access_token
    }

    if (this.options.language) {
      baseParams.language = this.options.language
    }
    const signature = this.generateSignature(baseParams, payload)
    const queryParams = new URLSearchParams()

    Object.entries({
      ...baseParams,
      sign: signature,
    }).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return
      }
      queryParams.append(key, `${value}`)
    })

    //console.log(`4PX Global Parameters: ${queryParams}`)
    //console.log(`4PX Signature: ${signature}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const url = `${this.baseUrl}?${queryParams.toString()}`
      const response = await fetch(url, {
        method: httpMethod,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
        },
        body: httpMethod === "POST" ? JSON.stringify(payload ?? {}) : undefined,
        signal: controller.signal,
      })

      const responseText = await response.text()
      let responseBody: any
      try {
        responseBody = responseText ? JSON.parse(responseText) : {}
      } catch {
        responseBody = responseText
      }

      if (!response.ok) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          `4PX ${methodName} request failed (status ${response.status}): ${this.stringifyError(
            responseBody
          )}`
        )
      }

      return this.parseResponse(methodName, responseBody)
    } catch (error) {
      throw this.normalizeError(error, methodName)
    } finally {
      clearTimeout(timeoutId)
    }
  }

  protected assertCredentials(methodName: string) {
    if (!this.options.api_key || !this.options.api_secret) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `4PX credentials are not configured. Unable to call ${methodName}.`
      )
    }
  }

  protected generateSignature(
    params: RequestParams,
    payload: Record<string, unknown> | undefined
  ) {
    const body = payload && Object.keys(payload).length ? payload : undefined
    const sortableParams = Object.keys(params)
      .filter((key) => !["access_token", "language"].includes(key))
      .sort((a, b) => (a < b ? -1 : 1))
    const serializedParams = sortableParams
      .map((key) => `${key}${params[key] ?? ""}`)
      .join("")
    const serializedBody = body ? JSON.stringify(body) : ""
    const signPayload = `${serializedParams}${serializedBody}${this.options.api_secret}`

    return crypto.createHash("md5").update(signPayload).digest("hex")
  }

  protected parseResponse(methodName: string, rawResponse: any) {
    if (!rawResponse || typeof rawResponse !== "object") {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `4PX ${methodName} response is malformed.`
      )
    }

    const result = rawResponse.result ?? rawResponse.Result ?? rawResponse.status

    if (
      result !== undefined &&
      result !== null &&
      `${result}` !== "1" &&
      `${result}`.toUpperCase?.() !== "SUCCESS"
    ) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `4PX ${methodName} request failed: ${this.stringifyError(
          rawResponse.errors ?? rawResponse.msg ?? result
        )}`
      )
    }

    return rawResponse
  }

  protected normalizeError(error: unknown, methodName: string) {
    if (error instanceof MedusaError) {
      return error
    }

    if ((error as Error)?.name === "AbortError") {
      return new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `4PX ${methodName} request timed out after ${this.timeout}ms`
      )
    }

    if (error instanceof Error) {
      return new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `4PX ${methodName} request failed: ${error.message}`
      )
    }

    return new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `4PX ${methodName} request failed: ${
        (error as Error)?.message ?? "Unknown error"
      }`
    )
  }

  protected stringifyError(input: unknown) {
    if (!input) {
      return "Unknown error"
    }

    if (typeof input === "string") {
      return input
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.stringifyError(item)).join(", ")
    }

    if (typeof input === "object") {
      return JSON.stringify(input)
    }

    return `${input}`
  }
}
