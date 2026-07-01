

drop trigger if exists "trg_orders_updated" on "public"."orders";

drop trigger if exists "trg_products_updated" on "public"."products";

drop trigger if exists "trg_profiles_updated" on "public"."profiles";

drop policy "Admins can view all favorites" on "public"."favorites";

drop policy "Users manage own favorites" on "public"."favorites";

drop policy "Admins delete all order items" on "public"."order_items";

drop policy "Admins update all order items" on "public"."order_items";

drop policy "Admins view all order items" on "public"."order_items";

drop policy "Users create own order items" on "public"."order_items";

drop policy "Users delete own order items" on "public"."order_items";

drop policy "Users update own order items" on "public"."order_items";

drop policy "Users view own order items" on "public"."order_items";

drop policy "Admins update all orders" on "public"."orders";

drop policy "Admins view all orders" on "public"."orders";

drop policy "Users create own orders" on "public"."orders";

drop policy "Users update own orders" on "public"."orders";

drop policy "Users view own orders" on "public"."orders";

drop policy "Admins delete products" on "public"."products";

drop policy "Admins insert products" on "public"."products";

drop policy "Admins update products" on "public"."products";

drop policy "Authenticated can view products" on "public"."products";

drop policy "Admins can view all profiles" on "public"."profiles";

drop policy "Admins view all profiles" on "public"."profiles";

drop policy "Users insert their own profile" on "public"."profiles";

drop policy "Users update their own profile" on "public"."profiles";

drop policy "Users view their own profile" on "public"."profiles";

drop policy "Admins delete roles" on "public"."user_roles";

drop policy "Admins insert roles" on "public"."user_roles";

drop policy "Admins update roles" on "public"."user_roles";

drop policy "Admins view all roles" on "public"."user_roles";

drop policy "Users view their own roles" on "public"."user_roles";

alter table "public"."favorites" drop constraint "favorites_user_id_product_id_key";

alter table "public"."order_items" drop constraint "order_items_quantity_check";

alter table "public"."orders" drop constraint "orders_user_id_fkey";

alter table "public"."products" drop constraint "products_sku_key";

alter table "public"."user_roles" drop constraint "user_roles_user_id_role_key";

alter table "public"."favorites" drop constraint "favorites_product_id_fkey";

alter table "public"."favorites" drop constraint "favorites_user_id_fkey";

alter table "public"."order_items" drop constraint "order_items_order_id_fkey";

alter table "public"."profiles" drop constraint "profiles_id_fkey";

alter table "public"."user_roles" drop constraint "user_roles_user_id_fkey";

drop function if exists "public"."get_user_emails"(_user_ids uuid[]);

drop function if exists "public"."has_role"(_user_id uuid, _role public.role);

drop function if exists "public"."set_updated_at"();

drop index if exists "public"."favorites_user_id_product_id_key";

drop index if exists "public"."products_sku_key";

drop index if exists "public"."user_roles_user_id_role_key";


  create table "public"."companies" (
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
    "updated_by" uuid not null default auth.uid(),
    "name" text not null default ''::text,
    "ice" text not null default ''::text,
    "rc" text not null default ''::text,
    "city" text not null default ''::text,
    "phone" text not null,
    "office_address" text not null,
    "storage_office" text not null,
    "id" uuid not null default gen_random_uuid()
      );


alter table "public"."companies" enable row level security;

alter table "public"."favorites" alter column "created_at" set default (now() AT TIME ZONE 'utc'::text);

alter table "public"."favorites" alter column "created_at" drop not null;

alter table "public"."favorites" alter column "product_id" set default gen_random_uuid();

alter table "public"."favorites" alter column "product_id" drop not null;

alter table "public"."favorites" alter column "user_id" set default gen_random_uuid();

alter table "public"."favorites" alter column "user_id" drop not null;

alter table "public"."order_items" drop column "created_at";

alter table "public"."order_items" alter column "date_needed" set data type text using "date_needed"::text;

alter table "public"."order_items" alter column "order_id" set default gen_random_uuid();

alter table "public"."order_items" alter column "order_id" drop not null;

alter table "public"."order_items" alter column "product_id" set default gen_random_uuid();

alter table "public"."order_items" alter column "product_id" drop not null;

alter table "public"."order_items" alter column "quantity" set default '1'::bigint;

alter table "public"."order_items" alter column "quantity" drop not null;

alter table "public"."order_items" alter column "quantity" set data type bigint using "quantity"::bigint;

alter table "public"."order_items" alter column "unit_price" set default '0'::bigint;

alter table "public"."order_items" alter column "unit_price" drop not null;

alter table "public"."order_items" alter column "unit_price" set data type bigint using "unit_price"::bigint;

alter table "public"."orders" add column "notify_email" text default ''::text;

alter table "public"."orders" add column "updated_by" uuid default auth.uid();

alter table "public"."orders" alter column "created_at" set default (now() AT TIME ZONE 'utc'::text);

alter table "public"."orders" alter column "created_at" drop not null;

alter table "public"."orders" alter column "status" set default 'submitted'::public.status;

alter table "public"."orders" alter column "status" drop not null;

alter table "public"."orders" alter column "status" set data type public.status using "status"::public.status;

alter table "public"."orders" alter column "total" drop default;

alter table "public"."orders" alter column "total" drop not null;

alter table "public"."orders" alter column "total" set data type bigint using "total"::bigint;

alter table "public"."orders" alter column "updated_at" set default (now() AT TIME ZONE 'utc'::text);

alter table "public"."orders" alter column "updated_at" drop not null;

alter table "public"."orders" alter column "user_id" set default gen_random_uuid();

alter table "public"."orders" alter column "user_id" drop not null;

alter table "public"."products" alter column "active" drop default;

alter table "public"."products" alter column "active" drop not null;

alter table "public"."products" alter column "created_at" set default (now() AT TIME ZONE 'utc'::text);

alter table "public"."products" alter column "created_at" drop not null;

alter table "public"."products" alter column "name" drop not null;

alter table "public"."products" alter column "price" drop default;

alter table "public"."products" alter column "price" drop not null;

alter table "public"."products" alter column "price" set data type bigint using "price"::bigint;

alter table "public"."products" alter column "sku" drop not null;

alter table "public"."products" alter column "updated_at" set default (now() AT TIME ZONE 'utc'::text);

alter table "public"."products" alter column "updated_at" drop not null;

alter table "public"."profiles" drop column "company_name";

alter table "public"."profiles" drop column "ice";

alter table "public"."profiles" drop column "shipping_address";

alter table "public"."profiles" add column "avatar_url" text;

alter table "public"."profiles" add column "company" uuid;

alter table "public"."profiles" add column "email" text;

alter table "public"."profiles" add column "full_name" text default ''::text;

alter table "public"."profiles" alter column "created_at" drop default;

alter table "public"."profiles" alter column "created_at" drop not null;

alter table "public"."profiles" alter column "id" set default gen_random_uuid();

alter table "public"."profiles" alter column "phone" set default ''::text;

alter table "public"."profiles" alter column "updated_at" drop default;

alter table "public"."profiles" alter column "updated_at" drop not null;

alter table "public"."user_roles" alter column "created_at" drop default;

alter table "public"."user_roles" alter column "created_at" drop not null;

alter table "public"."user_roles" alter column "role" set default 'buyer'::public.role;

alter table "public"."user_roles" alter column "role" set data type public.role using "role"::text::public.role;

alter table "public"."user_roles" alter column "user_id" set default gen_random_uuid();

alter table "public"."user_roles" alter column "user_id" drop not null;


CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (id);

CREATE UNIQUE INDEX user_roles_id_key ON public.user_roles USING btree (id);

alter table "public"."companies" add constraint "companies_pkey" PRIMARY KEY using index "companies_pkey";

alter table "public"."companies" add constraint "companies_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(id) not valid;

alter table "public"."companies" validate constraint "companies_updated_by_fkey";

alter table "public"."favorites" add constraint "favorites_user_id_profiles_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."favorites" validate constraint "favorites_user_id_profiles_id_fkey";

alter table "public"."orders" add constraint "orders_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(id) not valid;

alter table "public"."orders" validate constraint "orders_updated_by_fkey";

alter table "public"."orders" add constraint "orders_user_id_fkey1" FOREIGN KEY (user_id) REFERENCES public.profiles(id) not valid;

alter table "public"."orders" validate constraint "orders_user_id_fkey1";

alter table "public"."profiles" add constraint "profiles_company_fkey" FOREIGN KEY (company) REFERENCES public.companies(id) not valid;

alter table "public"."profiles" validate constraint "profiles_company_fkey";

alter table "public"."user_roles" add constraint "user_roles_id_key" UNIQUE using index "user_roles_id_key";

alter table "public"."favorites" add constraint "favorites_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) not valid;

alter table "public"."favorites" validate constraint "favorites_product_id_fkey";

alter table "public"."favorites" add constraint "favorites_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."favorites" validate constraint "favorites_user_id_fkey";

alter table "public"."order_items" add constraint "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) not valid;

alter table "public"."order_items" validate constraint "order_items_order_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.set_orders_updated_fields()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  -- Always refresh timestamp
  new.updated_at = now();

  -- Set updated_by to the authenticated user's id from JWT context
  new.updated_by = auth.uid();

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$function$
;

grant delete on table "public"."companies" to "anon";

grant insert on table "public"."companies" to "anon";

grant references on table "public"."companies" to "anon";

grant select on table "public"."companies" to "anon";

grant trigger on table "public"."companies" to "anon";

grant truncate on table "public"."companies" to "anon";

grant update on table "public"."companies" to "anon";

grant delete on table "public"."companies" to "authenticated";

grant insert on table "public"."companies" to "authenticated";

grant references on table "public"."companies" to "authenticated";

grant select on table "public"."companies" to "authenticated";

grant trigger on table "public"."companies" to "authenticated";

grant truncate on table "public"."companies" to "authenticated";

grant update on table "public"."companies" to "authenticated";

grant delete on table "public"."companies" to "service_role";

grant insert on table "public"."companies" to "service_role";

grant references on table "public"."companies" to "service_role";

grant select on table "public"."companies" to "service_role";

grant trigger on table "public"."companies" to "service_role";

grant truncate on table "public"."companies" to "service_role";

grant update on table "public"."companies" to "service_role";

grant delete on table "public"."favorites" to "anon";

grant insert on table "public"."favorites" to "anon";

grant select on table "public"."favorites" to "anon";

grant update on table "public"."favorites" to "anon";

grant delete on table "public"."order_items" to "anon";

grant insert on table "public"."order_items" to "anon";

grant select on table "public"."order_items" to "anon";

grant update on table "public"."order_items" to "anon";

grant delete on table "public"."orders" to "anon";

grant insert on table "public"."orders" to "anon";

grant select on table "public"."orders" to "anon";

grant update on table "public"."orders" to "anon";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."user_roles" to "anon";

grant insert on table "public"."user_roles" to "anon";

grant select on table "public"."user_roles" to "anon";

grant update on table "public"."user_roles" to "anon";

grant delete on table "public"."user_roles" to "authenticated";

grant insert on table "public"."user_roles" to "authenticated";

grant update on table "public"."user_roles" to "authenticated";


  create policy "Enable delete for users based on user_id"
  on "public"."favorites"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable insert for authenticated users only"
  on "public"."favorites"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Enable users to view their own and admin"
  on "public"."favorites"
  as permissive
  for select
  to authenticated
using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::public.role))))));



  create policy "Enable insert for authenticated users only"
  on "public"."order_items"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "order_items_owner_or_admin_read"
  on "public"."order_items"
  as permissive
  for select
  to authenticated
using (((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND (o.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::public.role))))));



  create policy "Enable insert for authenticated users only"
  on "public"."orders"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "orders_admin_status_any"
  on "public"."orders"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::public.role)))))
with check ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::public.role)))));



  create policy "orders_owner_or_admin_read"
  on "public"."orders"
  as permissive
  for select
  to authenticated
using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::public.role))))));



  create policy "orders_user_status_to_closed"
  on "public"."orders"
  as permissive
  for update
  to authenticated
using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::public.role))))))
with check (((user_id = auth.uid()) AND (status = 'closed'::public.status)));



  create policy "products_admin_insert"
  on "public"."products"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::public.role)))));



  create policy "products_role_read"
  on "public"."products"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::public.role, 'buyer'::public.role, 'assistant'::public.role]))))));



  create policy "Users can insert their own profile"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check ((id = auth.uid()));



  create policy "Users can update their own profile"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((id = auth.uid()))
with check ((id = auth.uid()));



  create policy "Users can view their own profile"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((id = auth.uid()));



  create policy "Enable users to view their own data only"
  on "public"."user_roles"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


CREATE TRIGGER trg_orders_set_updated_fields BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_orders_updated_fields();



