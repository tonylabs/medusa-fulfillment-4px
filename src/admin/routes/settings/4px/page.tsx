import { defineRouteConfig } from "@medusajs/admin-sdk"
import { TruckFast } from "@medusajs/icons"
import { Button, Container, Heading, Checkbox, Select, Table, Text, toast, Toaster, CurrencyInput } from "@medusajs/ui"
import { FormEvent, useEffect, useMemo, useState } from "react"

type CurrencyInfo = {
  code: string
  name?: string
  symbol?: string
}

type SupportedCurrency = {
  currency_code: string
  is_default?: boolean
  currency?: CurrencyInfo
}

type Store = {
  id: string
  metadata?: Record<string, any> | null
  supported_currencies?: SupportedCurrency[]
}

type MappingState = Record<string, { target: string; rate: string }>
type StoredMappings = Record<string, { target: string; rate: number }>
type RegionCountry = {
  id: string
  iso_2: string
  iso_3?: string
  num_code?: number
  name?: string
  display_name?: string
}

const SettingsPage = () => {
  const [store, setStore] = useState<Store | null>(null)
  const [currencies, setCurrencies] = useState<SupportedCurrency[]>([])
  const [mappings, setMappings] = useState<MappingState>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transportMode, setTransportMode] = useState<string>("3")
  const [autoLoad, setAutoLoad] = useState<boolean>(false)
  const [language, setLanguage] = useState<string>("en")
  const [languageAutoLoad, setLanguageAutoLoad] = useState<boolean>(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [sourceCountryCode, setSourceCountryCode] = useState<string>("")
  const [countryOptions, setCountryOptions] = useState<{ code: string; name?: string }[]>([])
  const [sourceCountryAutoLoad, setSourceCountryAutoLoad] = useState<boolean>(false)
  const preferredTarget = useMemo(() => {
    return (
      currencies.find((currency) => currency.is_default)?.currency_code ??
      currencies[0]?.currency_code ??
      ""
    )
  }, [currencies])

  useEffect(() => {
    loadStore()
    loadTransportMode()
    loadLanguage()
    loadCountries()
    loadSourceCountry()
  }, [])

  const loadStore = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/admin/stores?limit=1", {
        credentials: "include",
        headers: { Accept: "application/json" },
      })

      if (!response.ok) {
        throw new Error(`Failed to load stores (${response.status})`)
      }

      const payload = await response.json()
      const fetchedStore: Store | undefined = payload?.stores?.[0]

      if (!fetchedStore) {
        throw new Error("No store found. Add a store to manage 4PX settings.")
      }

      const supported = fetchedStore.supported_currencies ?? []
      const storedMappings =
        (fetchedStore.metadata?.fourpx_exchange_mappings as StoredMappings) ??
        {}

      const defaultTarget =
        supported.find((currency) => currency.is_default)?.currency_code ??
        supported[0]?.currency_code ??
        ""

      const normalizedMappings = supported.reduce<MappingState>(
        (acc, currency) => {
          const code = currency.currency_code
          const existing = storedMappings?.[code]

          acc[code] = {
            target: existing?.target ?? defaultTarget ?? code,
            rate:
              existing?.rate !== undefined
                ? String(existing.rate)
                : code === defaultTarget
                  ? "1"
                  : "",
          }

          return acc
        },
        {}
      )

      setStore(fetchedStore)
      setCurrencies(supported)
      setMappings(normalizedMappings)
    } catch (err) {
      setError((err as Error).message ?? "Failed to load currencies.")
    } finally {
      setLoading(false)
    }
  }

  const updateMapping = (
    currencyCode: string,
    payload: Partial<{ target: string; rate: string }>
  ) => {
    setMappings((previous) => ({
      ...previous,
      [currencyCode]: { ...(previous[currencyCode] ?? {}), ...payload },
    }))
  }

  const loadTransportMode = async () => {
    try {
      const response = await fetch(`/admin/fourpx/settings?name=transport_mode`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      })
      if (response.ok) {
        const data = await response.json()
        if (data?.value) {
          setTransportMode(String(data.value))
        }
        if (typeof data?.auto_load === "boolean") {
          setAutoLoad(data.auto_load)
        }
      }
    } catch {}
  }

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSettingsSaving(true)
    try {
      const resp = await fetch(`/admin/fourpx/settings`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            { name: "transport_mode", value: transportMode, auto_load: autoLoad },
            { name: "language", value: language, auto_load: languageAutoLoad },
            { name: "source_country_code", value: sourceCountryCode, auto_load: sourceCountryAutoLoad },
          ],
        }),
      })
      if (!resp.ok) {
        const details = await resp.text()
        throw new Error(`Failed to save settings (${resp.status}): ${details}`)
      }

      toast("Settings saved")
    } catch (err) {
      toast(
        `Save failed: ${((err as Error).message ?? "Failed to save settings.")}`
      )
    } finally {
      setSettingsSaving(false)
    }
  }

  const loadLanguage = async () => {
    try {
      const response = await fetch(`/admin/fourpx/settings?name=language`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      })
      if (response.ok) {
        const data = await response.json()
        if (typeof data?.value === "string") {
          setLanguage(data.value)
        }
        if (typeof data?.auto_load === "boolean") {
          setLanguageAutoLoad(data.auto_load)
        }
      }
    } catch {}
  }

  const loadSourceCountry = async () => {
    try {
      const response = await fetch(`/admin/fourpx/settings?name=source_country_code`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      })
      if (response.ok) {
        const data = await response.json()
        if (typeof data?.value === "string") {
          setSourceCountryCode(data.value)
        }
        if (typeof data?.auto_load === "boolean") {
          setSourceCountryAutoLoad(data.auto_load)
        }
      }
    } catch {}
  }

  const loadCountries = async () => {
    try {
      const response = await fetch(`/admin/regions?limit=10`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      })
      if (!response.ok) return
      const payload = await response.json()
      const regions: { countries?: RegionCountry[] }[] = payload?.regions ?? []
      const map: Record<string, { code: string; name?: string }> = {}
      for (const region of regions) {
        for (const c of region.countries ?? []) {
          const code = c.iso_2?.toUpperCase()
          if (!code) continue
          if (!map[code]) {
            map[code] = { code, name: c.display_name || c.name }
          }
        }
      }
      const options = Object.values(map).sort((a, b) => {
        const an = (a.name || a.code).toLowerCase()
        const bn = (b.name || b.code).toLowerCase()
        return an < bn ? -1 : an > bn ? 1 : 0
      })
      setCountryOptions(options)
      if (!sourceCountryCode && options.length) {
        setSourceCountryCode(options[0].code)
      }
    } catch {}
  }

  

  const persistMappings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!store) {
      setError("Cannot save settings without a store.")
      return
    }

    const normalized: Record<string, { target: string; rate: number }> = {}

    for (const currency of currencies) {
      const code = currency.currency_code
      const mapping = mappings[code]
      const target = mapping?.target || preferredTarget || code
      const parsedRate = Number(mapping?.rate)

      if (!target) {
        setError(`Select a target currency for ${code}.`)
        return
      }

      if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
        setError(`Provide a valid exchange rate for ${code}.`)
        return
      }

      normalized[code] = {
        target,
        rate: parsedRate,
      }
    }

    setSaving(true)
    setError(null)

    try {
      const nextMetadata = {
        ...(store.metadata ?? {}),
        fourpx_exchange_mappings: normalized,
      }

      const response = await fetch(`/admin/stores/${store.id}`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ metadata: nextMetadata }),
      })

      if (!response.ok) {
        const details = await response.text()
        throw new Error(
          `Failed to save mappings (${response.status}): ${details}`
        )
      }

      setStore((previous) =>
        previous ? { ...previous, metadata: nextMetadata } : previous
      )
      toast("Mappings saved")
    } catch (err) {
      toast(
        `Save failed: ${((err as Error).message ?? "Failed to save exchange mappings.")}`
      )
    } finally {
      setSaving(false)
    }
  }

  const renderTable = () => {
    if (!currencies.length) {
      return (
        <Text className="text-ui-fg-subtle">
          No enabled currencies found for this store.
        </Text>
      )
    }

    return (
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell className="w-1/3">Currency</Table.HeaderCell>
            <Table.HeaderCell className="w-1/3">Convert To</Table.HeaderCell>
            <Table.HeaderCell className="w-1/3">Exchange Rate</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {currencies.map((currency) => {
            const code = currency.currency_code
            const mapping = mappings[code] ?? {
              target: preferredTarget || code,
              rate: code === preferredTarget ? "1" : "",
            }
            return (
              <Table.Row key={code}>
                <Table.Cell>
                  {currency.currency?.name && (
                    <Text size="base">
                      {currency.currency.name}
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Select
                    value={mapping.target}
                    onValueChange={(value) =>
                      updateMapping(code, { target: value })
                    }
                  >
                    <Select.Trigger className="w-full">
                      <Select.Value placeholder="Select currency" />
                    </Select.Trigger>
                    <Select.Content>
                      {currencies.map((option) => (
                        <Select.Item
                          key={option.currency_code}
                          value={option.currency_code}
                        >
                          {option.currency?.name ? option.currency.name : ""}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </Table.Cell>
                <Table.Cell>
                  {(() => {
                    const target = mapping.target || preferredTarget || code
                    const meta = currencies.find((c) => c.currency_code === target)
                    const symbol = meta?.currency?.symbol ?? target.toUpperCase()
                    const targetCode = target.toLowerCase()
                    return (
                      <CurrencyInput
                        className="w-full"
                        symbol={symbol}
                        code={targetCode}
                        value={mapping.rate}
                        onChange={(event) =>
                          updateMapping(code, { rate: event.target.value })
                        }
                      />
                    )
                  })()}
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table>
    )
  }

  return (
    <>
      <Toaster />
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="space-y-1">
            <Heading level="h2">4PX Settings</Heading>
            <Text className="text-ui-fg-subtle">
              Map each enabled store currency to a single target currency and rate used for 4PX.
            </Text>
          </div>
        </div>

        <form className="space-y-6 px-6 py-4" onSubmit={saveSettings} noValidate>
          <div className="flex flex-col gap-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col space-y-2">
                <Heading level="h3">Transport Mode</Heading>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Select value={transportMode} onValueChange={setTransportMode}>
                      <Select.Trigger className="w-full">
                        <Select.Value placeholder="Select mode" />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="1">All</Select.Item>
                        <Select.Item value="2">International Express Courier</Select.Item>
                        <Select.Item value="3">International Parcel</Select.Item>
                        <Select.Item value="4">Dedicated Line</Select.Item>
                        <Select.Item value="5">Unified Postal-Express Service</Select.Item>
                        <Select.Item value="6">Others</Select.Item>
                      </Select.Content>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={autoLoad} onCheckedChange={(v) => setAutoLoad(Boolean(v))} />
                    <Text>Auto Load</Text>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <Heading level="h3">Language</Heading>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Select value={language} onValueChange={setLanguage}>
                      <Select.Trigger className="w-full">
                        <Select.Value placeholder="Select language" />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="cn">CN</Select.Item>
                        <Select.Item value="en">EN</Select.Item>
                      </Select.Content>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={languageAutoLoad}
                      onCheckedChange={(v) => setLanguageAutoLoad(Boolean(v))}
                    />
                    <Text>Auto Load</Text>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col space-y-2">
                <Heading level="h3">Source Country Code</Heading>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Select value={sourceCountryCode} onValueChange={setSourceCountryCode}>
                      <Select.Trigger className="w-full">
                        <Select.Value placeholder="Select country" />
                      </Select.Trigger>
                      <Select.Content>
                        {countryOptions.map((opt) => (
                          <Select.Item key={opt.code} value={opt.code}>
                            {opt.code}
                            {opt.name ? ` — ${opt.name}` : ""}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={sourceCountryAutoLoad}
                      onCheckedChange={(v) => setSourceCountryAutoLoad(Boolean(v))}
                    />
                    <Text>Auto Load</Text>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-2">

              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" disabled={settingsSaving} isLoading={settingsSaving}>
                Save
              </Button>
            </div>
          </div>
        </form>

        <form onSubmit={persistMappings} noValidate>
          {loading && (
            <Text className="text-ui-fg-subtle">Loading currencies…</Text>
          )}

          {!loading && error && (
            <Text className="text-rose-600">{error}</Text>
          )}

          {!loading && !error && renderTable()}

          <div className="flex justify-end gap-3 px-3 py-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                loadStore()
                loadTransportMode()
                loadLanguage()
              }}
              disabled={loading || saving}
            >
              Refresh
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || saving || !currencies.length}
              isLoading={saving}
            >
              Save
            </Button>
          </div>
        </form>
      </Container>
    </>
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
