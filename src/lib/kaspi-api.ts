/**
 * Kaspi.kz API клиент для интеграции с маркетплейсом
 * Поддерживает работу с заказами и товарами
 */

import { z } from 'zod';

// Схемы валидации данных
export const OrderEntrySchema = z.object({
  id: z.string(),
  unitType: z.string(),
  quantity: z.number(),
  totalPrice: z.number(),
  weight: z.number().optional(),
  entryNumber: z.string(),
  category: z.string(),
  title: z.string(),
  deliveryCost: z.number(),
  basePrice: z.number(),
  isImeiRequired: z.boolean(),
});

export const OrderSchema = z.object({
  id: z.string(),
  code: z.string(),
  status: z.string(),
  entries: z.array(OrderEntrySchema),
  totalPrice: z.number().optional(),
  createdAt: z.string().optional(),
});

export const ProductSchema = z.object({
  sku: z.string().min(1, "SKU обязателен"),
  title: z.string().min(1, "Название товара обязательно"),
  brand: z.string().min(1, "Бренд обязателен"), 
  category: z.string().min(1, "Категория обязательна"),
  description: z.string().min(1, "Описание обязательно"),
  images: z.array(z.object({
    url: z.string().url("Некорректный URL изображения")
  })),
  attributes: z.array(z.object({
    code: z.string(),
    value: z.string()
  }))
});

export const CategorySchema = z.object({
  code: z.string(),
  name: z.string(),
  parentCode: z.string().optional(),
});

export const AttributeSchema = z.object({
  code: z.string(),
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  values: z.array(z.string()).optional(),
});

// Типы данных
export type OrderEntry = z.infer<typeof OrderEntrySchema>;
export type Order = z.infer<typeof OrderSchema>;
export type Product = z.infer<typeof ProductSchema>;  
export type Category = z.infer<typeof CategorySchema>;
export type Attribute = z.infer<typeof AttributeSchema>;

// Статусы заказов
export enum OrderStatus {
  NEW = 'NEW',
  ACCEPTED_BY_MERCHANT = 'ACCEPTED_BY_MERCHANT',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  PICKING = 'PICKING',
  DELIVERING = 'DELIVERING',
}

// Параметры для запросов
export interface OrdersParams {
  filter?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface AcceptOrderRequest {
  type: 'orders';
  id: string;
  code: string;
  status: OrderStatus.ACCEPTED_BY_MERCHANT;
}

// Kaspi API клиент
export class KaspiApiClient {
  private readonly baseUrl = 'https://kaspi.kz/shop/api/v2';
  private readonly authToken: string;

  constructor(authToken: string) {
    this.authToken = authToken;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'X-Auth-Token': this.authToken,
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kaspi API Error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  // Работа с заказами
  async getOrders(params: OrdersParams = {}): Promise<Order[]> {
    const searchParams = new URLSearchParams();
    
    if (params.filter) searchParams.append('filter', params.filter);
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());

    const queryString = searchParams.toString();
    const endpoint = `/orders${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.makeRequest<{ data: any[] }>(endpoint);
    return response.data.map(order => OrderSchema.parse(order));
  }

  async getOrderEntries(orderId: string): Promise<OrderEntry[]> {
    const response = await this.makeRequest<{ data: any[] }>(`/orders/${orderId}/entries`);
    return response.data.map(entry => OrderEntrySchema.parse(entry));
  }

  async acceptOrder(orderId: string, code: string): Promise<void> {
    const body: AcceptOrderRequest = {
      type: 'orders',
      id: orderId,
      code: code,
      status: OrderStatus.ACCEPTED_BY_MERCHANT,
    };

    await this.makeRequest(`/orders/${orderId}/status`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const body: UpdateOrderStatusRequest = { status };

    await this.makeRequest(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.makeRequest(`/orders/${orderId}`, {
      method: 'DELETE',
    });
  }

  async createWaybill(orderId: string): Promise<void> {
    await this.makeRequest(`/orders/${orderId}/waybill`, {
      method: 'POST',
    });
  }

  async setImei(orderId: string, imei: string): Promise<void> {
    await this.makeRequest(`/orders/${orderId}/imei`, {
      method: 'PUT',
      body: JSON.stringify({ imei }),
    });
  }

  async modifyOrderEntry(
    orderId: string, 
    entryId: string, 
    changes: { weight?: number; quantity?: number; remove?: boolean }
  ): Promise<void> {
    await this.makeRequest(`/orders/${orderId}/entries/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(changes),
    });
  }

  // Работа с товарами и категориями
  async getCategories(): Promise<Category[]> {
    const response = await this.makeRequest<{ data: any[] }>('/categories');
    return response.data.map(category => CategorySchema.parse(category));
  }

  async getCategoryAttributes(categoryCode: string): Promise<Attribute[]> {
    const response = await this.makeRequest<{ data: any[] }>(`/categories/${categoryCode}/attributes`);
    return response.data.map(attr => AttributeSchema.parse(attr));
  }

  async getProductSchema(): Promise<any> {
    return this.makeRequest('/goods/schema');
  }

  async addProduct(product: Product): Promise<{ uploadCode: string; status: string }> {
    const validatedProduct = ProductSchema.parse(product);
    const response = await this.makeRequest<{ uploadCode: string; status: string }>('/goods', {
      method: 'POST',
      body: JSON.stringify(validatedProduct),
    });

    return response;
  }
}

// Хелперы для работы со статусами
export const getOrderStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    'NEW': 'Новый',
    'ACCEPTED_BY_MERCHANT': 'Принят продавцом',
    'CANCELLED': 'Отменен',
    'COMPLETED': 'Завершен',
    'PICKING': 'Собирается',
    'DELIVERING': 'Доставляется',
  };

  return statusLabels[status] || status;
};

export const getOrderStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case 'NEW':
      return 'default';
    case 'ACCEPTED_BY_MERCHANT':
    case 'PICKING':
    case 'DELIVERING':
      return 'secondary';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'default';
  }
};