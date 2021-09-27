    social_image: musings.jpg

---

    language: en
    description: Using Nginx and PostgreSQL as a full-featured webhook handler
    published: 2021-05-15

# How to use Nginx as a webhook handler without a backend

Alternative port, but then firewall. All in all, using the existing reverse-proxy sounds best: my Nginx.

But then: respond right away, but pipe the request contents into something (even a bash script could process it from there!). Then I realized: Nginx has a fully scriptable Lua backend!

OpenResty contains luajit and a bunch of other modules, and is the [recommended](https://github.com/openresty/lua-nginx-module#installation) way to enable [Lua support](https://www.nginx.com/resources/wiki/modules/lua/#installation) on Nginx. The [FreeBSD port installation](https://openresty.org/en/installation.html#freebsd-users) pre-requisites:
```
curl https://openresty.org/download/openresty-1.19.3.1.tar.gz -O
tar -xzvf openresty-1.19.3.1.tar.gz
cd openresty-1.19.3.1

pkg install gmake openssl pcre perl5
```

Since the postgres module is not enabled by default, we can build it in from the get-go. This needs `libpq.so` already installed which we can get from the [`databases/postgresql12-client`](https://www.freshports.org/databases/postgresql12-client/) port.

```sh
pkg install postgresql12-client

# Use ./configure -h to check for other options
./configure --with-http_v2_module --with-http_postgres_module --with-ipv6
```



```
(…)
adding module in ../ngx_postgres-1.0
checking for libpq library (via pg_config) ... found
checking for libpq library version 9.1 ... found
 + ngx_postgres was configured
(…)
```


Time to build!

```
gmake
gmake install

# Add resty to the path, also override nginx binary
setenv PATH "/usr/local/openresty/nginx/sbin:/usr/local/openresty/bin:$PATH"
```

After install:

```
# nginx -V
nginx version: openresty/1.19.3.1
built by clang 10.0.1 (git@github.com:llvm/llvm-project.git llvmorg-10.0.1-0-gef32c611aa2)
built with OpenSSL 1.1.1k  25 Mar 2021
TLS SNI support enabled
configure arguments: --prefix=/usr/local/openresty/nginx --with-cc-opt=-O2 (…) --add-module=../ngx_postgres-1.0
```

- [Getting started](https://openresty.org/en/getting-started.html)



As for the HMAC checking, it's a mess. HMAC-SHA1 [is supported](https://github.com/openresty/lua-nginx-module#ngxhmac_sha1) in the core module, but SHA256 was rejected [multiple times](https://github.com/openresty/lua-resty-string/pull/18) for inclusion with the claim for 'keeping the core light'.

Haven't found an external library adding this functionality yet, although I would imagine building one should not be too hard (or patching the existing source to add support & recompiling). [One example of such a patch/fork](https://github.com/ddragosd/lua-resty-string/blob/master/lib/resty/hmac.lua) (but is unmaintained)


```
local file, err = io.open("TEST.txt", "w+b")
if file == nil then
    print("Couldn't open file: " .. err)
else
    file:write(resp_body)
    file:close()
end
```

Edit `/usr/local/etc/rc.d/nginx`:

```sh
# Change binary path
#command="/usr/local/sbin/nginx"
command="/usr/local/openresty/nginx/sbin/nginx"

# Change PIDfile location
#_pidprefix="/var/run"
_pidprefix="/usr/local/openresty/nginx/logs/"
```

Edit `/etc/rc.conf`:

```
# Nginx/OpenResty configuration
nginx_enable="YES"
nginx_flags="-c /usr/local/etc/nginx/nginx.conf"
```

I wanted to leave an escape hatch for keeping the old/standard Nginx around, but if you are starting from scratch you might want to skip all these and just `./configure` to replace the standard Nginx completely.

We can now use the directives and the [Lua Nginx API](https://github.com/openresty/lua-nginx-module#nginx-api-for-lua) to build a webhook handler right into our Nginx config!

```
location = /webhook {
    keepalive_timeout 0;
    content_by_lua_block {
        ngx.req.read_body()
        ngx.ctx.body = ngx.req.get_body_data()
        ngx.ctx.headers = ngx.req.get_headers()

        ngx.log(ngx.STDERR,"[webhook] signature: ", ngx.ctx.headers.x_todoist_hmac_sha256, ", data: ", ngx.ctx.body)

        ngx.status = ngx.HTTP_OK
        ngx.eof()
    }
}

```

You can test the setup using curl:

```sh
curl "http://localhost/webhook" \
     -H "X-Todoist-Hmac-SHA256: UEEq9…Ps=" \
     --data "{}" \
     -v
```

Have a look at your Nginx logs and you should be seeing something similar to:

```
2021/05/13 19:12:22 [] 25712#0: *54 [lua] content_by_lua(nginx.conf:26):6: [webhook] signature: UEEq9…Ps=, data: {}, client: 2a01:4f9:c010:dfe4::1, server: localhost, request: "GET /webhook HTTP/2.0", host: "localhost"
```


## Nginx <3 Postgres

- https://openresty.org/en/postgres-nginx-module.html
- example config: http://labs.frickle.com/nginx_ngx_postgres/

```
http {
    upstream database {
        postgres_server  127.0.0.1 dbname=test
                         user=monty password=some_pass;
    }

    server {
        location / {
            postgres_pass   database;
            postgres_query  "select * from cats";
        }
    }
}
```



## Two methods
- No Lua: [ngx_postgres](https://ef.gy/using-postgresql-with-nginx)
- Yes Lua: [pgmoon](https://github.com/leafo/pgmoon) as described [here](https://ketzacoatl.github.io/posts/2017-03-04-lua-and-openresty-part-3-write-to-postgres.html)





---

2021/05/13 19:39:29 [] 25712#0: *62 [lua] content_by_lua(integrations.flak.is.conf:26):6: [webhook]

signature: lrK82vNQ8c/XPp3DfU3oHRRvKdttgY5K+6/f239BIqY=

{"event_data":{"content":"blop","file_attachment":null,"id":2829862176,"is_deleted":0,"item":{"added_by_uid":27502148,"assigned_by_uid":null,"checked":0,"child_order":1,"collapsed":0,"content":"webhook test change","date_added":"2021-05-13T15:52:25Z","date_completed":null,"description":"","due":null,"id":4824601533,"in_history":0,"is_deleted":0,"labels":[],"parent_id":null,"priority":1,"project_id":2232764761,"responsible_uid":null,"section_id":null,"sync_id":null,"user_id":27502148},"item_id":4824601533,"posted":"2021-05-13T16:39:13Z","posted_uid":27502148,"project_id":2232764761,"reactions":null,"uids_to_notify":[],"url":"https://todoist.com/showTask?id=4824601533"},"event_name":"note:added","initiator":{"email":"contact@flak.is","full_name":"Istv\u00e1n Szmozs\u00e1nszky","id":27502148,"image_id":"abdebbab9ebb4a01b2bf9a4fff8a24cc","is_premium":true},"user_id":27502148,"version":"8"}

client: 2a01:4f9:c010:dfe4::1
server: integrations.flak.is
request: "POST /webhook HTTP/2.0"
host: "integrations.flak.is"

```sql
INSERT INTO
	todoist_updates(digest, contents)
VALUES (
'lrK82vNQ8c/XPp3DfU3oHRRvKdttgY5K+6/f239BIqY=',
'{"event_data":{"content":"blop","file_attachment":null,"id":2829862176,"is_deleted":0,"item":{"added_by_uid":27502148,"assigned_by_uid":null,"checked":0,"child_order":1,"collapsed":0,"content":"webhook test change","date_added":"2021-05-13T15:52:25Z","date_completed":null,"description":"","due":null,"id":4824601533,"in_history":0,"is_deleted":0,"labels":[],"parent_id":null,"priority":1,"project_id":2232764761,"responsible_uid":null,"section_id":null,"sync_id":null,"user_id":27502148},"item_id":4824601533,"posted":"2021-05-13T16:39:13Z","posted_uid":27502148,"project_id":2232764761,"reactions":null,"uids_to_notify":[],"url":"https://todoist.com/showTask?id=4824601533"},"event_name":"note:added","initiator":{"email":"contact@flak.is","full_name":"Istv\u00e1n Szmozs\u00e1nszky","id":27502148,"image_id":"abdebbab9ebb4a01b2bf9a4fff8a24cc","is_premium":true},"user_id":27502148,"version":"8"}')
```


```sh
root@webserver0:~ # pkg search luarocks
lua51-luarocks-3.5.0           Package manager for Lua modules
lua52-luarocks-3.5.0           Package manager for Lua modules
lua53-luarocks-3.5.0           Package manager for Lua modules
lua54-luarocks-3.5.0           Package manager for Lua modules
```


```
lua52-5.2.4                    Small, compilable scripting language providing easy access to C code
lua52-pgsql-1.6.8              Lua binding for PostgreSQL
```

- https://freebsd.pkgs.org/13/freebsd-amd64/lua52-pgsql-1.6.8.txz.html
- https://github.com/arcapos/luapgsql#readme
- very undocumented but doesn't seem abandoned


```
lua54-5.4.2                    Powerful, efficient, lightweight, embeddable scripting language
lua54-luasql-postgres-2.6.0    Lua interface to PostgreSQL
```

- https://luarocks.org/modules/tomasguisasola/luasql-postgres
- http://keplerproject.github.io/luasql/
- https://github.com/keplerproject/luasql/archive/refs/tags/2.6.0.tar.gz
- nice [docs](http://keplerproject.github.io/luasql/manual.html) and [examples](http://keplerproject.github.io/luasql/examples.html)

```
dependencies = {
   "lua >= 5.0"
}
external_dependencies = {
   PGSQL = {
      header = "libpq-fe.h"
   }
}
build = {
   type = "builtin",
   modules = {
     ["luasql.postgres"] = {
       sources = { "src/luasql.c", "src/ls_postgres.c" },
       libraries = { "pq" },
       incdirs = { "$(PGSQL_INCDIR)" },
       libdirs = { "$(PGSQL_LIBDIR)" }
     }
   }
}
```

- `pkg install lua54 lua54-luasql-postgres`
- `pushd /usr/local/bin && ln -s lua54 lua && popd`
- `/usr/local/lib/lua/5.4/luasql/postgres.so`


```cpp
env = assert (require"luasql.postgres".postgres())
con = env:connect("host=192.168.1.109 dbname=flaki user=flaki password=staR4lighT")
cur = assert (con:execute"SELECT * FROM public.todoist_updates")
row = cur:fetch ({}, "a")
print(string.format("[%s] %s", row.digest, row.contents))

assert( con:execute(string.format("INSERT INTO todoist_updates(digest, contents) VALUES ('%s', '%s')", con:escape('abcd1234'), con:escape('{"a":42}'))) )

con:close()
env:close()
```

> **passfile** - 
> Specifies the name of the file used to store passwords (see Section 33.15). Defaults to ~/.pgpass
> - [docs](https://www.postgresql.org/docs/12/libpq-connect.html#LIBPQ-PARAMKEYWORDS)



- https://github.com/leafo/pgmoon
- https://luarocks.org/modules/leafo/pgmoon
- https://github.com/openresty/lua-nginx-module#statically-linking-pure-lua-modules
- https://luarocks.org/manifests/leafo/pgmoon-1.12.0-1.src.rock (just a tar.gz)

```
root@webserver0:~ # /usr/local/openresty/luajit/bin/luajit -v
LuaJIT 2.1.0-beta3 -- Copyright (C) 2005-2020 Mike Pall. https://luajit.org/
```


> LuaJIT is compatible to the Lua 5.1 language standard.
> -- https://luajit.org/faq.html

```
pkg install lua51-luasql-postgres-2.6.0
cd /usr/local/openresty/lualib
mkdir luasql
cd luasql
ln -s /usr/local/lib/lua/5.1/luasql/postgres.so
```

PG-side digest:

```
-- CREATE EXTENSION pgcrypto;
SELECT *, encode(hmac(contents::text, '', 'SHA256'),'BASE64') FROM public.todoist_updates WHERE id = 6;
```

- https://www.postgresql.org/docs/12/pgcrypto.html

Lua HMAC:
- https://github.com/adobe-apiplatform/api-gateway-hmac/

Nginx endpoint config:

```
    location = /webhook {
        keepalive_timeout 0;
        content_by_lua_block {
            ngx.req.read_body()
            ngx.ctx.body = ngx.req.get_body_data()
            ngx.ctx.headers = ngx.req.get_headers()

            ngx.status = ngx.HTTP_OK
            ngx.eof()

            local env = assert( require("luasql.postgres").postgres() )
            local con = env:connect("host=0.0.0.0 dbname=flaki user=flaki password=***")

            con:execute(string.format([[
                INSERT INTO todoist_updates(signature, digest, contents)
                VALUES ('%s', ENCODE(HMAC('%s', '<todoist_client_secret>', 'SHA256'),'BASE64'>
            ]], con:escape(ngx.ctx.headers.x_todoist_hmac_sha256), con:escape(ngx.ctx.body), con:escap>

            con:close()
            env:close()
        }
    }
```

Table definition:

```
CREATE TABLE public.todoist_updates
(
    id SERIAL,
    signature character varying(48) NOT NULL,
    digest character varying(48) NOT NULL,
    contents json NOT NULL,
    ts timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT todoist_updates_pkey PRIMARY KEY (id),
    CONSTRAINT valid_signature CHECK (signature::text = digest::text)
)
```

It's important to keep JSON so we can do processing: `contents->'event_name'` => `item:completed` using PostgreSQL's [JSON support](https://www.postgresql.org/docs/12/functions-json.html#FUNCTIONS-JSON-PROCESSING)
