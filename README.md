# mon-sql-jobs-chart

Pequeña app en Node 16/Express que expone `/table1` para consultar `JobActivityLog` en SQL Server y renderizar la tabla en HTML (usable dentro de un `<iframe>`).

## Configuración

Variables de entorno esperadas:

- `DB_SERVER`: host o IP de SQL Server (ej. `192.168.10.80`)
- `DB_PORT`: puerto (por defecto `1433`)
- `DB_USER` / `DB_PASSWORD`: credenciales
- `DB_NAME`: base de datos
- `PORT`: puerto HTTP de la app (por defecto `8090`)

## Uso

1. Instala dependencias: `npm install`
2. Inicia el server: `npm start`
3. Abre: `http://localhost:8090/table1?jobname=Actualiza%20u_clasificacion%20SN`

El HTML responde una tabla lista para ser embebida, por ejemplo:

```html
<iframe src="http://localhost:8090/table1?jobname=Actualiza%20u_clasificacion%20SN" width="100%" height="100%" scrolling="auto" id="iframe" class="widget-url" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"></iframe>
```
