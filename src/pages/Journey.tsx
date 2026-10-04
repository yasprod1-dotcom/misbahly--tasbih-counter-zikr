import { PageHeader } from '@/components/app/primitives'
import { HistoryTab } from '@/components/journey/HistoryTab'
import { InsightsTab } from '@/components/journey/InsightsTab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslation } from 'react-i18next'

export default function Journey() {
  const { t } = useTranslation()
  return (
    <div>
      <PageHeader title={t("My Journey")} subtitle={t("Humble, meaningful, yours alone.")} />
      <Tabs defaultValue="insights" className="px-0">
        <TabsList className="mx-5 mb-4 grid grid-cols-2">
          <TabsTrigger value="insights">{t("Insights")}</TabsTrigger>
          <TabsTrigger value="history">{t("History")}</TabsTrigger>
        </TabsList>
        <TabsContent value="insights" className="mt-0"><InsightsTab /></TabsContent>
        <TabsContent value="history" className="mt-0"><HistoryTab /></TabsContent>
      </Tabs>
    </div>
  )
}
