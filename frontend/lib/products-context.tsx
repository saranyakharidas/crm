'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import { API_BASE_URL, clearStoredAccessToken, getStoredAccessToken, TOKEN_STORAGE_KEY } from '@/lib/auth'

export type ProductCategory = 'software' | 'hardware' | 'service' | 'support' | 'training' | 'addon'
export type ProductStatus = 'active' | 'inactive' | 'discontinued'
export type PricingModel = 'one_time' | 'monthly' | 'annual' | 'per_user' | 'usage'

export interface ProductVariant {
  id: string
  name: string
  price: number
  maxUsers?: number
}

export interface Product {
  id: string
  name: string
  code: string
  description: string
  category: ProductCategory
  status: ProductStatus
  pricingModel: PricingModel
  basePrice: number
  variants: ProductVariant[]
  taxRate: number
  unit: string
  tags: string[]
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface PriceBookEntry {
  productId: string
  price: number
  discount?: number
}

export interface PriceBook {
  id: string
  name: string
  description: string
  currency: string
  isDefault: boolean
  entries: PriceBookEntry[]
  validFrom?: string
  validTo?: string
  createdAt: string
  updatedAt: string
}

type ProductPayload = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
type PriceBookPayload = Omit<PriceBook, 'id' | 'createdAt' | 'updatedAt'>

interface ApiProductVariant {
  id: string
  name: string
  price: number
  max_users?: number | null
}

interface ApiProduct {
  id: string
  name: string
  code: string
  description: string
  category: ProductCategory
  status: ProductStatus
  pricing_model: PricingModel
  base_price: number
  variants: ApiProductVariant[]
  tax_rate: number
  unit: string
  tags: string[]
  image_url?: string | null
  created_at: string
  updated_at: string
}

interface ApiPriceBookEntry {
  id?: string | null
  product_id: string
  price: number
  discount?: number | null
}

interface ApiPriceBook {
  id: string
  name: string
  description: string
  currency: string
  is_default: boolean
  entries: ApiPriceBookEntry[]
  valid_from?: string | null
  valid_to?: string | null
  created_at: string
  updated_at: string
}

interface ProductsContextValue {
  products: Product[]
  priceBooks: PriceBook[]
  isLoading: boolean
  error: string | null
  refreshProducts: () => Promise<void>
  addProduct: (p: ProductPayload) => Promise<void>
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  addPriceBook: (pb: PriceBookPayload) => Promise<void>
  updatePriceBook: (id: string, updates: Partial<PriceBook>) => Promise<void>
  deletePriceBook: (id: string) => Promise<void>
  getPriceForProduct: (productId: string, priceBookId: string) => number | null
}

const ProductsContext = createContext<ProductsContextValue | null>(null)

function mapApiProduct(product: ApiProduct): Product {
  return {
    id: product.id,
    name: product.name,
    code: product.code,
    description: product.description,
    category: product.category,
    status: product.status,
    pricingModel: product.pricing_model,
    basePrice: Number(product.base_price ?? 0),
    variants: (product.variants ?? []).map(variant => ({
      id: variant.id,
      name: variant.name,
      price: Number(variant.price ?? 0),
      ...(variant.max_users !== null && variant.max_users !== undefined
        ? { maxUsers: variant.max_users }
        : {}),
    })),
    taxRate: Number(product.tax_rate ?? 0),
    unit: product.unit,
    tags: product.tags ?? [],
    imageUrl: product.image_url ?? undefined,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  }
}

function mapProductPayload(product: ProductPayload | Partial<Product>) {
  return {
    name: product.name,
    code: product.code,
    description: product.description,
    category: product.category,
    status: product.status,
    pricing_model: product.pricingModel,
    base_price: product.basePrice,
    variants: product.variants?.map(variant => ({
      id: variant.id,
      name: variant.name,
      price: variant.price,
      max_users: variant.maxUsers,
    })),
    tax_rate: product.taxRate,
    unit: product.unit,
    tags: product.tags,
    image_url: product.imageUrl,
  }
}

function mapApiPriceBook(priceBook: ApiPriceBook): PriceBook {
  return {
    id: priceBook.id,
    name: priceBook.name,
    description: priceBook.description,
    currency: priceBook.currency,
    isDefault: priceBook.is_default,
    entries: (priceBook.entries ?? []).map(entry => ({
      productId: entry.product_id,
      price: Number(entry.price ?? 0),
      ...(entry.discount !== null && entry.discount !== undefined
        ? { discount: Number(entry.discount) }
        : {}),
    })),
    validFrom: priceBook.valid_from ?? undefined,
    validTo: priceBook.valid_to ?? undefined,
    createdAt: priceBook.created_at,
    updatedAt: priceBook.updated_at,
  }
}

function mapPriceBookPayload(priceBook: PriceBookPayload | Partial<PriceBook>) {
  return {
    name: priceBook.name,
    description: priceBook.description,
    currency: priceBook.currency,
    is_default: priceBook.isDefault,
    entries: priceBook.entries?.map(entry => ({
      product_id: entry.productId,
      price: entry.price,
      discount: entry.discount,
    })),
    valid_from: priceBook.validFrom,
    valid_to: priceBook.validTo,
  }
}

function getAccessToken() {
  return getStoredAccessToken()
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  if (!token) {
    throw new Error(`No auth token found. Please sign in again to restore "${TOKEN_STORAGE_KEY}".`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`

    try {
      const data = await response.json()
      if (typeof data?.detail === 'string') {
        detail = data.detail
      }
    } catch {
      // Ignore JSON parsing errors.
    }

    if (response.status === 401 && typeof window !== 'undefined') {
      clearStoredAccessToken()
      const nextPath = `${window.location.pathname}${window.location.search}`
      window.location.assign(`/login?next=${encodeURIComponent(nextPath)}`)
      detail = 'Your session expired. Please sign in again.'
    }

    throw new Error(detail)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [priceBooks, setPriceBooks] = useState<PriceBook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [productsData, priceBooksData] = await Promise.all([
        apiRequest<ApiProduct[]>('/products'),
        apiRequest<ApiPriceBook[]>('/price-books'),
      ])
      setProducts(productsData.map(mapApiProduct))
      setPriceBooks(priceBooksData.map(mapApiPriceBook))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load products'
      setError(message)
      setProducts([])
      setPriceBooks([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshProducts()
  }, [refreshProducts])

  const addProduct = useCallback(async (product: ProductPayload) => {
    try {
      const data = await apiRequest<ApiProduct>('/products', {
        method: 'POST',
        body: JSON.stringify(mapProductPayload(product)),
      })

      const newProduct = mapApiProduct(data)
      setProducts(prev => [newProduct, ...prev])
      toast.success(`Product "${product.name}" created`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create product'
      toast.error(message)
      throw err
    }
  }, [])

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    try {
      const data = await apiRequest<ApiProduct>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(mapProductPayload(updates)),
      })

      const updatedProduct = mapApiProduct(data)
      setProducts(prev => prev.map(product => (product.id === id ? updatedProduct : product)))
      toast.success('Product updated')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update product'
      toast.error(message)
      throw err
    }
  }, [])

  const deleteProduct = useCallback(async (id: string) => {
    try {
      await apiRequest<void>(`/products/${id}`, {
        method: 'DELETE',
      })

      setProducts(prev => prev.filter(product => product.id !== id))
      setPriceBooks(prev =>
        prev.map(priceBook => ({
          ...priceBook,
          entries: priceBook.entries.filter(entry => entry.productId !== id),
        })),
      )
      toast.success('Product deleted')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete product'
      toast.error(message)
      throw err
    }
  }, [])

  const addPriceBook = useCallback(async (priceBook: PriceBookPayload) => {
    try {
      const data = await apiRequest<ApiPriceBook>('/price-books', {
        method: 'POST',
        body: JSON.stringify(mapPriceBookPayload(priceBook)),
      })

      const newPriceBook = mapApiPriceBook(data)
      setPriceBooks(prev => [newPriceBook, ...prev.filter(book => !newPriceBook.isDefault || !book.isDefault)])
      toast.success(`Price book "${priceBook.name}" created`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create price book'
      toast.error(message)
      throw err
    }
  }, [])

  const updatePriceBook = useCallback(async (id: string, updates: Partial<PriceBook>) => {
    try {
      const data = await apiRequest<ApiPriceBook>(`/price-books/${id}`, {
        method: 'PUT',
        body: JSON.stringify(mapPriceBookPayload(updates)),
      })

      const updatedPriceBook = mapApiPriceBook(data)
      setPriceBooks(prev =>
        prev.map(priceBook => (priceBook.id === id ? updatedPriceBook : priceBook)).filter(book =>
          updatedPriceBook.isDefault ? book.id === id || !book.isDefault : true,
        ),
      )
      toast.success('Price book updated')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update price book'
      toast.error(message)
      throw err
    }
  }, [])

  const deletePriceBook = useCallback(async (id: string) => {
    try {
      await apiRequest<void>(`/price-books/${id}`, {
        method: 'DELETE',
      })

      setPriceBooks(prev => prev.filter(book => book.id !== id))
      toast.success('Price book deleted')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete price book'
      toast.error(message)
      throw err
    }
  }, [])

  const getPriceForProduct = useCallback((productId: string, priceBookId: string) => {
    const priceBook = priceBooks.find(book => book.id === priceBookId)
    if (!priceBook) return null
    const entry = priceBook.entries.find(item => item.productId === productId)
    return entry?.price ?? null
  }, [priceBooks])

  return (
    <ProductsContext.Provider
      value={{
        products,
        priceBooks,
        isLoading,
        error,
        refreshProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        addPriceBook,
        updatePriceBook,
        deletePriceBook,
        getPriceForProduct,
      }}
    >
      {children}
    </ProductsContext.Provider>
  )
}

export function useProducts() {
  const ctx = useContext(ProductsContext)
  if (!ctx) throw new Error('useProducts must be inside ProductsProvider')
  return ctx
}
