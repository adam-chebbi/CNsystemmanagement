-- Café Noir backend schema. JSON columns hold nested/array data that the frontend already
-- treats as opaque (recipe lines, variants, order/reception/invoice line items, weekly HR
-- patterns) -- these are never queried relationally, only read/written whole.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  cin TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

-- revoked_at IS NULL means the session is currently active; it's never deleted on logout so
-- "Historique des connexions" can still show the login/logout event pair afterward.
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_label TEXT,
  location TEXT,
  last_seen_at TEXT,
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS product_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS product_subcategories (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS catalog_extras (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS catalog_articles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  price REAL NOT NULL,
  description TEXT,
  image_url TEXT,
  is_available INTEGER,
  extra_ids TEXT,
  variants TEXT,
  recipe TEXT,
  target_margin_rate REAL,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS sub_recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  yield_quantity REAL NOT NULL,
  yield_unit TEXT NOT NULL,
  ingredients TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_units (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  min_threshold REAL NOT NULL,
  target_stock REAL NOT NULL,
  lot_tracked INTEGER NOT NULL,
  average_cost REAL NOT NULL,
  reserve_qty REAL NOT NULL,
  depot_qty REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_lots (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES stock_products(id) ON DELETE CASCADE,
  lot_number TEXT NOT NULL,
  zone TEXT NOT NULL,
  quantity REAL NOT NULL,
  expiry_date TEXT NOT NULL,
  received_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_ledger (
  id TEXT PRIMARY KEY,
  group_id TEXT,
  timestamp TEXT NOT NULL,
  type TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES stock_products(id) ON DELETE CASCADE,
  zone TEXT NOT NULL,
  related_zone TEXT,
  quantity_before REAL NOT NULL,
  quantity_delta REAL NOT NULL,
  quantity_after REAL NOT NULL,
  reason TEXT NOT NULL,
  comment TEXT,
  lot_id TEXT,
  lot_number TEXT,
  expiry_date TEXT,
  performed_by TEXT NOT NULL,
  status TEXT NOT NULL,
  cancelled_at TEXT,
  cancelled_by TEXT,
  cancel_reason TEXT,
  value_impact REAL NOT NULL,
  theoretical_qty REAL,
  real_qty REAL,
  discrepancy_qty REAL,
  discrepancy_value REAL,
  inventory_choice TEXT,
  inventory_scope TEXT
);

CREATE TABLE IF NOT EXISTS sales_transactions (
  id INTEGER PRIMARY KEY,
  sale_number TEXT NOT NULL,
  service_type TEXT NOT NULL,
  table_or_area TEXT NOT NULL,
  items TEXT NOT NULL,
  items_count INTEGER NOT NULL,
  items_summary TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  barista TEXT NOT NULL,
  total_amount REAL NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expense_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES expense_categories(id),
  nature TEXT NOT NULL,
  recurrence TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL,
  comment TEXT,
  attachment TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tax_id TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  main_contact TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  order_date TEXT NOT NULL,
  expected_date TEXT,
  status TEXT NOT NULL,
  lines TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_receptions (
  id TEXT PRIMARY KEY,
  purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  reception_date TEXT NOT NULL,
  zone TEXT NOT NULL,
  lines TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS supplier_invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  purchase_order_id TEXT REFERENCES purchase_orders(id),
  invoice_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  amount_ht REAL NOT NULL,
  vat_amount REAL NOT NULL,
  amount_ttc REAL NOT NULL,
  amount_paid REAL NOT NULL,
  payment_method TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Reusable "OCR label -> stock product" correspondences: once an admin resolves an invoice line
-- whose wording doesn't match a product name exactly, future OCR imports auto-match it again.
CREATE TABLE IF NOT EXISTS invoice_product_aliases (
  id TEXT PRIMARY KEY,
  normalized_label TEXT NOT NULL UNIQUE,
  raw_label TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES stock_products(id),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  photo_url TEXT,
  poste TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  status TEXT NOT NULL,
  salary REAL NOT NULL,
  cin_number TEXT NOT NULL,
  cin_issue_date TEXT NOT NULL,
  cin_document TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recurring_plans (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  weekly_pattern TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS day_records (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  shift_ids TEXT NOT NULL,
  recurring_plan_id TEXT REFERENCES recurring_plans(id) ON DELETE SET NULL,
  note TEXT,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS financial_records (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_month_index INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  base_salary REAL NOT NULL,
  advances REAL NOT NULL,
  bonuses REAL NOT NULL,
  deductions REAL NOT NULL,
  amount_paid REAL NOT NULL,
  payment_date TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS treated_alerts (
  alert_id TEXT PRIMARY KEY,
  treated_at TEXT NOT NULL,
  treated_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  user TEXT NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL
);
