import { ExplorerHome } from '@/components/templates/ExplorerHome'
import { SummitHome } from '@/components/templates/SummitHome'
import type { PublicHomeData } from '@/lib/public-data'
import type { TemplateKey } from '@/lib/templates'
import { templateShellClass } from '@/lib/templates'

export function TenantHome({
  template,
  data,
  ticker,
}: {
  template: TemplateKey
  data: PublicHomeData
  ticker: string
}) {
  return (
    <main className={templateShellClass(template)} data-template={template}>
      {template === 'summit' ? (
        <SummitHome data={data} ticker={ticker} />
      ) : (
        <ExplorerHome data={data} ticker={ticker} />
      )}
    </main>
  )
}
