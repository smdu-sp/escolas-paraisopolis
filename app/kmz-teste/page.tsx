"use client"

import * as Tabs from "@radix-ui/react-tabs"
import { useEffect, useState } from "react"
import MapComponent from "@/components/map"

export default function KmzTestePage() {
  const [kmzList, setKmzList] = useState<string[]>([])
  const [value, setValue] = useState<string>("")

  useEffect(() => {
    fetch('/api/kmz/list')
      .then(r => r.json())
      .then((list: string[]) => {
        const allow = new Set(['SIRGAS_SHP_distrito.kmz','Locais_oficina.kmz'])
        const filtered = list.filter(url => allow.has(decodeURIComponent(url.split('/').pop() || '')))
        setKmzList(filtered)
        if (filtered && filtered.length) setValue(filtered[0])
      })
      .catch(() => {})
  }, [])

  return (
    <div className="w-dvw h-dvh overflow-hidden">
      <Tabs.Root value={value} onValueChange={setValue}>
        <div className="flex items-center gap-2 p-2 bg-background/80">
          <Tabs.List className="flex flex-wrap gap-2">
            {kmzList.map((url) => (
              <Tabs.Trigger key={url} value={url} className="px-3 py-1 rounded border text-xs">
                {decodeURIComponent(url.split('/').pop() || '')}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </div>
        <div className="relative w-full h-[calc(100dvh-48px)]">
          {kmzList.map((url) => (
            <Tabs.Content key={url} value={url} className="w-full h-full">
              <MapComponent
                center={[-46.7268192, -23.6157664]}
                zoom={15}
                kmzUrls={[url]}
              />
            </Tabs.Content>
          ))}
        </div>
      </Tabs.Root>
    </div>
  )
}