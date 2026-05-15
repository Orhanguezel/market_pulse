// ===================================================================
// FILE: src/modules/menuItems/admin.controller.ts
// ===================================================================

import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from "../../db/client";
import {
  and,
  asc,
  desc,
  eq,
  isNull,
  inArray,
  sql,
  type SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { DEFAULT_LOCALE } from "../../core/i18n";
import {
  menuItems,
  menuItemsI18n,
  type NewMenuItemRow,
  type NewMenuItemI18nRow,
} from "./schema";
import {
  adminMenuItemListQuerySchema,
  adminMenuItemCreateSchema,
  adminMenuItemUpdateSchema,
  adminMenuItemReorderSchema,
  type AdminMenuItemListQuery,
  type AdminMenuItemCreate,
  type AdminMenuItemUpdate,
} from "./validation";

function toBool(v: unknown): boolean | undefined {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return undefined;
}

const toIntMaybe = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

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

/** DB -> Admin FE map */
function mapRowToAdmin(r: MenuItemMerged) {
  return {
    id: r.id,
    title: r.title ?? "",
    url: r.url ?? null,
    type: (r.type as "page" | "custom") ?? "custom",
    page_id: r.page_id ?? null,
    parent_id: r.parent_id ?? null,
    location: (r.location as "header" | "footer") ?? "header",
    icon: r.icon ?? null,
    section_id: r.section_id ?? null,
    is_active: !!r.is_active,
    display_order: r.order_num ?? 0,
    locale: r.locale_resolved,
    created_at: r.created_at
      ? new Date(r.created_at as any).toISOString()
      : undefined,
    updated_at: r.updated_at
      ? new Date(r.updated_at as any).toISOString()
      : undefined,
  };
}

export type AdminMenuItemDto = ReturnType<typeof mapRowToAdmin> & {
  children?: AdminMenuItemDto[];
};

function buildNestedTree(
  items: AdminMenuItemDto[],
): AdminMenuItemDto[] {
  const byId = new Map<string, AdminMenuItemDto>();
  for (const item of items) {
    byId.set(item.id, { ...item, children: [] });
  }

  const roots: AdminMenuItemDto[] = [];

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

/* ----------------- i18n helpers ----------------- */

async function getMenuItemI18nRow(
  id: string,
  locale: string,
) {
  const rows = await db
    .select()
    .from(menuItemsI18n)
    .where(
      and(
        eq(menuItemsI18n.menu_item_id, id),
        eq(menuItemsI18n.locale, locale),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

async function upsertMenuItemI18n(
  menuItemId: string,
  locale: string,
  data: Partial<Pick<NewMenuItemI18nRow, "title" | "url">> & {
    id?: string;
  },
) {
  const insertVals: NewMenuItemI18nRow = {
    id: data.id ?? randomUUID(),
    menu_item_id: menuItemId,
    locale,
    title: data.title ?? "",
    url: data.url ?? "",
    created_at: new Date() as any,
    updated_at: new Date() as any,
  };

  const setObj: Record<string, any> = {};
  if (typeof data.title !== "undefined") {
    setObj.title = data.title;
  }
  if (typeof data.url !== "undefined") {
    setObj.url = data.url;
  }
  setObj.updated_at = new Date();

  if (Object.keys(setObj).length === 1) {
    // sadece updated_at
    return;
  }

  await db
    .insert(menuItemsI18n)
    .values(insertVals)
    .onDuplicateKeyUpdate({
      set: setObj,
    });
}

/* ----------------- Admin Handlers ----------------- */

/** GET /admin/menu_items */
export const adminListMenuItems: RouteHandler = async (req, reply) => {
  const parsed = adminMenuItemListQuerySchema.safeParse(
    req.query ?? {},
  );
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: "INVALID_QUERY", details: parsed.error.flatten() });
  }
  const q = parsed.data as AdminMenuItemListQuery;

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

  if (q.q && q.q.trim()) {
    const likeExpr = `%${q.q.trim()}%`;
    filters.push(
      sql`(
        COALESCE(${i18nReq.title}, ${i18nDef.title}) LIKE ${likeExpr}
        OR COALESCE(${i18nReq.url}, ${i18nDef.url}) LIKE ${likeExpr}
      )`,
    );
  }

  if (typeof q.parent_id !== "undefined") {
    if (q.parent_id === null) {
      filters.push(isNull(menuItems.parent_id));
    } else {
      filters.push(eq(menuItems.parent_id, q.parent_id));
    }
  }

  if (q.location) {
    filters.push(eq(menuItems.location, q.location));
  }

  if (typeof q.section_id !== "undefined") {
    if (q.section_id === null) {
      filters.push(isNull(menuItems.section_id));
    } else {
      filters.push(eq(menuItems.section_id, q.section_id));
    }
  }

  if (typeof q.is_active !== "undefined") {
    const b = toBool(q.is_active);
    if (b !== undefined) filters.push(eq(menuItems.is_active, b));
  }

  const whereExpr: SQL | undefined =
    filters.length > 0 ? (and(...filters) as SQL) : undefined;

  const lim = toIntMaybe(q.limit);
  const off = toIntMaybe(q.offset);
  const dir = q.order === "desc" ? "desc" : "asc";

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

  // sort: display_order | created_at | title
  let orderExpr: any;
  if (q.sort === "created_at") {
    orderExpr = menuItems.created_at;
  } else if (q.sort === "title") {
    orderExpr = sql`COALESCE(${i18nReq.title}, ${i18nDef.title})`;
  } else {
    // display_order default
    orderExpr = menuItems.order_num;
  }

  const rows = (await dataQuery
    .orderBy(dir === "desc" ? desc(orderExpr) : asc(orderExpr))
    .limit(lim && lim > 0 ? lim : 1000)
    .offset(off && off >= 0 ? off : 0)) as MenuItemMerged[];

  reply.header("x-total-count", String(total));
  reply.header("content-range", `*/${total}`);
  reply.header(
    "access-control-expose-headers",
    "x-total-count, content-range",
  );

  const flat: AdminMenuItemDto[] = rows.map(mapRowToAdmin);
  const nestedFlag = toBool((q as any).nested);

  if (nestedFlag) {
    const tree = buildNestedTree(flat);
    return reply.send(tree);
  }

  return reply.send(flat);
};

/** GET /admin/menu_items/:id */
export const adminGetMenuItemById: RouteHandler = async (
  req,
  reply,
) => {
  const { id } = req.params as { id: string };

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

  return reply.send(mapRowToAdmin(rows[0]));
};

/** POST /admin/menu_items */
export const adminCreateMenuItem: RouteHandler = async (
  req,
  reply,
) => {
  try {
    const body = adminMenuItemCreateSchema.parse(
      req.body ?? {},
    ) as AdminMenuItemCreate;

    const bodyLocale =
      typeof body.locale === "string" && body.locale.trim()
        ? body.locale.trim().toLowerCase()
        : undefined;

    const locale =
      bodyLocale ||
      ((req as any).locale as string | undefined) ||
      DEFAULT_LOCALE;

    const id = randomUUID();

    // parent_id validation (submenu için sağlam referans)
    let parentId: string | null = body.parent_id ?? null;
    if (parentId) {
      const [exists] = await db
        .select({ id: menuItems.id })
        .from(menuItems)
        .where(eq(menuItems.id, parentId))
        .limit(1);
      if (!exists) {
        return reply
          .code(400)
          .send({ error: { message: "invalid_parent_id" } });
      }
    }

    const parentInsert: NewMenuItemRow = {
      id,
      parent_id: parentId,
      type: body.type,
      page_id: body.page_id ?? null,
      location: body.location,
      icon: body.icon ?? null,
      section_id: body.section_id ?? null,
      order_num: body.display_order ?? 0,
      is_active: toBool(body.is_active) ?? true,
      created_at: new Date() as any,
      updated_at: new Date() as any,
    };

    await db.insert(menuItems).values(parentInsert);

    await upsertMenuItemI18n(id, locale, {
      title: body.title.trim(),
      url: (body.url ?? "").trim(),
    });

    // merged row döndür
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
          eq(i18nDef.locale, DEFAULT_LOCALE),
        ),
      )
      .where(eq(menuItems.id, id))
      .limit(1)) as MenuItemMerged[];

    return reply.code(201).send(mapRowToAdmin(rows[0]));
  } catch (e: any) {
    req.log.error(e);
    if (e?.name === "ZodError") {
      return reply
        .code(400)
        .send({ error: { message: "validation_error", details: e.issues } });
    }
    return reply
      .code(500)
      .send({ error: { message: "menu_item_create_failed" } });
  }
};

/** PATCH /admin/menu_items/:id */
export const adminUpdateMenuItem: RouteHandler = async (
  req,
  reply,
) => {
  try {
    const { id } = req.params as { id: string };
    const patch = adminMenuItemUpdateSchema.parse(
      req.body ?? {},
    ) as AdminMenuItemUpdate;

    const patchLocale =
      typeof patch.locale === "string" && patch.locale.trim()
        ? patch.locale.trim().toLowerCase()
        : undefined;

    const locale =
      patchLocale ||
      ((req as any).locale as string | undefined) ||
      DEFAULT_LOCALE;

    const parentPatch: Partial<NewMenuItemRow> = {};

    if (typeof patch.type !== "undefined") {
      parentPatch.type = patch.type;
    }
    if (typeof patch.page_id !== "undefined") {
      parentPatch.page_id = patch.page_id ?? null;
    }
    if (typeof patch.location !== "undefined") {
      parentPatch.location = patch.location;
    }
    if (typeof patch.icon !== "undefined") {
      parentPatch.icon = patch.icon ?? null;
    }
    if (typeof patch.section_id !== "undefined") {
      parentPatch.section_id = patch.section_id ?? null;
    }
    if (typeof patch.display_order !== "undefined") {
      parentPatch.order_num = patch.display_order;
    }
    if (typeof patch.is_active !== "undefined") {
      parentPatch.is_active = toBool(patch.is_active) ?? true;
    }

    // parent_id validation
    if (typeof patch.parent_id !== "undefined") {
      if (patch.parent_id === id) {
        return reply
          .code(400)
          .send({ error: { message: "invalid_parent_id" } });
      }
      if (patch.parent_id) {
        const [exists] = await db
          .select({ id: menuItems.id })
          .from(menuItems)
          .where(eq(menuItems.id, patch.parent_id))
          .limit(1);
        if (!exists) {
          return reply
            .code(400)
            .send({ error: { message: "invalid_parent_id" } });
        }
        parentPatch.parent_id = patch.parent_id;
      } else {
        parentPatch.parent_id = null;
      }
    }

    // parent güncelle
    if (Object.keys(parentPatch).length > 0) {
      await db
        .update(menuItems)
        .set({
          ...parentPatch,
          updated_at: new Date() as any,
        })
        .where(eq(menuItems.id, id));
    }

    // i18n patch
    const hasI18n =
      typeof patch.title !== "undefined" ||
      typeof patch.url !== "undefined";

    if (hasI18n) {
      const exists = await getMenuItemI18nRow(id, locale);

      if (!exists) {
        // yeni çeviri için zorunlu alanlar
        if (!patch.title || !patch.url) {
          return reply.code(400).send({
            error: { message: "missing_required_translation_fields" },
          });
        }
        await upsertMenuItemI18n(id, locale, {
          title: patch.title.trim(),
          url: patch.url.trim(),
        });
      } else {
        await upsertMenuItemI18n(id, locale, {
          title:
            typeof patch.title === "string"
              ? patch.title.trim()
              : undefined,
          url:
            typeof patch.url === "string"
              ? patch.url.trim()
              : undefined,
        });
      }
    }

    // merged row
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
          eq(i18nDef.locale, DEFAULT_LOCALE),
        ),
      )
      .where(eq(menuItems.id, id))
      .limit(1)) as MenuItemMerged[];

    if (!rows.length) {
      return reply
        .code(404)
        .send({ error: { message: "not_found" } });
    }

    return reply.send(mapRowToAdmin(rows[0]));
  } catch (e: any) {
    req.log.error(e);
    if (e?.name === "ZodError") {
      return reply
        .code(400)
        .send({ error: { message: "validation_error", details: e.issues } });
    }
    return reply
      .code(500)
      .send({ error: { message: "menu_item_update_failed" } });
  }
};

/** DELETE /admin/menu_items/:id */
export const adminDeleteMenuItem: RouteHandler = async (
  req,
  reply,
) => {
  const { id } = req.params as { id: string };

  await db.transaction(async (tx) => {
    await tx
      .update(menuItems)
      .set({ parent_id: null })
      .where(eq(menuItems.parent_id, id));
    await tx.delete(menuItems).where(eq(menuItems.id, id));
  });

  return reply.code(204).send();
};

/** POST /admin/menu_items/reorder */
export const adminReorderMenuItems: RouteHandler = async (
  req,
  reply,
) => {
  const { items } = adminMenuItemReorderSchema.parse(
    req.body ?? {},
  );

  const ids = items.map((i) => i.id);
  const rows = await db
    .select({
      id: menuItems.id,
      parent_id: menuItems.parent_id,
    })
    .from(menuItems)
    .where(inArray(menuItems.id, ids));

  const parentSet = new Set(
    rows.map((r) => (r.parent_id ?? "ROOT") as string),
  );
  if (parentSet.size > 1) {
    return reply
      .code(400)
      .send({ error: { message: "mixed_parent_ids" } });
  }

  await db.transaction(async (tx) => {
    const now = new Date();
    for (const it of items) {
      await tx
        .update(menuItems)
        .set({ order_num: it.display_order, updated_at: now })
        .where(eq(menuItems.id, it.id));
    }
  });

  return reply.send({ ok: true });
};
