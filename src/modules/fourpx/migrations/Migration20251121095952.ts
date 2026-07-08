import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251121095952 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "4px_settings" ("id" text not null, "name" text not null, "value" text not null, "auto_load" boolean not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "4px_settings_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_4px_settings_deleted_at" ON "4px_settings" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "4px_settings" cascade;`);
  }
}
