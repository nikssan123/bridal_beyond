import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/api/axios';
import type { Listing } from '@/data/mockData';
import type { RootState } from '@/app/store';

export type OrderStatus =
  | 'payment_pending'
  | 'payment_secured'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  priceCents: number;
  platformFeeCents: number;
  paymentIntentId: string;
  status: OrderStatus;
  shippingFullName: string;
  shippingPhone: string;
  shippingCity: string;
  shippingAddressLine: string;
  courier?: string | null;
  trackingNumber?: string | null;
  createdAt: string;
  updatedAt: string;
  listing?: Listing;
  hasOpenDispute?: boolean;
}

interface CreateOrderResponse {
  orderId: string;
  clientSecret: string;
}

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (
    payload: {
      listingId: string;
      shippingAddress: {
        fullName: string;
        phone: string;
        city: string;
        addressLine: string;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.post<CreateOrderResponse>('/orders', payload);
      return data;
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Failed to create order';
      return rejectWithValue(message);
    }
  }
);

function mapOrderListing(raw: any | null | undefined): Listing | undefined {
  if (!raw) return undefined;
  const images: string[] = Array.isArray(raw.images)
    ? raw.images.map((img: any) => img.url as string)
    : [];
  const sellerRaw = raw.seller ?? {};
  const memberSince =
    sellerRaw.member_since != null
      ? new Date(sellerRaw.member_since).getFullYear().toString()
      : '';

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    price: Number(raw.price),
    originalPrice: raw.original_price != null ? Number(raw.original_price) : 0,
    category: raw.category,
    size: raw.size,
    condition: raw.condition,
    color: raw.color,
    brand: raw.brand,
    measurements: {
      bust: raw.bust,
      waist: raw.waist,
      hips: raw.hips,
      length: raw.length,
    },
    images,
    seller: {
      id: sellerRaw.id,
      name: sellerRaw.name,
      avatar: sellerRaw.avatar_url ?? '',
      rating: 0,
      listings: 0,
      location: sellerRaw.location ?? '',
      memberSince,
      isVerified: !!sellerRaw.email_verified_at,
    },
    createdAt: raw.created_at,
  };
}

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<any>(`/orders/${orderId}`);
      const listing = mapOrderListing(data.listing);
      const order: Order = {
        id: data.id,
        listingId: data.listing_id,
        buyerId: data.buyer_id,
        sellerId: data.seller_id,
        priceCents: data.price_cents,
        platformFeeCents: data.platform_fee_cents,
        paymentIntentId: data.payment_intent_id,
        status: data.status,
        shippingFullName: data.shipping_full_name,
        shippingPhone: data.shipping_phone,
        shippingCity: data.shipping_city,
        shippingAddressLine: data.shipping_address_line,
        courier: data.courier,
        trackingNumber: data.tracking_number,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        listing,
        hasOpenDispute: !!data.has_open_dispute,
      };
      return order;
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Failed to load order';
      return rejectWithValue(message);
    }
  }
);

export const fetchMySellerOrders = createAsyncThunk(
  'orders/fetchMySellerOrders',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<any[]>('/orders/seller');
      const orders: Order[] = data.map((o) => ({
        id: o.id,
        listingId: o.listing_id,
        buyerId: o.buyer_id,
        sellerId: o.seller_id,
        priceCents: o.price_cents,
        platformFeeCents: o.platform_fee_cents,
        paymentIntentId: o.payment_intent_id,
        status: o.status,
        shippingFullName: o.shipping_full_name,
        shippingPhone: o.shipping_phone,
        shippingCity: o.shipping_city,
        shippingAddressLine: o.shipping_address_line,
        courier: o.courier,
        trackingNumber: o.tracking_number,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        listing: mapOrderListing(o.listing),
        hasOpenDispute: !!o.has_open_dispute,
      }));
      return orders;
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Failed to load seller orders';
      return rejectWithValue(message);
    }
  }
);

export const markAsShipped = createAsyncThunk(
  'orders/markAsShipped',
  async (
    payload: { orderId: string; courier: string; trackingNumber: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.post<any>(`/orders/${payload.orderId}/mark-shipped`, {
        courier: payload.courier,
        trackingNumber: payload.trackingNumber,
      });
      return data;
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Failed to mark as shipped';
      return rejectWithValue(message);
    }
  }
);

export const confirmReceived = createAsyncThunk(
  'orders/confirmReceived',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.post<any>(`/orders/${orderId}/confirm-received`);
      return data;
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Failed to confirm received';
      return rejectWithValue(message);
    }
  }
);

export const createDispute = createAsyncThunk(
  'orders/createDispute',
  async (
    payload: { orderId: string; reason: string; description?: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.post<any>(`/orders/${payload.orderId}/disputes`, {
        reason: payload.reason,
        description: payload.description,
      });
      return data;
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Failed to open dispute';
      return rejectWithValue(message);
    }
  }
);

interface OrdersState {
  currentOrder: Order | null;
  myOrders: Order[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  sellerOrdersStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: OrdersState = {
  currentOrder: null,
  myOrders: [],
  status: 'idle',
  sellerOrdersStatus: 'idle',
  error: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearCurrentOrder(state) {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to create order';
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action: PayloadAction<Order>) => {
        state.status = 'succeeded';
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to load order';
        state.currentOrder = null;
      })
      .addCase(fetchMySellerOrders.pending, (state) => {
        state.sellerOrdersStatus = 'loading';
      })
      .addCase(fetchMySellerOrders.fulfilled, (state, action: PayloadAction<Order[]>) => {
        state.sellerOrdersStatus = 'succeeded';
        state.myOrders = action.payload;
      })
      .addCase(fetchMySellerOrders.rejected, (state, action) => {
        state.sellerOrdersStatus = 'failed';
        state.error = (action.payload as string) || 'Failed to load seller orders';
      })
      .addCase(markAsShipped.fulfilled, (state, action) => {
        const updatedRaw = action.payload;
        const updatedId = updatedRaw.id as string;
        const updatedStatus = updatedRaw.status as OrderStatus;
        state.currentOrder =
          state.currentOrder && state.currentOrder.id === updatedId
            ? {
                ...state.currentOrder,
                status: updatedStatus,
                courier: updatedRaw.courier,
                trackingNumber: updatedRaw.tracking_number,
                updatedAt: updatedRaw.updated_at,
              }
            : state.currentOrder;
        state.myOrders = state.myOrders.map((o) =>
          o.id === updatedId
            ? {
                ...o,
                status: updatedStatus,
                courier: updatedRaw.courier,
                trackingNumber: updatedRaw.tracking_number,
                updatedAt: updatedRaw.updated_at,
              }
            : o
        );
      })
      .addCase(confirmReceived.fulfilled, (state, action) => {
        const updatedRaw = action.payload;
        const updatedId = updatedRaw.id as string;
        const updatedStatus = updatedRaw.status as OrderStatus;
        state.currentOrder =
          state.currentOrder && state.currentOrder.id === updatedId
            ? {
                ...state.currentOrder,
                status: updatedStatus,
                updatedAt: updatedRaw.updated_at,
              }
            : state.currentOrder;
      })
      .addCase(createDispute.fulfilled, (state, action) => {
        const dispute = action.payload;
        const orderId = dispute?.order_id;
        if (orderId && state.currentOrder?.id === orderId) {
          state.currentOrder = { ...state.currentOrder, hasOpenDispute: true };
        }
      });
  },
});

export const { clearCurrentOrder } = ordersSlice.actions;

export const selectCurrentOrder = (state: RootState) => state.orders.currentOrder;

export default ordersSlice.reducer;

