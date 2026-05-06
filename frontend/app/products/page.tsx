'use client'

import { AppShell } from '@/components/crm/app-shell'
import { ProductsView } from '@/components/crm/products-view'
import { ProductsProvider } from '@/lib/products-context'

export default function ProductsPage() {
  return (
    <ProductsProvider>
      <AppShell>
        <ProductsView />
      </AppShell>
    </ProductsProvider>
  )
}