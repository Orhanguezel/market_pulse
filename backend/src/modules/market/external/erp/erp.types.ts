export type ErpCustomer = {
  id: string;
  tur: string;
  name: string;
  phone: string | null;
  address: string | null;
  discount: number | null;
  email: string | null;
  website_url: string | null;
  google_maps_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  contact_name: string | null;
  bayi_segment: string | null;
  hepsiburada_url: string | null;
  trendyol_url: string | null;
  amazon_url: string | null;
};

export type ErpProduct = {
  id: string;
  kategori: string;
  kod: string;
  name: string;
  birim: string;
  stock: number;
  reservedStock: number;
  criticalStock: number;
  unitPrice: number | null;
};

export type ErpOrder = {
  id: string;
  siparisNo: string;
  customerId: string;
  siparisTarihi: string;
  terminTarihi: string | null;
  durum: string;
  toplamTutar: number;
};

export interface ErpProvider {
  getCustomers(q?: string, limit?: number): Promise<ErpCustomer[]>;
  getAllActiveCustomers(): Promise<ErpCustomer[]>;
  getProducts(q?: string, limit?: number): Promise<ErpProduct[]>;
  getCustomerOrders(customerId: string): Promise<ErpOrder[]>;
}
