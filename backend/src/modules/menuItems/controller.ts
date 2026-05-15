// ===================================================================
// FILE: src/modules/menuItems/controller.ts
// ===================================================================

import type { RouteHandler } from "fastify";
import { db } from "../../db/client";
import {
  and,
  asc,
  desc,
  eq,
  isNull,
  sql,
  type SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { DEFAULT_LOCALE } from "../../core/i18n";
import {
  menuItems,
  menuItemsI18n,
} from "./schema";
import {
  menuItemListQuerySchema,
  type MenuItemListQuery,
} from "./validation";

function toBool(v: unknown): boolean | undefined {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return undefined;
}

function toIntMaybe(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

type MenuItemMerged = {
  id: string;
  parent_id: string | null;
  type: string;
  page_id: string | null;
  location: string;
  icon: string | null;
  section_id: string | null;
  order_num: number;
  is_active: boolean;
  created_at: Date | string | null;
  updated_at: Date | string | null;
  title: string | null;
  url: string | null;
  locale_resolved: string | null;
};

function baseSelect(i18nReq: any, i18nDef: any) {
  return {
    id: menuItems.id,
    parent_id: menuItems.parent_id,
    type: menuItems.type,
    page_id: menuItems.page_id,
    location: menuItems.location,
    icon: menuItems.icon,
    section_id: menuItems.section_id,
    order_num: menuItems.order_num,
    is_active: menuItems.is_active,
    created_at: menuItems.created_at,
    updated_at: menuItems.updated_at,
    title: sql<string>`
      COALESCE(${i18nReq.title}, ${i18nDef.title})
    `.as("title"),
    url: sql<string>`
      COALESCE(${i18nReq.url}, ${i18nDef.url})
    `.as("url"),
    locale_resolved: sql<string>`
      CASE 
        WHEN ${i18nReq.id} IS NOT NULL THEN ${i18nReq.locale}
        ELSE ${i18nDef.locale}
      END
    `.as("locale_resolved"),
  };
}

// "display_order|position|order_num|created_at|updated_at[.desc]"
function resolveOrderCol(s?: string) {
  const [col, dirRaw] = (s ?? "").split(".");
  const dir = dirRaw === "desc" ? "desc" : "asc";
  const colRef =
    col === "display_order" || col === "position" || col === "order_num"
      ? menuItems.order_num
      : col === "created_at"
        ? menuItems.created_at
        : col === "updated_at"
          ? menuItems.updated_at
          : menuItems.order_num;
  return { colRef, dir };
}

/** DB → Public FE map */
function mapRowPublic(r: MenuItemMerged) {
  return {
    id: r.id,
    title: r.title ?? "",
    url: r.url ?? "",
    section_id: r.section_id,
    icon: r.icon,
    is_active: !!r.is_active,
    href: r.url ?? "",
    slug: null as string | null,
    parent_id: r.parent_id,
    position: r.order_num,
    order_num: r.order_num,
    locale: r.locale_resolved,
    created_at: r.created_at
      ? new Date(r.created_at as any).toISOString()
      : undefined,
    updated_at: r.updated_at
      ? new Date(r.updated_at as any).toISOString()
      : undefined,
  };
}

export type MenuItemPublicDto = ReturnType<typeof mapRowPublic> & {
  children?: MenuItemPublicDto[];
};

function buildNestedTree(
  items: MenuItemPublicDto[],
): MenuItemPublicDto[] {
  const byId = new Map<string, MenuItemPublicDto>();
  // önce copy + children init
  for (const item of items) {
    byId.set(item.id, { ...item, children: [] });
  }

  const roots: MenuItemPublicDto[] = [];

  for (const node of byId.values()) {
    if (node.parent_id && byId.has(node.parent_id)) {
      const parent = byId.get(node.parent_id)!;
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/** GET /menu_items */
export const listMenuItems: RouteHandler = async (req, reply) => {
  const parsed = menuItemListQuerySchema.safeParse(
    req.query ?? {},
  );
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: "INVALID_QUERY", details: parsed.error.flatten() });
  }
  const q = parsed.data as MenuItemListQuery;

  // locale: query.locale → req.locale → DEFAULT_LOCALE
  const queryLocale =
    typeof q.locale === "string" && q.locale.trim()
      ? q.locale.trim().toLowerCase()
      : undefined;
  const locale =
    queryLocale ||
    ((req as any).locale as string | undefined) ||
    DEFAULT_LOCALE;

  const defaultLocale = DEFAULT_LOCALE;

  const i18nReq = alias(menuItemsI18n, "mi_req");
  const i18nDef = alias(menuItemsI18n, "mi_def");

  const filters: SQL[] = [];

  // is_active
  if (typeof q.is_active === "undefined") {
    filters.push(eq(menuItems.is_active, true));
  } else {
    const b = toBool(q.is_active);
    if (b !== undefined) filters.push(eq(menuItems.is_active, b));
  }

  // parent_id
  if (typeof q.parent_id !== "undefined") {
    if (q.parent_id === null) {
      filters.push(isNull(menuItems.parent_id));
    } else {
      filters.push(eq(menuItems.parent_id, q.parent_id));
    }
  }

  // location
  if (q.location) {
    filters.push(eq(menuItems.location, q.location));
  }

  // section_id
  if (typeof q.section_id !== "undefined") {
    if (q.section_id === null) {
      filters.push(isNull(menuItems.section_id));
    } else {
      filters.push(eq(menuItems.section_id, q.section_id));
    }
  }

  // site_id
  if (q.site_id) {
    filters.push(eq(menuItems.site_id, q.site_id));
  }

  const whereExpr: SQL | undefined =
    filters.length > 0 ? (and(...filters) as SQL) : undefined;

  const { colRef, dir } = resolveOrderCol(q.order);
  const lim = toIntMaybe(q.limit);
  const off = toIntMaybe(q.offset);

  // COUNT
  const countBase = db
    .select({ total: sql<number>`COUNT(1)` })
    .from(menuItems)
    .leftJoin(
      i18nReq,
      and(
        eq(i18nReq.menu_item_id, menuItems.id),
        eq(i18nReq.locale, locale),
      ),
    )
    .leftJoin(
      i18nDef,
      and(
        eq(i18nDef.menu_item_id, menuItems.id),
        eq(i18nDef.locale, defaultLocale),
      ),
    );

  const countQuery = (whereExpr
    ? countBase.where(whereExpr as any)
    : countBase) as any;
  const cntRows = await countQuery;
  const total = cntRows[0]?.total ?? 0;

  // DATA
  const dataBase = db
    .select(baseSelect(i18nReq, i18nDef))
    .from(menuItems)
    .leftJoin(
      i18nReq,
      and(
        eq(i18nReq.menu_item_id, menuItems.id),
        eq(i18nReq.locale, locale),
      ),
    )
    .leftJoin(
      i18nDef,
      and(
        eq(i18nDef.menu_item_id, menuItems.id),
        eq(i18nDef.locale, defaultLocale),
      ),
    );

  const dataQuery = (whereExpr
    ? dataBase.where(whereExpr as any)
    : dataBase) as any;

  const rows = (await dataQuery
    .orderBy(dir === "desc" ? desc(colRef) : asc(colRef))
    .limit(lim && lim > 0 ? lim : 1000)
    .offset(off && off >= 0 ? off : 0)) as MenuItemMerged[];

  reply.header("x-total-count", String(total));
  reply.header("content-range", `*/${total}`);
  reply.header(
    "access-control-expose-headers",
    "x-total-count, content-range",
  );

  const flat: MenuItemPublicDto[] = rows.map(mapRowPublic);
  const nestedFlag = toBool((q as any).nested);

  if (nestedFlag) {
    const tree = buildNestedTree(flat);
    return reply.send(tree);
  }

  return reply.send(flat);
};

/** GET /menu_items/:id */
export const getMenuItemById: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };

  // ?locale query + req.locale fallback
  const rawQuery = (req.query ?? {}) as { locale?: string };
  const queryLocale =
    typeof rawQuery.locale === "string" && rawQuery.locale.trim()
      ? rawQuery.locale.trim().toLowerCase()
      : undefined;

  const locale =
    queryLocale ||
    ((req as any).locale as string | undefined) ||
    DEFAULT_LOCALE;
  const defaultLocale = DEFAULT_LOCALE;

  const i18nReq = alias(menuItemsI18n, "mi_req");
  const i18nDef = alias(menuItemsI18n, "mi_def");

  const rows = (await db
    .select(baseSelect(i18nReq, i18nDef))
    .from(menuItems)
    .leftJoin(
      i18nReq,
      and(
        eq(i18nReq.menu_item_id, menuItems.id),
        eq(i18nReq.locale, locale),
      ),
    )
    .leftJoin(
      i18nDef,
      and(
        eq(i18nDef.menu_item_id, menuItems.id),
        eq(i18nDef.locale, defaultLocale),
      ),
    )
    .where(eq(menuItems.id, id))
    .limit(1)) as MenuItemMerged[];

  if (!rows.length) {
    return reply.code(404).send({ error: { message: "not_found" } });
  }

  return reply.send(mapRowPublic(rows[0]));
};
