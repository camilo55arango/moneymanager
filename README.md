# Money Manager

Aplicación de finanzas personales (React + Vite + Tailwind + Supabase): saldos de billetera,
inversiones y tarjeta de crédito, pendientes recurrentes, presupuestos por categoría y
proyección del saldo.

## Ejecutar localmente

**Requisitos:** Node.js

1. Instalar dependencias: `npm install`
2. Iniciar la app: `npm run dev` (abre en http://localhost:3000)

## Base de datos

Las migraciones de Supabase están en `supabase/migrations`. Ejecútalas en orden desde el
SQL Editor de Supabase (o con `supabase db push`):

- `..._apply_balance_delta.sql`: ajuste atómico de saldos. Sin ella la app sigue funcionando,
  pero escribe el saldo completo desde el navegador.
- `..._budgets.sql`: tabla de presupuestos. Sin ella la sección de presupuestos no aparece.
